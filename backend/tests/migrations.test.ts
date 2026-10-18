import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'bun:test';
import { resolve } from 'node:path';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { MongoClient, type Db } from 'mongodb';
import { runMigrationCommand } from './helpers/migrations';
import { assertMigrationsReady } from '../src/migrations';
import { connectDatabase } from '../src/database';
import { loadConfig } from '../src/config';

process.env.MONGOMS_DOWNLOAD_DIR = resolve(import.meta.dir, '../../.cache/mongodb');

const DATABASE_NAME = 'migration_tests';
const SEED_MIGRATION = '202610180003-base-warehouse.js';
const INVENTORY_MIGRATION = '202610180002-inventory-schema.js';
const MASTER_DATA_MIGRATION = '202610180004-master-data.js';
const SCHEMA_VALIDATION_ERROR = { code: 121 };
const DUPLICATE_KEY_ERROR = { code: 11000 };

let mongo: MongoMemoryReplSet;
let client: MongoClient;
let db: Db;

const legacyProduct = {
    _id: 'product-x',
    sku: 'X',
    name: 'กล่อง',
    unit: 'กล่อง',
    maxQuantityPerPallet: 100,
    tracksExpiry: true,
    pickingMinimum: 20,
    createdAt: new Date(),
};
const product = {
    ...legacyProduct, pickingTarget: 100, active: true, firstReceivedAt: null,
    revision: 0, updatedAt: legacyProduct.createdAt,
};
const lot = {
    _id: 'lot-x',
    productId: product._id,
    lotNumber: 'LOT001',
    createdAt: new Date(),
    code: 'LOT-X', firstReceivedAt: null, revision: 0, updatedAt: new Date(),
};
const pallet = {
    _id: 'p1',
    code: 'P001',
    productId: product._id,
    lotId: lot._id,
    quantity: 50,
    locationId: 'A01',
    status: 'stored',
    receivedAt: new Date(),
};

beforeAll(async () => {
    mongo = await MongoMemoryReplSet.create({
        binary: { version: '7.0.24' },
        replSet: { count: 1 },
    });
    client = await new MongoClient(mongo.getUri()).connect();
    db = client.db(DATABASE_NAME);
}, 60000);

afterAll(async () => {
    await client?.close();
    await mongo?.stop();
});

beforeEach(async () => {
    await db.dropDatabase();
});

// Broad records deliberately allow malformed values through to the DB validators.
function records(name: string) {
    return db.collection<{ _id?: string; [key: string]: unknown }>(name);
}

async function command(action: string) {
    const result = await runMigrationCommand(mongo.getUri(), DATABASE_NAME, action);
    expect(result.exitCode, result.stderr).toBe(0);
    return result;
}

async function rejectedCommand(action: string) {
    const result = await runMigrationCommand(mongo.getUri(), DATABASE_NAME, action);
    expect(result.exitCode, result.stderr).toBe(1);
    return result;
}

async function migrationHistory() {
    return records('_migrations').find().sort({ fileName: 1 }).toArray();
}

function testConfig() {
    return loadConfig({
        JWT_ACCESS_SECRET: 'test-access-secret-with-at-least-32-bytes',
        JWT_REFRESH_SECRET: 'test-refresh-secret-with-at-least-32-bytes',
        MONGODB_URI: mongo.getUri(),
        MONGODB_DATABASE: DATABASE_NAME,
    });
}

describe('status on an empty database', () => {
    test('lists pending migrations without creating collections', async () => {
        const result = await command('status');

        expect(result.stdout).toContain('PENDING');
        expect(await db.listCollections().toArray()).toHaveLength(0);
    });
});

describe('applying migrations', () => {
    beforeEach(async () => {
        await command('up');
    });

    test('creates one warehouse and 36 empty slots without accounts or stock', async () => {
        expect(await migrationHistory()).toHaveLength(4);
        expect(await records('warehouses').countDocuments()).toBe(1);
        expect(await records('locations').countDocuments()).toBe(36);
        for (const name of ['products', 'lots', 'pallets', 'users', 'sessions']) {
            expect(await records(name).countDocuments()).toBe(0);
        }

        const layout = await records('locations').aggregate([
            { $group: { _id: '$zone', count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
        ]).toArray();
        expect(layout).toEqual([
            { _id: 'A', count: 5 },
            { _id: 'B', count: 5 },
            { _id: 'C', count: 5 },
            { _id: 'R', count: 20 },
            { _id: 'TMP', count: 1 },
        ]);
    });

    test('repeated up leaves applied history and reference data unchanged', async () => {
        const originalHistory = await migrationHistory();
        const originalLocations = await records('locations').find().sort({ code: 1 }).toArray();

        await command('up');

        expect(await migrationHistory()).toEqual(originalHistory);
        expect(await records('locations').find().sort({ code: 1 }).toArray()).toEqual(originalLocations);
        expect((await command('status')).stdout).not.toContain('PENDING');
    });

    test('preserves the session expiry TTL index', async () => {
        const indexes = await records('sessions').indexes();
        const expiryIndex = indexes.find(index => index.name === 'expiresAt_1');

        expect(expiryIndex?.expireAfterSeconds).toBe(0);
    });
});

describe('rolling back unused data', () => {
    beforeEach(async () => {
        await command('up');
    });

    test('down reverts only the latest migration and up restores its reference data', async () => {
        const originalLocations = await records('locations').find().sort({ code: 1 }).toArray();

        await command('down');

        expect(await migrationHistory()).toHaveLength(3);
        expect(await records('locations').countDocuments()).toBe(36);
        expect(await records('locations').findOne({ _id: 'A01' })).not.toHaveProperty('active');
        expect(await db.listCollections({ name: 'products' }).hasNext()).toBe(true);
        await expect(assertMigrationsReady(db)).rejects.toThrow('migrate-up');

        await command('up');

        const restoredLocations = await records('locations').find().sort({ code: 1 }).toArray();
        expect(restoredLocations.map(({ updatedAt, ...fields }) => fields))
            .toEqual(originalLocations.map(({ updatedAt, ...fields }) => fields));
    });

    test('all migrations can be reverted and applied again on an unused database', async () => {
        await command('down'); // Master-data schema and metadata.
        await command('down'); // Reference data.
        await command('down'); // Inventory schema.
        expect(await db.listCollections({ name: 'products' }).hasNext()).toBe(false);

        await command('down'); // Auth schema.
        expect(await db.listCollections({ name: 'users' }).hasNext()).toBe(false);

        await command('up');
        await assertMigrationsReady(db);
    });
});

describe('schema validation and unique indexes', () => {
    beforeEach(async () => {
        await command('up');
    });

    test('rejects nonpositive pallet capacity and fractional inventory quantities', async () => {
        await expect(records('products').insertOne({
            ...product,
            maxQuantityPerPallet: 0,
        })).rejects.toMatchObject(SCHEMA_VALIDATION_ERROR);

        await expect(records('products').insertOne({
            ...product,
            pickingMinimum: 1.5,
        })).rejects.toMatchObject(SCHEMA_VALIDATION_ERROR);
    });

    test('rejects duplicate SKUs', async () => {
        await records('products').insertOne(product);

        await expect(records('products').insertOne({
            ...product,
            _id: 'other',
        })).rejects.toMatchObject(DUPLICATE_KEY_ERROR);
    });

    test('rejects expiry before manufacture', async () => {
        await expect(records('lots').insertOne({
            ...lot,
            manufacturedAt: new Date('2026-10-18'),
            expiresAt: new Date('2026-10-17'),
        })).rejects.toMatchObject(SCHEMA_VALIDATION_ERROR);
    });

    test('manufacturer lot numbers may repeat but internal lot codes remain unique', async () => {
        await records('lots').insertOne(lot);

        await expect(records('lots').insertOne({
            ...lot,
            _id: 'duplicate',
        })).rejects.toMatchObject(DUPLICATE_KEY_ERROR);

        await records('lots').insertOne({
            ...lot,
            _id: 'same-label',
            code: 'LOT-SAME-LABEL',
        });
        await records('lots').insertOne({
            ...lot,
            _id: 'different-product',
            code: 'LOT-Y',
            productId: 'product-y',
        });
    });

    test('rejects negative pallet quantities', async () => {
        await expect(records('pallets').insertOne({
            ...pallet,
            quantity: -1,
        })).rejects.toMatchObject(SCHEMA_VALIDATION_ERROR);
    });

    test('stored pallets prevent another pallet from occupying their slot', async () => {
        await records('pallets').insertOne(pallet);

        await expect(records('pallets').insertOne({
            ...pallet,
            _id: 'p2',
            code: 'P002',
        })).rejects.toMatchObject(DUPLICATE_KEY_ERROR);
    });

    test('empty pallets awaiting clearance still occupy their slot', async () => {
        await records('pallets').insertOne({
            ...pallet,
            quantity: 0,
            status: 'awaiting_clearance',
        });

        await expect(records('pallets').insertOne({
            ...pallet,
            _id: 'p2',
            code: 'P002',
        })).rejects.toMatchObject(DUPLICATE_KEY_ERROR);
    });

    test('clearing a pallet requires releasing its slot and allows multiple cleared pallets', async () => {
        await records('pallets').insertOne({
            ...pallet,
            quantity: 0,
            status: 'awaiting_clearance',
        });
        await expect(records('pallets').updateOne(
            { _id: pallet._id },
            { $set: { status: 'cleared' } },
        )).rejects.toMatchObject(SCHEMA_VALIDATION_ERROR);

        await records('pallets').updateOne(
            { _id: pallet._id },
            { $set: { status: 'cleared', locationId: null } },
        );
        await records('pallets').insertOne({ ...pallet, _id: 'p2', code: 'P002' });
        await records('pallets').insertOne({
            ...pallet,
            _id: 'p3',
            code: 'P003',
            quantity: 0,
            status: 'cleared',
            locationId: null,
        });
    });

    test('rejects invalid location configuration', async () => {
        await expect(records('locations').insertOne({
            _id: 'bad',
            code: 'BAD',
            warehouseId: 'main',
            kind: 'picking',
            zone: 'R',
            capacity: 2,
        })).rejects.toMatchObject(SCHEMA_VALIDATION_ERROR);
    });
});

describe('rollback protection', () => {
    beforeEach(async () => {
        await command('up');
    });

    test('inventory data prevents deleting reference data or its history', async () => {
        await records('products').insertOne(product);

        const result = await rejectedCommand('down');

        expect(result.stderr).toContain('operational data exists');
        expect(await records('locations').countDocuments()).toBe(36);
        expect(await migrationHistory()).toHaveLength(4);
    });

    test('modified seed records prevent deleting reference data', async () => {
        await records('locations').updateOne({ _id: 'A01' }, { $set: { code: 'CUSTOM' } });

        const result = await rejectedCommand('down');

        expect(result.stderr).toContain('was modified');
        expect(await records('locations').countDocuments()).toBe(36);
    });

    test('future operational collections also prevent deleting reference data', async () => {
        await records('future_receipts').insertOne({ note: 'must be retained' });

        await rejectedCommand('down');

        expect(await records('future_receipts').countDocuments()).toBe(1);
        expect(await records('locations').countDocuments()).toBe(36);
    });

    test('additional locations prevent rolling back the warehouse seed', async () => {
        await records('locations').insertOne({
            _id: 'R21',
            code: 'R21',
            warehouseId: 'main',
            kind: 'reserve',
            zone: 'R',
            capacity: 1,
            active: true, inboundBlocked: false, outboundBlocked: false, blockReason: null,
            revision: 0, updatedAt: new Date(),
        });

        const result = await rejectedCommand('down');

        expect(result.stderr).toContain('Additional records');
        expect(await records('locations').countDocuments()).toBe(37);
    });

    test('schema rollback checks every collection before dropping any', async () => {
        await command('down');
        await records('products').insertOne(legacyProduct);

        await rejectedCommand('down');

        expect(await db.listCollections({ name: 'pallets' }).hasNext()).toBe(true);
        expect(await records('products').countDocuments()).toBe(1);
    });

    test('auth rollback preserves seeded users and other auth collections', async () => {
        await command('down');
        await command('down');
        await command('down');
        await records('users').insertOne({
            _id: 'admin',
            username: 'admin',
            passwordHash: 'hash',
            role: 'admin',
            enabled: true,
            createdAt: new Date(),
        });

        const result = await rejectedCommand('down');

        expect(result.stderr).toContain('users contains data');
        expect(await records('users').countDocuments()).toBe(1);
        expect(await db.listCollections({ name: 'sessions' }).hasNext()).toBe(true);
    });
});

describe('migration runner locking', () => {
    test('an existing lock blocks writes, remains visible and belongs to its original owner', async () => {
        await records('_migration_lock').insertOne({
            _id: 'runner',
            owner: 'another-runner',
            createdAt: new Date(),
        });

        expect((await rejectedCommand('up')).stderr).toContain('holds the lock');
        expect((await rejectedCommand('down')).stderr).toContain('holds the lock');
        expect((await command('status')).stdout).toContain('Migration lock: active');
        await expect(assertMigrationsReady(db)).rejects.toThrow('migration is running');
        expect(await records('_migration_lock').findOne({ _id: 'runner' })).toMatchObject({
            owner: 'another-runner',
        });
    });

    test('concurrent runners apply migrations once and release their lock', async () => {
        const results = await Promise.all([
            runMigrationCommand(mongo.getUri(), DATABASE_NAME, 'up'),
            runMigrationCommand(mongo.getUri(), DATABASE_NAME, 'up'),
        ]);

        expect(results.some(result => result.exitCode === 0)).toBe(true);
        expect(await migrationHistory()).toHaveLength(4);
        expect(await records('locations').countDocuments()).toBe(36);
        expect(await records('_migration_lock').countDocuments()).toBe(0);
    });
});

describe('API startup readiness', () => {
    test('pending migrations prevent startup without creating collections or indexes', async () => {
        await expect(assertMigrationsReady(db)).rejects.toThrow('migrate-up');
        await expect(connectDatabase(testConfig())).rejects.toThrow('migrate-up');

        expect(await db.listCollections().toArray()).toHaveLength(0);
    });

    test('matching migration history allows startup', async () => {
        await command('up');

        const connection = await connectDatabase(testConfig());
        await connection.client.close();
    });
});

describe('retrying failed migrations', () => {
    test('a schema failure preserves applied history and can resume after its cause is fixed', async () => {
        await db.createCollection('products');

        const result = await rejectedCommand('up');

        expect(result.stderr).toContain('different schema');
        expect(await migrationHistory()).toHaveLength(1);
        expect(await records('_migration_lock').countDocuments()).toBe(0);
        expect(await db.listCollections({ name: 'warehouses' }).hasNext()).toBe(true);

        await records('products').drop();
        await command('up');
        await assertMigrationsReady(db);
    });

    test('a committed seed can be retried if its changelog write failed', async () => {
        await command('up');
        await command('down'); // Return to the schema owned by the seed migration.
        // Simulate seed commit followed by failure to append its changelog record.
        await records('_migrations').deleteOne({ fileName: SEED_MIGRATION });

        await command('up');

        expect(await records('locations').countDocuments()).toBe(36);
        expect(await migrationHistory()).toHaveLength(4);
    });
});

describe('migration history compatibility', () => {
    beforeEach(async () => {
        await command('up');
    });

    test('unknown migrations are reported and prevent both writes and startup', async () => {
        await records('_migrations').insertOne({
            fileName: '209901010001-future.js',
            appliedAt: new Date(),
        });

        expect((await rejectedCommand('status')).stderr).toContain('unknown migrations');
        await rejectedCommand('up');
        await rejectedCommand('down');
        await expect(assertMigrationsReady(db)).rejects.toThrow('migrate-status');
        expect(await records('locations').countDocuments()).toBe(36);
    });

    test('out-of-order history prevents applying or undoing migrations', async () => {
        await records('_migrations').deleteOne({ fileName: INVENTORY_MIGRATION });

        expect((await rejectedCommand('up')).stderr).toContain('out of order');
        await rejectedCommand('down');
        expect(await records('locations').countDocuments()).toBe(36);
    });
});

describe('master-data upgrade compatibility', () => {
    beforeEach(async () => {
        await command('up');
        await command('down'); // Build the exact pre-Phase-1 schema through the real CLI.
    });

    test('backfills operational flags without resetting stock or changing stable location identities', async () => {
        await records('products').insertOne({ ...legacyProduct, sku: ' box-001 ' });
        await records('lots').insertOne({
            _id: lot._id, productId: product._id, lotNumber: lot.lotNumber, createdAt: lot.createdAt,
            expiresAt: new Date('2027-01-01T00:00:00+07:00'),
        });
        await records('pallets').insertOne(pallet);
        await command('up');
        expect(await records('products').findOne({ _id: product._id })).toMatchObject({
            sku: 'BOX-001', pickingTarget: 100, active: true, firstReceivedAt: pallet.receivedAt,
        });
        expect(await records('lots').findOne({ _id: lot._id })).toMatchObject({
            code: `LOT-${lot._id}`, firstReceivedAt: pallet.receivedAt, lotNumber: 'LOT001',
        });
        expect(await records('pallets').findOne({ _id: pallet._id })).toEqual(pallet);
        expect(await records('locations').findOne({ _id: 'A01' })).toMatchObject({
            code: 'A01', active: true, inboundBlocked: false, outboundBlocked: false,
        });
        await rejectedCommand('down');
        expect(await migrationHistory()).toHaveLength(4);
    });

    test('refuses SKU normalization collisions before changing existing records or validators', async () => {
        await records('products').insertMany([
            { ...legacyProduct, sku: 'box-001' },
            { ...legacyProduct, _id: 'other', sku: ' BOX-001 ' },
        ]);
        expect((await rejectedCommand('up')).stderr).toContain('SKU normalization');
        expect(await records('products').findOne({ _id: product._id })).not.toHaveProperty('active');
        expect(await migrationHistory()).toHaveLength(3);
        expect(await records('products').countDocuments()).toBe(2);
    });

    test('can retry committed master-data changes without regenerating reference metadata', async () => {
        await command('up');
        const before = await records('locations').find().sort({ code: 1 }).toArray();
        await records('_migrations').deleteOne({ fileName: MASTER_DATA_MIGRATION });
        await command('up');
        expect(await records('locations').find().sort({ code: 1 }).toArray()).toEqual(before);
        expect(await migrationHistory()).toHaveLength(4);
    });

    test('can retry a completed rollback if removing the changelog failed', async () => {
        await command('up');
        const applied = await records('_migrations').findOne({ fileName: MASTER_DATA_MIGRATION });
        expect(applied).not.toBeNull();
        await command('down');
        await records('_migrations').insertOne(applied!);
        await command('down');
        expect(await migrationHistory()).toHaveLength(3);
        expect(await records('locations').findOne({ _id: 'A01' })).not.toHaveProperty('active');
        await command('up');
        await assertMigrationsReady(db);
    });

    test('refuses rollback when audit history exists even if the master entity is absent', async () => {
        await command('up');
        await records('inventoryEvents').insertOne({
            _id: 'event', entityType: 'product', entityId: 'retained-history', action: 'created',
            actorId: 'admin', actorUsername: 'admin', createdAt: new Date(), before: null, after: { sku: 'BOX' },
        });
        await rejectedCommand('down');
        expect(await records('inventoryEvents').countDocuments()).toBe(1);
        expect(await records('locations').findOne({ _id: 'A01' })).toHaveProperty('active', true);
    });
});

describe('CLI configuration and error reporting', () => {
    test('requires an explicit database target', async () => {
        const result = await runMigrationCommand('', DATABASE_NAME, 'status');

        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain('explicit MONGODB_URI');
        expect(await db.listCollections().toArray()).toHaveLength(0);
    });

    test('does not expose credentials when the driver fails', async () => {
        const result = await runMigrationCommand(
            'mongodb://private-user:private-password@bad host',
            DATABASE_NAME,
            'status',
        );

        expect(result.exitCode).toBe(1);
        expect(result.stderr).not.toContain('private-user');
        expect(result.stderr).not.toContain('private-password');
        expect(result.stderr).toContain('Credentials are omitted');
        expect(await db.listCollections().toArray()).toHaveLength(0);
    });
});
