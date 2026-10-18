import { MongoClient } from 'mongodb';
import { collections } from '../src/auth/adapters/mongodb/collections';
import { createInventoryService } from '../src/composition';
import { assertMigrationsReady } from '../src/migrations';

const uri = process.env.MONGODB_URI;
const database = process.env.MONGODB_DATABASE;
if (!uri || !database || !/^(demo_|test_)[a-zA-Z0-9_-]+$/.test(database)) {
    throw new Error('Set explicit MONGODB_URI and a disposable MONGODB_DATABASE beginning with demo_ or test_.');
}

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
try {
    await client.connect();
    const db = client.db(database);
    await assertMigrationsReady(db);
    const admin = await collections(db).users.findOne({ role: 'admin', enabled: true });
    if (!admin) throw new Error('Run the account seed in this demo database first.');
    const inventory = createInventoryService(db, client);
    const actor = { id: admin._id, username: admin.username, role: admin.role };
    for (const input of [
        { sku: 'DEMO-PEN', name: 'ปากกาตัวอย่าง', unit: 'ด้าม', tracksExpiry: false },
        { sku: 'DEMO-BOX', name: 'กล่องตัวอย่าง', unit: 'กล่อง', tracksExpiry: true },
    ]) {
        const existing = (await inventory.listProducts()).products.find(product => product.sku === input.sku);
        const product = existing ?? (await inventory.createProduct({ actor, key: `demo:product:${input.sku}` }, {
            ...input, maxQuantityPerPallet: 100, pickingMinimum: 20, pickingTarget: 100,
        })).product;
        const lots = (await inventory.listLots(product.id)).lots;
        if (!lots.length && product.active) {
            await inventory.createLot({ actor, key: `demo:lot:${product.id}` }, {
                productId: product.id, lotNumber: 'DEMO-LABEL',
                ...(product.tracksExpiry ? { expiresAt: '2027-12-31' } : {}),
            });
        }
    }
    console.log('Demo master data is ready. Existing records were preserved; no stock was created or removed.');
} finally {
    await client.close();
}
