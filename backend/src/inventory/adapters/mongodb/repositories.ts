import type { ClientSession } from 'mongodb';
import type { InventoryHistory, InventoryRepositories } from '../../application/ports';
import type { InventoryCollections } from './collections';
import { fromDocument, toDocument } from './mappers';

export function createMongoInventoryRepositories(
    data: InventoryCollections,
    session?: ClientSession,
): InventoryRepositories {
    return {
        products: {
            async list() {
                return (await data.products.find({}, { session }).sort({ sku: 1 }).toArray()).map(
                    fromDocument,
                );
            },
            async findById(id) {
                const record = await data.products.findOne({ _id: id }, { session });
                return record ? fromDocument(record) : null;
            },
            async lockForUpdate(id, revision) {
                const record = await data.products.findOneAndUpdate(
                    { _id: id, ...(revision === undefined ? {} : { revision }) },
                    { $inc: { revision: 1 } },
                    { session, returnDocument: 'before' },
                );
                return record ? fromDocument(record) : null;
            },
            async insert(product) {
                await data.products.insertOne(toDocument(product), { session });
            },
            async replace(product) {
                await data.products.replaceOne({ _id: product.id }, toDocument(product), {
                    session,
                });
            },
        },
        lots: {
            async list(productId) {
                const records = await data.lots
                    .find(productId ? { productId } : {}, { session })
                    .sort({ createdAt: -1, code: 1 })
                    .toArray();
                return records.map(fromDocument);
            },
            async findById(id) {
                const record = await data.lots.findOne({ _id: id }, { session });
                return record ? fromDocument(record) : null;
            },
            async lockForUpdate(id, revision) {
                const record = await data.lots.findOneAndUpdate(
                    { _id: id, revision },
                    { $inc: { revision: 1 } },
                    { session, returnDocument: 'before' },
                );
                return record ? fromDocument(record) : null;
            },
            async hasMissingExpiry(productId) {
                return !!(await data.lots.findOne(
                    { productId, expiresAt: { $exists: false } },
                    { session },
                ));
            },
            async insert(lot) {
                await data.lots.insertOne(toDocument(lot), { session });
            },
            async replace(lot) {
                await data.lots.replaceOne({ _id: lot.id }, toDocument(lot), { session });
            },
        },
        locations: {
            async list() {
                return (await data.locations.find({}, { session }).sort({ code: 1 }).toArray()).map(
                    fromDocument,
                );
            },
            async findById(id) {
                const record = await data.locations.findOne({ _id: id }, { session });
                return record ? fromDocument(record) : null;
            },
            async lockForUpdate(id, revision) {
                const record = await data.locations.findOneAndUpdate(
                    { _id: id, revision },
                    { $inc: { revision: 1 } },
                    { session, returnDocument: 'before' },
                );
                return record ? fromDocument(record) : null;
            },
            async insert(location) {
                await data.locations.insertOne(toDocument(location), { session });
            },
            async replace(location) {
                await data.locations.replaceOne({ _id: location.id }, toDocument(location), {
                    session,
                });
            },
        },
        pallets: {
            async list() {
                return (await data.pallets.find({}, { session }).sort({ code: 1 }).toArray()).map(
                    fromDocument,
                );
            },
            async listLocated() {
                return (
                    await data.pallets.find({ locationId: { $ne: null } }, { session }).toArray()
                ).map(fromDocument);
            },
            async firstReceivedForProduct(productId) {
                const record = await data.pallets.findOne(
                    { productId },
                    { session, sort: { receivedAt: 1 } },
                );
                return record ? fromDocument(record) : null;
            },
            async exceedingCapacity(productId, capacity) {
                const record = await data.pallets.findOne(
                    { productId, quantity: { $gt: capacity } },
                    { session },
                );
                return record ? fromDocument(record) : null;
            },
            async existsForLot(lotId) {
                return !!(await data.pallets.findOne({ lotId }, { session }));
            },
            async existsAtLocation(locationId) {
                return !!(await data.pallets.findOne({ locationId }, { session }));
            },
        },
        reservations: {
            async list() {
                return (await data.reservations.find({}, { session }).toArray()).map(fromDocument);
            },
            async existsAtLocation(locationId) {
                return !!(await data.reservations.findOne({ _id: locationId }, { session }));
            },
        },
    };
}

export function createMongoInventoryHistory(data: InventoryCollections): InventoryHistory {
    return {
        async list(entityType, entityId) {
            const events = await data.events
                .find({ entityType, entityId })
                .sort({ createdAt: -1, _id: 1 })
                .toArray();
            return events.map(fromDocument);
        },
    };
}
