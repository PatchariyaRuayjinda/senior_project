import { afterAll, beforeAll, expect, test } from 'bun:test';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';
import { collections } from '../src/database';
import { createAuthService, hashPassword } from '../src/auth/service';
import { createInventoryService } from '../src/inventory/service';
import { createApp } from '../src/app';
import { loadConfig } from '../src/config';
import { migrateTestDatabase } from './helpers/migrations';

process.env.MONGOMS_DOWNLOAD_DIR = resolve(import.meta.dir, '../../.cache/mongodb');
const database = 'test_inventory_demo';
let mongo: MongoMemoryReplSet;
let client: MongoClient;
let app: ReturnType<typeof createApp>;
let token: string;

beforeAll(async () => {
    mongo = await MongoMemoryReplSet.create({ binary: { version: '7.0.24' }, replSet: { count: 1 } });
    client = await new MongoClient(mongo.getUri()).connect();
    const db = client.db(database);
    await migrateTestDatabase(mongo.getUri(), database);
    const config = loadConfig({
        JWT_ACCESS_SECRET: 'demo-test-access-secret-at-least-32-bytes',
        JWT_REFRESH_SECRET: 'demo-test-refresh-secret-at-least-32-bytes',
    });
    await collections(db).users.insertOne({
        _id: 'demo-admin', username: 'admin', passwordHash: await hashPassword('demo-test-password'),
        role: 'admin', enabled: true, createdAt: new Date(),
    });
    const auth = await createAuthService(db, config);
    token = (await auth.login('admin', 'demo-test-password')).accessToken;
    app = createApp(auth, config, undefined, createInventoryService(db, client));
}, 60000);

afterAll(async () => { await client?.close(); await mongo?.stop(); });

async function seed(targetDatabase: string) {
    const script = fileURLToPath(new URL('../scripts/seed-inventory-demo.ts', import.meta.url));
    const child = Bun.spawn([process.execPath, script], {
        env: { ...process.env, MONGODB_URI: mongo.getUri(), MONGODB_DATABASE: targetDatabase },
        stdout: 'pipe', stderr: 'pipe',
    });
    const [exitCode, stdout, stderr] = await Promise.all([
        child.exited, new Response(child.stdout).text(), new Response(child.stderr).text(),
    ]);
    return { exitCode, stdout, stderr };
}

async function read(path: string) {
    return (await app.handle(new Request(`http://localhost/api/inventory/${path}`, {
        headers: { Authorization: `Bearer ${token}` },
    }))).json();
}

test('demo seed is repeatable, keeps user edits and creates no stock', async () => {
    const first = await seed(database);
    expect(first.exitCode, first.stderr).toBe(0);
    const { products } = await read('products');
    expect(products.map((product: { sku: string }) => product.sku)).toEqual(['DEMO-BOX', 'DEMO-PEN']);
    expect((await read('lots')).lots).toHaveLength(2);
    expect((await read('pallets')).pallets).toHaveLength(0);
    const product = products[0];
    const { id, revision, sku, unit, maxQuantityPerPallet, tracksExpiry, pickingMinimum, pickingTarget } = product;
    const edited = await app.handle(new Request(`http://localhost/api/inventory/products/${id}`, {
        method: 'PUT', headers: {
            Origin: 'http://localhost:5173', Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json', 'Idempotency-Key': 'demo-test:rename',
        },
        body: JSON.stringify({
            revision, sku, unit, maxQuantityPerPallet, tracksExpiry, pickingMinimum, pickingTarget,
            name: 'ชื่อที่ผู้ใช้แก้เอง', active: true,
        }),
    }));
    expect(edited.status).toBe(200);
    expect((await seed(database)).exitCode).toBe(0);
    expect((await read('products')).products[0]).toMatchObject({ name: 'ชื่อที่ผู้ใช้แก้เอง' });
    expect((await read('lots')).lots).toHaveLength(2);
    expect((await read('pallets')).pallets).toHaveLength(0);
});

test('demo seed refuses an application database without the disposable prefix', async () => {
    const result = await seed('inventory_dev');
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain('disposable MONGODB_DATABASE');
});
