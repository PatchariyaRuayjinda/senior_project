import { createCollection, date, dropEmptyCollections, positiveQuantity, quantity, schema, text } from '../migration-support/v1.js';

const names = ['warehouses', 'products', 'lots', 'locations', 'pallets'];

export async function up(db) {
    await createCollection(db, 'warehouses', schema(['_id', 'code', 'name'], {
        code: text, name: text,
    }), [{ key: { code: 1 }, name: 'warehouse_code_unique', unique: true }]);

    await createCollection(db, 'products', schema(
        ['_id', 'sku', 'name', 'unit', 'maxQuantityPerPallet', 'tracksExpiry', 'pickingMinimum', 'createdAt'], {
            sku: text, name: text, unit: text, maxQuantityPerPallet: positiveQuantity,
            tracksExpiry: { bsonType: 'bool' }, pickingMinimum: quantity, createdAt: date,
        },
    ), [{ key: { sku: 1 }, name: 'sku_unique', unique: true }]);

    await createCollection(db, 'lots', {
        $and: [schema(['_id', 'productId', 'lotNumber', 'createdAt'], {
            productId: text, lotNumber: text, manufacturedAt: date, expiresAt: date, createdAt: date,
        }), { $expr: { $or: [
            { $eq: [{ $type: '$manufacturedAt' }, 'missing'] },
            { $eq: [{ $type: '$expiresAt' }, 'missing'] },
            { $gte: ['$expiresAt', '$manufacturedAt'] },
        ] } }],
    }, [
        { key: { productId: 1, lotNumber: 1 }, name: 'product_lot_unique', unique: true },
        { key: { expiresAt: 1 }, name: 'lot_expiry' },
    ]);

    await createCollection(db, 'locations', {
        $and: [schema(['_id', 'warehouseId', 'code', 'kind', 'zone', 'capacity'], {
            warehouseId: text, code: text, kind: { enum: ['picking', 'reserve', 'temporary'] },
            zone: { enum: ['A', 'B', 'C', 'R', 'TMP'] }, capacity: { enum: [1] },
        }), { $or: [
            { kind: 'picking', zone: { $in: ['A', 'B', 'C'] } },
            { kind: 'reserve', zone: 'R' }, { kind: 'temporary', zone: 'TMP' },
        ] }],
    }, [{ key: { code: 1 }, name: 'location_code_unique', unique: true }]);

    await createCollection(db, 'pallets', {
        $and: [schema(['_id', 'code', 'productId', 'lotId', 'quantity', 'locationId', 'status', 'receivedAt'], {
            code: text, productId: text, lotId: text, quantity,
            locationId: { bsonType: ['string', 'null'], minLength: 1 },
            status: { enum: ['stored', 'awaiting_clearance', 'cleared'] }, receivedAt: date,
        }), { $or: [
            { status: 'stored', quantity: { $gt: 0 }, locationId: { $type: 'string' } },
            { status: 'awaiting_clearance', quantity: 0, locationId: { $type: 'string' } },
            { status: 'cleared', quantity: 0, locationId: { $type: 'null' } },
        ] }],
    }, [
        { key: { code: 1 }, name: 'pallet_code_unique', unique: true },
        { key: { locationId: 1 }, name: 'occupied_location_unique', unique: true,
            partialFilterExpression: { locationId: { $type: 'string' } } },
        { key: { productId: 1, receivedAt: 1 }, name: 'product_receipt_order' },
        { key: { lotId: 1 }, name: 'pallet_lot' },
    ]);
}

export async function down(db) {
    await dropEmptyCollections(db, names);
}
