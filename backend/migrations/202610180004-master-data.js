import { isDeepStrictEqual } from 'node:util';
import { createCollection, locations, refuse } from '../migration-support/v1.js';
import {
    productSchema, lotSchema, locationSchema, eventSchema, mutationSchema,
    reservationSchema, sourceSchema, oldProductSchema, oldLotSchema, oldLocationSchema,
} from '../migration-support/v2.js';

const addedCollections = ['inventoryEvents', 'inventoryMutations', 'locationReservations', 'stockSources'];

export async function up(db) {
    const products = await db.collection('products').find().toArray();
    const normalizedSkus = products.map(product => product.sku.trim().toUpperCase());
    if (normalizedSkus.some(sku => !sku) || new Set(normalizedSkus).size !== products.length) {
        refuse('SKU normalization would create empty or duplicate codes. Resolve them before retrying.');
    }

    await createCollection(db, 'inventoryEvents', eventSchema, [
        { key: { entityType: 1, entityId: 1, createdAt: -1 }, name: 'entity_history' },
    ]);
    await createCollection(db, 'inventoryMutations', mutationSchema);
    await createCollection(db, 'locationReservations', reservationSchema);
    await createCollection(db, 'stockSources', sourceSchema, [
        { key: { palletId: 1, fifoAt: 1 }, name: 'pallet_source_order' },
        { key: { sourceType: 1, sourceId: 1 }, name: 'source_provenance' },
    ]);
    for (const [name, validator] of [['products', productSchema], ['lots', lotSchema], ['locations', locationSchema]]) {
        await db.command({ collMod: name, validator, validationLevel: 'strict', validationAction: 'error' });
    }

    const now = new Date();
    for (const product of products) {
        const firstPallet = await db.collection('pallets').findOne({ productId: product._id }, { sort: { receivedAt: 1 } });
        await db.collection('products').updateOne({ _id: product._id }, { $set: {
            sku: product.sku.trim().toUpperCase(),
            pickingTarget: product.pickingTarget ?? Math.max(product.pickingMinimum, product.maxQuantityPerPallet),
            active: product.active ?? true,
            firstReceivedAt: product.firstReceivedAt ?? firstPallet?.receivedAt ?? null,
            revision: product.revision ?? 0, updatedAt: product.updatedAt ?? product.createdAt,
        } });
    }
    for await (const lot of db.collection('lots').find()) {
        const firstPallet = await db.collection('pallets').findOne({ lotId: lot._id }, { sort: { receivedAt: 1 } });
        await db.collection('lots').updateOne({ _id: lot._id }, { $set: {
            code: lot.code ?? `LOT-${lot._id}`,
            firstReceivedAt: lot.firstReceivedAt ?? firstPallet?.receivedAt ?? null,
            revision: lot.revision ?? 0, updatedAt: lot.updatedAt ?? lot.createdAt,
        } });
    }
    for await (const location of db.collection('locations').find()) {
        await db.collection('locations').updateOne({ _id: location._id }, { $set: {
            active: location.active ?? true, inboundBlocked: location.inboundBlocked ?? false,
            outboundBlocked: location.outboundBlocked ?? false, blockReason: location.blockReason ?? null,
            revision: location.revision ?? 0, updatedAt: location.updatedAt ?? now,
        } });
    }
    const indexes = await db.collection('lots').indexes();
    if (indexes.some(index => index.name === 'product_lot_unique')) await db.collection('lots').dropIndex('product_lot_unique');
    await db.collection('lots').createIndexes([
        { key: { code: 1 }, name: 'lot_code_unique', unique: true },
        { key: { productId: 1, lotNumber: 1 }, name: 'product_label_lot' },
    ]);
}

export async function down(db, client) {
    // Refuse before any mutation: downgrading would discard fields and audit history.
    const exempt = new Set(['warehouses', 'locations', 'users', 'sessions', '_migrations', '_migration_lock']);
    for (const { name } of await db.listCollections({}, { nameOnly: true }).toArray()) {
        if (!exempt.has(name) && await db.collection(name).findOne({})) {
            refuse('Cannot roll back master data while inventory or operational data exists.');
        }
    }
    const current = await db.collection('locations').find().toArray();
    if (current.length !== locations.length) refuse('Additional records prevent rolling back master data.');
    for (const record of current) {
        const { active, inboundBlocked, outboundBlocked, blockReason, revision, updatedAt, ...original } = record;
        const untouchedMetadata = active === true && inboundBlocked === false && outboundBlocked === false
            && blockReason === null && revision === 0;
        const alreadyRestored = [active, inboundBlocked, outboundBlocked, blockReason, revision, updatedAt]
            .every(value => value === undefined);
        if (!isDeepStrictEqual(original, locations.find(location => location._id === record._id))
            || (!untouchedMetadata && !alreadyRestored)) {
            refuse('A seed record was modified. Existing records were preserved.');
        }
    }

    // Change validators first; removing backfilled fields is a single transaction.
    await db.command({ collMod: 'locations', validator: oldLocationSchema });
    const session = client.startSession();
    try {
        await session.withTransaction(async () => {
            await db.collection('locations').updateMany({}, { $unset: {
                active: '', inboundBlocked: '', outboundBlocked: '', blockReason: '', revision: '', updatedAt: '',
            } }, { session });
        });
    } finally {
        await session.endSession();
    }
    await db.command({ collMod: 'products', validator: oldProductSchema });
    await db.command({ collMod: 'lots', validator: oldLotSchema });
    const indexes = await db.collection('lots').indexes();
    for (const name of ['lot_code_unique', 'product_label_lot']) {
        if (indexes.some(index => index.name === name)) await db.collection('lots').dropIndex(name);
    }
    await db.collection('lots').createIndex({ productId: 1, lotNumber: 1 }, { name: 'product_lot_unique', unique: true });
    for (const name of addedCollections) {
        if (await db.listCollections({ name }).hasNext()) await db.collection(name).drop();
    }
}
