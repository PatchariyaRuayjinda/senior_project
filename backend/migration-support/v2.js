// Frozen schema snapshot for migration 004. Add a new snapshot for later changes.
import { schema, text, date, quantity, positiveQuantity } from './v1.js';

const version = { revision: quantity, updatedAt: date };
const versionFields = ['revision', 'updatedAt'];
const firstReceipt = { bsonType: ['date', 'null'] };
const boolean = { bsonType: 'bool' };

export const productSchema = schema([
    '_id', 'sku', 'name', 'unit', 'maxQuantityPerPallet', 'tracksExpiry', 'pickingMinimum',
    'pickingTarget', 'active', 'firstReceivedAt', 'createdAt', ...versionFields,
], {
    sku: { ...text, pattern: '^\\S(?:.*\\S)?$' }, name: text, unit: text,
    maxQuantityPerPallet: positiveQuantity, tracksExpiry: boolean,
    pickingMinimum: quantity, pickingTarget: quantity, active: boolean,
    firstReceivedAt: firstReceipt, createdAt: date, ...version,
});

export const lotSchema = { $and: [schema([
    '_id', 'code', 'productId', 'firstReceivedAt', 'createdAt', ...versionFields,
], {
    code: text, productId: text, lotNumber: text, manufacturedAt: date, expiresAt: date,
    firstReceivedAt: firstReceipt, createdAt: date, ...version,
}), { $expr: { $or: [
    { $eq: [{ $type: '$manufacturedAt' }, 'missing'] },
    { $eq: [{ $type: '$expiresAt' }, 'missing'] },
    { $gte: ['$expiresAt', '$manufacturedAt'] },
] } }] };

export const locationSchema = { $and: [schema([
    '_id', 'warehouseId', 'code', 'kind', 'zone', 'capacity', 'active',
    'inboundBlocked', 'outboundBlocked', 'blockReason', ...versionFields,
], {
    warehouseId: text, code: text, kind: { enum: ['picking', 'reserve', 'temporary'] },
    zone: { enum: ['A', 'B', 'C', 'R', 'TMP'] }, capacity: { enum: [1] },
    active: boolean, inboundBlocked: boolean, outboundBlocked: boolean,
    blockReason: { bsonType: ['string', 'null'] }, ...version,
}), { $or: [
    { kind: 'picking', zone: { $in: ['A', 'B', 'C'] } },
    { kind: 'reserve', zone: 'R' }, { kind: 'temporary', zone: 'TMP' },
] }] };

export const eventSchema = schema([
    '_id', 'entityType', 'entityId', 'action', 'actorId', 'actorUsername', 'createdAt', 'before', 'after',
], {
    entityType: { enum: ['product', 'lot', 'location'] }, entityId: text,
    action: { enum: ['created', 'updated'] }, actorId: text, actorUsername: text, createdAt: date,
    before: { bsonType: ['object', 'null'] }, after: { bsonType: 'object' }, reason: text,
});

export const mutationSchema = schema(['_id', 'fingerprint', 'result', 'createdAt'], {
    fingerprint: text, result: { bsonType: 'object' }, createdAt: date,
});
export const reservationSchema = schema(['_id', 'workId', 'createdAt'], { workId: text, createdAt: date });
export const sourceSchema = schema([
    '_id', 'productId', 'lotId', 'palletId', 'sourceType', 'sourceId', 'quantity', 'fifoAt',
], {
    productId: text, lotId: text, palletId: text, sourceType: { enum: ['receipt', 'count_gain'] },
    sourceId: text, quantity, fifoAt: date,
});

export const oldProductSchema = schema(
    ['_id', 'sku', 'name', 'unit', 'maxQuantityPerPallet', 'tracksExpiry', 'pickingMinimum', 'createdAt'], {
        sku: text, name: text, unit: text, maxQuantityPerPallet: positiveQuantity,
        tracksExpiry: boolean, pickingMinimum: quantity, createdAt: date,
    },
);
export const oldLotSchema = { $and: [schema(['_id', 'productId', 'lotNumber', 'createdAt'], {
    productId: text, lotNumber: text, manufacturedAt: date, expiresAt: date, createdAt: date,
}), lotSchema.$and[1]] };
export const oldLocationSchema = { $and: [schema(['_id', 'warehouseId', 'code', 'kind', 'zone', 'capacity'], {
    warehouseId: text, code: text, kind: { enum: ['picking', 'reserve', 'temporary'] },
    zone: { enum: ['A', 'B', 'C', 'R', 'TMP'] }, capacity: { enum: [1] },
}), locationSchema.$and[1]] };
