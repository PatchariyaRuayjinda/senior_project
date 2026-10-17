import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'bun:test';
import { resolve } from 'node:path';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { MongoClient, type Db } from 'mongodb';
import { runMigrationCommand } from './helpers/migrations';
import { assertMigrationsReady } from '../src/migrations';
import { connectDatabase } from '../src/database';
import { loadConfig } from '../src/config';

process.env.MONGOMS_DOWNLOAD_DIR = resolve(import.meta.dir, '../../.cache/mongodb');
let mongo: MongoMemoryReplSet;
let client: MongoClient;
let db: Db;
// Deliberately broad records let integration tests submit invalid values to DB validators.
const records = (name: string) => db.collection<{ _id?: string; [key: string]: unknown }>(name);
const database = 'migration_tests';
const product = {
    _id: 'product-x', sku: 'X', name: 'กล่อง', unit: 'กล่อง', maxQuantityPerPallet: 100,
    tracksExpiry: true, pickingMinimum: 20, createdAt: new Date(),
};
const lot = { _id: 'lot-x', productId: 'product-x', lotNumber: 'LOT001', createdAt: new Date() };
const pallet = {
    _id: 'p1', code: 'P001', productId: 'product-x', lotId: 'lot-x', quantity: 50,
    locationId: 'A01', status: 'stored', receivedAt: new Date(),
};

beforeAll(async () => {
    mongo = await MongoMemoryReplSet.create({ binary: { version: '7.0.24' }, replSet: { count: 1 } });
    client = await new MongoClient(mongo.getUri()).connect();
    db = client.db(database);
}, 60000);
afterAll(async () => { await client?.close(); await mongo?.stop(); });
beforeEach(async () => { await db.dropDatabase(); });

async function command(action: string, ok = true) {
    const result = await runMigrationCommand(mongo.getUri(), database, action);
    expect(result.exitCode, result.stderr).toBe(ok ? 0 : 1);
    return result;
}

describe('migration CLI against an isolated replica set', () => {
    test('status on an empty database is read only; up initializes once and startup only checks', async () => {
        const pending = await command('status');
        expect(pending.stdout).toContain('PENDING');
        expect(await db.listCollections().toArray()).toHaveLength(0);
        await expect(assertMigrationsReady(db)).rejects.toThrow('migrate-up');
        await command('up');
        const firstHistory = await records('_migrations').find().sort({ fileName: 1 }).toArray();
        expect(firstHistory).toHaveLength(3);
        expect(await records('warehouses').countDocuments()).toBe(1);
        expect(await records('locations').countDocuments()).toBe(36);
        for (const name of ['products', 'lots', 'pallets', 'users', 'sessions']) {
            expect(await records(name).countDocuments()).toBe(0);
        }
        const layout = await records('locations').aggregate([
            { $group: { _id: '$zone', count: { $sum: 1 } } }, { $sort: { _id: 1 } },
        ]).toArray();
        expect(layout).toEqual([
            { _id: 'A', count: 5 }, { _id: 'B', count: 5 }, { _id: 'C', count: 5 },
            { _id: 'R', count: 20 }, { _id: 'TMP', count: 1 },
        ]);
        await command('up');
        expect(await records('_migrations').find().sort({ fileName: 1 }).toArray()).toEqual(firstHistory);
        expect((await command('status')).stdout).not.toContain('PENDING');
        await assertMigrationsReady(db);
        const indexes = await records('sessions').indexes();
        expect(indexes.find(index => index.name === 'expiresAt_1')?.expireAfterSeconds).toBe(0);
    });

    test('down reverts only the last migration, then up restores the same reference data', async () => {
        await command('up');
        const locations = await records('locations').find().sort({ code: 1 }).toArray();
        await command('down');
        expect(await records('_migrations').countDocuments()).toBe(2);
        expect(await records('locations').countDocuments()).toBe(0);
        expect(await db.listCollections({ name: 'products' }).hasNext()).toBe(true);
        await expect(assertMigrationsReady(db)).rejects.toThrow('migrate-up');
        await command('up');
        expect(await records('locations').find().sort({ code: 1 }).toArray()).toEqual(locations);
        await command('down');
        await command('down');
        expect(await db.listCollections({ name: 'products' }).hasNext()).toBe(false);
        await command('down');
        expect(await db.listCollections({ name: 'users' }).hasNext()).toBe(false);
        await command('up');
        await assertMigrationsReady(db);
    });

    test('validators reject malformed records and indexes enforce lot and occupied-slot uniqueness', async () => {
        await command('up');
        await expect(records('products').insertOne({ ...product, maxQuantityPerPallet: 0 })).rejects.toMatchObject({ code: 121 });
        await expect(records('products').insertOne({ ...product, pickingMinimum: 1.5 })).rejects.toMatchObject({ code: 121 });
        await records('products').insertOne(product);
        await expect(records('products').insertOne({ ...product, _id: 'other' })).rejects.toMatchObject({ code: 11000 });
        await expect(records('lots').insertOne({ ...lot, manufacturedAt: new Date('2026-10-18'), expiresAt: new Date('2026-10-17') })).rejects.toMatchObject({ code: 121 });
        await records('lots').insertOne(lot);
        await expect(records('lots').insertOne({ ...lot, _id: 'duplicate' })).rejects.toMatchObject({ code: 11000 });
        await records('lots').insertOne({ ...lot, _id: 'different-product', productId: 'product-y' });
        await expect(records('pallets').insertOne({ ...pallet, quantity: -1 })).rejects.toMatchObject({ code: 121 });
        await records('pallets').insertOne(pallet);
        await expect(records('pallets').insertOne({ ...pallet, _id: 'p2', code: 'P002' })).rejects.toMatchObject({ code: 11000 });
        await records('pallets').updateOne({ _id: 'p1' }, { $set: { quantity: 0, status: 'awaiting_clearance' } });
        await expect(records('pallets').insertOne({ ...pallet, _id: 'p2', code: 'P002' })).rejects.toMatchObject({ code: 11000 });
        await expect(records('pallets').updateOne({ _id: 'p1' }, { $set: { status: 'cleared' } })).rejects.toMatchObject({ code: 121 });
        await records('pallets').updateOne({ _id: 'p1' }, { $set: { status: 'cleared', locationId: null } });
        await records('pallets').insertOne({ ...pallet, _id: 'p2', code: 'P002' });
        await records('pallets').insertOne({ ...pallet, _id: 'p3', code: 'P003', quantity: 0, status: 'cleared', locationId: null });
        await expect(records('locations').insertOne({ _id: 'bad', code: 'BAD', warehouseId: 'main', kind: 'picking', zone: 'R', capacity: 2 })).rejects.toMatchObject({ code: 121 });
    });

    test('down refuses used, modified or additional reference data before deleting anything', async () => {
        await command('up');
        await records('products').insertOne(product);
        expect((await command('down', false)).stderr).toContain('operational data exists');
        expect(await records('locations').countDocuments()).toBe(36);
        expect(await records('_migrations').countDocuments()).toBe(3);
        await records('products').deleteMany({});
        await records('locations').updateOne({ _id: 'A01' }, { $set: { code: 'CUSTOM' } });
        expect((await command('down', false)).stderr).toContain('was modified');
        expect(await records('locations').countDocuments()).toBe(36);
        await records('locations').updateOne({ _id: 'A01' }, { $set: { code: 'A01' } });
        await records('future_receipts').insertOne({ note: 'must be retained' });
        await command('down', false);
        expect(await records('future_receipts').countDocuments()).toBe(1);
        await records('future_receipts').deleteMany({});
        await records('locations').insertOne({ _id: 'R21', code: 'R21', warehouseId: 'main', kind: 'reserve', zone: 'R', capacity: 1 });
        expect((await command('down', false)).stderr).toContain('Additional records');
        expect(await records('locations').countDocuments()).toBe(37);
    });

    test('schema down preflights all collections and auth down preserves seeded users', async () => {
        await command('up');
        await command('down');
        await records('products').insertOne(product);
        await command('down', false);
        expect(await db.listCollections({ name: 'pallets' }).hasNext()).toBe(true);
        expect(await records('products').countDocuments()).toBe(1);
        await records('products').deleteMany({});
        await command('down');
        await records('users').insertOne({ _id: 'admin', username: 'admin', passwordHash: 'hash', role: 'admin', enabled: true, createdAt: new Date() });
        expect((await command('down', false)).stderr).toContain('users contains data');
        expect(await db.listCollections({ name: 'sessions' }).hasNext()).toBe(true);
    });

    test('an atomic runner lock prevents competing up/down and is visible to status/startup', async () => {
        await records('_migration_lock').insertOne({ _id: 'runner', owner: 'another-runner', createdAt: new Date() });
        expect((await command('up', false)).stderr).toContain('holds the lock');
        expect((await command('down', false)).stderr).toContain('holds the lock');
        expect((await command('status')).stdout).toContain('Migration lock: active');
        await expect(assertMigrationsReady(db)).rejects.toThrow('migration is running');
        expect(await records('_migration_lock').findOne({ _id: 'runner' })).toMatchObject({ owner: 'another-runner' });
        await records('_migration_lock').deleteMany({});
        const results = await Promise.all([
            runMigrationCommand(mongo.getUri(), database, 'up'), runMigrationCommand(mongo.getUri(), database, 'up'),
        ]);
        expect(results.some(result => result.exitCode === 0)).toBe(true);
        expect(await records('_migrations').countDocuments()).toBe(3);
        expect(await records('locations').countDocuments()).toBe(36);
        expect(await records('_migration_lock').countDocuments()).toBe(0);
    });

    test('startup refuses pending migrations without creating collections or indexes', async () => {
        const config = loadConfig({ JWT_ACCESS_SECRET: 'test-access-secret-with-at-least-32-bytes', JWT_REFRESH_SECRET: 'test-refresh-secret-with-at-least-32-bytes', MONGODB_URI: mongo.getUri(), MONGODB_DATABASE: database });
        await expect(connectDatabase(config)).rejects.toThrow('migrate-up');
        expect(await db.listCollections().toArray()).toHaveLength(0);
        await command('up');
        const connection = await connectDatabase(config);
        await connection.client.close();
    });

    test('a failed schema migration can resume without losing previously applied migrations', async () => {
        await db.createCollection('products');
        expect((await command('up', false)).stderr).toContain('different schema');
        expect(await records('_migrations').countDocuments()).toBe(1);
        expect(await records('_migration_lock').countDocuments()).toBe(0);
        expect(await db.listCollections({ name: 'warehouses' }).hasNext()).toBe(true);
        await records('products').drop();
        await command('up');
        await assertMigrationsReady(db);
        // Simulate seed commit followed by failure to append its changelog record.
        await records('_migrations').deleteOne({ fileName: '202610180003-base-warehouse.js' });
        await command('up');
        expect(await records('locations').countDocuments()).toBe(36);
        expect(await records('_migrations').countDocuments()).toBe(3);
    });

    test('unknown or out-of-order history is rejected without applying or undoing schema', async () => {
        await command('up');
        await records('_migrations').insertOne({ fileName: '209901010001-future.js', appliedAt: new Date() });
        expect((await command('status', false)).stderr).toContain('unknown migrations');
        await command('up', false);
        await command('down', false);
        await expect(assertMigrationsReady(db)).rejects.toThrow('migrate-status');
        await records('_migrations').deleteOne({ fileName: '209901010001-future.js' });
        await records('_migrations').deleteOne({ fileName: '202610180002-inventory-schema.js' });
        expect((await command('up', false)).stderr).toContain('out of order');
        await command('down', false);
        expect(await records('locations').countDocuments()).toBe(36);
    });

    test('CLI requires an explicit target and does not expose credentials on a driver failure', async () => {
        const missing = await runMigrationCommand('', database, 'status');
        expect(missing.exitCode).toBe(1);
        expect(missing.stderr).toContain('explicit MONGODB_URI');
        const failed = await runMigrationCommand('mongodb://private-user:private-password@bad host', database, 'status');
        expect(failed.exitCode).toBe(1);
        expect(failed.stderr).not.toContain('private-user');
        expect(failed.stderr).not.toContain('private-password');
        expect(failed.stderr).toContain('Credentials are omitted');
        expect(await db.listCollections().toArray()).toHaveLength(0);
    });
});
