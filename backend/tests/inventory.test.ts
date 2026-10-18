import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { MongoClient, type Db } from 'mongodb';
import { createApp } from '../src/app';
import { createAuthService, hashPassword } from '../src/auth/service';
import { loadConfig } from '../src/config';
import { collections } from '../src/database';
import { migrateTestDatabase } from './helpers/migrations';
import { createInventoryService } from '../src/inventory/service';
import { inventoryCollections } from '../src/inventory/records';
import { calendarDate, expiryBoundary } from '../src/inventory/dates';

process.env.MONGOMS_DOWNLOAD_DIR = resolve(import.meta.dir, '../../.cache/mongodb');
const config = loadConfig({
    JWT_ACCESS_SECRET: 'inventory-test-access-secret-at-least-32-bytes',
    JWT_REFRESH_SECRET: 'inventory-test-refresh-secret-at-least-32-bytes',
});
let mongo: MongoMemoryReplSet;
let client: MongoClient;
let db: Db;
let app: ReturnType<typeof createApp>;
let adminToken: string;
let staffToken: string;

beforeAll(async () => {
    mongo = await MongoMemoryReplSet.create({ binary: { version: '7.0.24' }, replSet: { count: 1 } });
    client = await new MongoClient(mongo.getUri()).connect();
    db = client.db('inventory_tests');
    await migrateTestDatabase(mongo.getUri(), db.databaseName);
    const passwordHash = await hashPassword('inventory-test-password');
    await collections(db).users.insertMany([
        { _id: 'admin', username: 'admin', passwordHash, role: 'admin', enabled: true, createdAt: new Date() },
        { _id: 'staff', username: 'staff', passwordHash, role: 'staff', enabled: true, createdAt: new Date() },
    ]);
    app = createApp(await createAuthService(db, config), config, undefined, createInventoryService(db, client));
    for (const username of ['admin', 'staff']) {
        const response = await request('/api/auth/login', {
            method: 'POST', body: { username, password: 'inventory-test-password' },
        });
        const { accessToken } = await response.json();
        if (username === 'admin') adminToken = accessToken;
        else staffToken = accessToken;
    }
}, 60000);

afterAll(async () => { await client?.close(); await mongo?.stop(); });

function request(path: string, options: { method?: string; token?: string; body?: unknown; key?: string } = {}) {
    return app.handle(new Request(`http://localhost${path}`, {
        method: options.method ?? 'GET',
        headers: {
            Origin: config.appOrigin,
            ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
            ...(options.body ? { 'Content-Type': 'application/json', 'Idempotency-Key': options.key ?? randomUUID() } : {}),
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
    }));
}

const productInput = {
    sku: ' pen-001 ', name: 'ปากกา', unit: 'ด้าม', maxQuantityPerPallet: 100,
    tracksExpiry: false, pickingMinimum: 20, pickingTarget: 100,
};

async function createProduct(overrides: Partial<typeof productInput> = {}) {
    const response = await request('/api/inventory/products', {
        method: 'POST', token: adminToken, body: { ...productInput, sku: randomUUID(), ...overrides },
    });
    expect(response.status).toBe(200);
    return (await response.json()).product;
}

function updateProduct(product: Awaited<ReturnType<typeof createProduct>>, overrides: Record<string, unknown> = {}, key?: string) {
    return request(`/api/inventory/products/${product.id}`, {
        method: 'PUT', token: adminToken, key, body: {
            sku: product.sku, name: product.name, unit: product.unit,
            maxQuantityPerPallet: product.maxQuantityPerPallet, tracksExpiry: product.tracksExpiry,
            pickingMinimum: product.pickingMinimum, pickingTarget: product.pickingTarget,
            active: product.active, revision: product.revision, ...overrides,
        },
    });
}

async function productById(id: string) {
    const { products } = await (await request('/api/inventory/products', { token: adminToken })).json();
    return products.find((product: { id: string }) => product.id === id);
}

async function history(type: string, id: string) {
    return (await (await request(`/api/inventory/history/${type}/${id}`, { token: staffToken })).json()).events;
}

async function locationById(id: string) {
    const { locations } = await (await request('/api/inventory/locations', { token: adminToken })).json();
    return locations.find((location: { id: string }) => location.id === id);
}

async function updateLocation(id: string, overrides: Record<string, unknown>, token = adminToken) {
    const location = await locationById(id);
    return request(`/api/inventory/locations/${id}`, {
        method: 'PUT', token, body: {
            code: location.code, kind: location.kind, zone: location.zone, revision: location.revision,
            active: location.active, inboundBlocked: location.inboundBlocked, outboundBlocked: location.outboundBlocked,
            ...overrides,
        },
    });
}

// Later phases own receipt confirmation. These fixtures model its persisted effects,
// including the permanent first-receipt marker even after a pallet has been cleared.
async function receivedStock(productId: string, quantity: number, locationId: string | null) {
    const data = inventoryCollections(db);
    const now = new Date();
    const lotId = randomUUID();
    await data.products.updateOne({ _id: productId }, { $set: { firstReceivedAt: now } });
    await data.lots.insertOne({
        _id: lotId, code: `LOT-${lotId}`, productId, firstReceivedAt: now,
        revision: 0, createdAt: now, updatedAt: now,
    });
    await data.pallets.insertOne({
        _id: randomUUID(), code: `P-${randomUUID()}`, productId, lotId, quantity, locationId,
        status: quantity > 0 ? 'stored' : locationId ? 'awaiting_clearance' : 'cleared', receivedAt: now,
    });
    return lotId;
}

describe('persistent master data', () => {
    test('authenticates reads, restricts product creation to admin and normalizes SKU codes', async () => {
        expect((await request('/api/inventory/products')).status).toBe(401);
        expect((await request('/api/inventory/products', {
            method: 'POST', token: staffToken, body: productInput,
        })).status).toBe(403);
        const response = await request('/api/inventory/products', {
            method: 'POST', token: adminToken, body: productInput,
        });
        expect(response.status).toBe(200);
        const { product } = await response.json();
        expect(product).toMatchObject({ sku: 'PEN-001', active: true, revision: 0 });
        const listed = await (await request('/api/inventory/products', { token: staffToken })).json();
        expect(listed.products).toContainEqual(product);
    });

    test('replays concurrent retries once, audits once and rejects reusing the key for a different change', async () => {
        const key = randomUUID();
        const body = { ...productInput, sku: randomUUID() };
        const responses = await Promise.all([1, 2].map(() => request('/api/inventory/products', {
            method: 'POST', token: adminToken, body, key,
        })));
        expect(responses.map(response => response.status)).toEqual([200, 200]);
        const first = await responses[0]!.json();
        expect(await responses[1]!.json()).toEqual(first);
        expect(await history('product', first.product.id)).toHaveLength(1);
        expect((await request('/api/inventory/products', {
            method: 'POST', token: adminToken, key, body: { ...body, name: 'different' },
        })).status).toBe(409);
    });

    test('prevents normalized duplicates including inactive products and preserves identity on reactivation', async () => {
        const product = await createProduct({ sku: 'BOX-DUPLICATE' });
        const disabled = await updateProduct(product, { active: false });
        expect(disabled.status).toBe(200);
        const duplicate = await request('/api/inventory/products', {
            method: 'POST', token: adminToken, body: { ...productInput, sku: ' box-duplicate ' },
        });
        expect(duplicate.status).toBe(409);
        expect((await request('/api/inventory/lots', {
            method: 'POST', token: staffToken, body: { productId: product.id },
        })).status).toBe(409);
        const current = await productById(product.id);
        const enabled = await (await updateProduct(current, { active: true })).json();
        expect(enabled.product).toMatchObject({ id: product.id, sku: 'BOX-DUPLICATE', active: true });
    });

    test('locks code, unit and expiry tracking after the first receipt even with no remaining stock', async () => {
        const product = await createProduct();
        await receivedStock(product.id, 0, null);
        for (const change of [{ sku: 'NEW-CODE' }, { unit: 'กล่อง' }, { tracksExpiry: true }]) {
            const response = await updateProduct(product, change);
            expect(response.status).toBe(409);
            expect((await response.json()).error.code).toBe('PRODUCT_FIELDS_LOCKED');
        }
        const renamed = await (await updateProduct(product, { name: 'ชื่อที่ถูกต้อง' })).json();
        expect(renamed.product.name).toBe('ชื่อที่ถูกต้อง');
        const events = await history('product', product.id);
        expect(events).toHaveLength(2);
        expect(events.find((event: { action: string }) => event.action === 'updated')).toMatchObject({
            actorId: 'admin', before: { name: 'ปากกา' }, after: { name: 'ชื่อที่ถูกต้อง' },
        });
    });

    test('rejects unsafe capacity reductions and stale concurrent edits without leaving partial history', async () => {
        const product = await createProduct();
        await receivedStock(product.id, 90, 'A01');
        const rejected = await updateProduct(product, { maxQuantityPerPallet: 80 });
        expect(rejected.status).toBe(409);
        expect((await rejected.json()).error.code).toBe('CAPACITY_IN_USE');
        expect(await history('product', product.id)).toHaveLength(1);
        const results = await Promise.all([
            updateProduct(product, { maxQuantityPerPallet: 95 }),
            updateProduct(product, { maxQuantityPerPallet: 120 }),
        ]);
        expect(results.map(response => response.status).sort()).toEqual([200, 409]);
        expect(await history('product', product.id)).toHaveLength(2);
    });

    test('validates integer quantities and picking thresholds', async () => {
        for (const change of [{ maxQuantityPerPallet: 0 }, { pickingMinimum: 1.5 }, { pickingMinimum: -1 }, { pickingTarget: 19 }, { name: '   ' }]) {
            expect((await request('/api/inventory/products', {
                method: 'POST', token: adminToken, body: { ...productInput, sku: randomUUID(), ...change },
            })).status).toBe(400);
        }
    });

    test('staff creates distinct lots with repeated or missing label numbers and reads Bangkok calendar dates', async () => {
        const product = await createProduct({ tracksExpiry: true });
        const lots = [];
        for (const input of [
            { lotNumber: 'LABEL-1', expiresAt: '2027-01-01' },
            { lotNumber: 'LABEL-1', expiresAt: '2028-01-01' },
            { expiresAt: '2027-02-01' }, { expiresAt: '2027-02-01' },
        ]) {
            const response = await request('/api/inventory/lots', {
                method: 'POST', token: staffToken, body: { productId: product.id, ...input },
            });
            expect(response.status).toBe(200);
            lots.push((await response.json()).lot);
        }
        expect(new Set(lots.map(lot => lot.id)).size).toBe(4);
        expect(new Set(lots.map(lot => lot.code)).size).toBe(4);
        expect(lots[0]).toMatchObject({ lotNumber: 'LABEL-1', expiresAt: '2027-01-01' });
        expect(lots[2]).not.toHaveProperty('lotNumber');
        const listed = await (await request(`/api/inventory/lots?productId=${product.id}`, { token: staffToken })).json();
        expect(listed.lots).toHaveLength(4);
        expect(expiryBoundary(calendarDate('2027-01-01')!).toISOString()).toBe('2027-01-01T17:00:00.000Z');
    });

    test('rejects missing expiry, invalid calendar dates and reversed manufacture/expiry dates', async () => {
        const product = await createProduct({ tracksExpiry: true });
        for (const input of [
            {}, { expiresAt: '2027-02-30' }, { expiresAt: '2027-13-01' },
            { manufacturedAt: '2027-02-01', expiresAt: '2027-01-01' },
        ]) {
            expect((await request('/api/inventory/lots', {
                method: 'POST', token: staffToken, body: { productId: product.id, ...input },
            })).status).toBe(400);
        }
    });

    test('allows unused lot edits by admin but never direct edits to received lot dates', async () => {
        const product = await createProduct();
        const created = await request('/api/inventory/lots', { method: 'POST', token: staffToken, body: { productId: product.id } });
        const { lot } = await created.json();
        const body = { productId: product.id, revision: lot.revision, expiresAt: '2027-01-01' };
        expect((await request(`/api/inventory/lots/${lot.id}`, { method: 'PUT', token: staffToken, body })).status).toBe(403);
        expect((await request(`/api/inventory/lots/${lot.id}`, { method: 'PUT', token: adminToken, body })).status).toBe(200);
        const receivedLotId = await receivedStock(product.id, 0, null);
        const rejected = await request(`/api/inventory/lots/${receivedLotId}`, {
            method: 'PUT', token: adminToken, body: { ...body, revision: 0 },
        });
        expect(rejected.status).toBe(409);
        expect((await rejected.json()).error.code).toBe('LOT_FIELDS_LOCKED');
    });

    test('separates location blocks from occupied-slot edits and requires reasons', async () => {
        const product = await createProduct();
        await receivedStock(product.id, 90, 'A05');
        expect((await updateLocation('A05', { code: 'A99', labelConfirmed: true })).status).toBe(409);
        expect((await updateLocation('A05', { active: false })).status).toBe(409);
        expect((await updateLocation('A05', { inboundBlocked: true })).status).toBe(400);
        expect((await updateLocation('A05', { inboundBlocked: true, reason: 'รอซ่อมป้าย' }, staffToken)).status).toBe(403);
        const blocked = await updateLocation('A05', { inboundBlocked: true, reason: 'รอซ่อมป้าย' });
        expect(blocked.status).toBe(200);
        expect(await locationById('A05')).toMatchObject({ inboundBlocked: true, outboundBlocked: false, active: true });
        const pallets = (await (await request('/api/inventory/pallets', { token: staffToken })).json()).pallets;
        expect(pallets.find((pallet: { locationId: string }) => pallet.locationId === 'A05')).toMatchObject({ quantity: 90, locationId: 'A05' });
    });

    test('protects reserved and zero-quantity slots while retaining history when an empty slot is renamed/reactivated', async () => {
        await inventoryCollections(db).reservations.insertOne({ _id: 'A02', workId: 'pending-move', createdAt: new Date() });
        expect((await updateLocation('A02', { active: false })).status).toBe(409);
        const product = await createProduct();
        await receivedStock(product.id, 0, 'A03');
        expect((await updateLocation('A03', { code: 'A30', labelConfirmed: true })).status).toBe(409);
        expect((await updateLocation('A04', { code: 'A40' })).status).toBe(400);
        expect((await updateLocation('A04', { code: 'A40', labelConfirmed: true })).status).toBe(200);
        expect((await updateLocation('A04', { active: false })).status).toBe(200);
        expect((await updateLocation('A04', { active: true })).status).toBe(200);
        expect(await locationById('A04')).toMatchObject({ id: 'A04', code: 'A40', active: true });
        expect(await history('location', 'A04')).toHaveLength(3);
        expect((await updateLocation('TMP01', { code: 'TMP02', labelConfirmed: true })).status).toBe(409);
        expect((await updateLocation('TMP01', { active: false })).status).toBe(409);
    });
});
