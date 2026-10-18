// Frozen helpers for the initial migrations. Future schema changes belong in new migrations.
import { isDeepStrictEqual } from 'node:util';

export function refuse(message) {
    throw new Error(`[migration-precondition] ${message}`);
}

export function schema(required, properties, extra = {}) {
    return { $jsonSchema: {
        bsonType: 'object', required, additionalProperties: false,
        properties: { _id: text, ...properties }, ...extra,
    } };
}

export const text = { bsonType: 'string', minLength: 1 };
export const date = { bsonType: 'date' };
export const quantity = { bsonType: ['int', 'long', 'double'], minimum: 0, multipleOf: 1, maximum: Number.MAX_SAFE_INTEGER };
export const positiveQuantity = { ...quantity, minimum: 1 };

export async function createCollection(db, name, validator, indexes = []) {
    const existing = await db.listCollections({ name }).next();
    if (existing) {
        if (!isDeepStrictEqual(existing.options?.validator, validator)
            || existing.options?.validationLevel !== 'strict'
            || existing.options?.validationAction !== 'error') {
            refuse(`Collection ${name} already exists with a different schema. Inspect it before retrying.`);
        }
    } else {
        await db.createCollection(name, { validator, validationLevel: 'strict', validationAction: 'error' });
    }
    if (indexes.length) await db.collection(name).createIndexes(indexes);
}

export async function dropEmptyCollections(db, names) {
    // Preflight the whole migration before dropping any collection.
    for (const name of names) {
        if (await db.collection(name).findOne({}, { projection: { _id: 1 } })) {
            refuse(`Cannot roll back: collection ${name} contains data. No collections were dropped.`);
        }
    }
    for (const name of [...names].reverse()) {
        if (await db.listCollections({ name }).hasNext()) await db.collection(name).drop();
    }
}

export const warehouse = { _id: 'main', code: 'MAIN', name: 'คลังหลัก' };
export const locations = [
    ...['A', 'B', 'C'].flatMap(zone => Array.from({ length: 5 }, (_, i) => ({
        _id: `${zone}${String(i + 1).padStart(2, '0')}`, warehouseId: 'main',
        code: `${zone}${String(i + 1).padStart(2, '0')}`, kind: 'picking', zone, capacity: 1,
    }))),
    ...Array.from({ length: 20 }, (_, i) => ({
        _id: `R${String(i + 1).padStart(2, '0')}`, warehouseId: 'main',
        code: `R${String(i + 1).padStart(2, '0')}`, kind: 'reserve', zone: 'R', capacity: 1,
    })),
    { _id: 'TMP01', warehouseId: 'main', code: 'TMP01', kind: 'temporary', zone: 'TMP', capacity: 1 },
];

export async function checkSeedRecords(db, name, records, exclusive = false) {
    for (const expected of records) {
        const actual = await db.collection(name).findOne({ _id: expected._id });
        if (actual && !isDeepStrictEqual(actual, expected)) {
            refuse(`Seed record in ${name} was modified. Existing records were preserved.`);
        }
    }
    if (exclusive && await db.collection(name).findOne({ _id: { $nin: records.map(record => record._id) } })) {
        refuse(`Additional records in ${name} prevent rolling back the base warehouse.`);
    }
}
