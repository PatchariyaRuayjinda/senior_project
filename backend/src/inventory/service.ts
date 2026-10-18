import type { Db, MongoClient } from 'mongodb';
import { inventoryCollections, type EntityType } from './records';
import { createMutationRunner } from './mutations';
import { productOperations } from './products';
import { lotOperations } from './lots';
import { locationOperations } from './locations';

export function createInventoryService(db: Db, client: MongoClient) {
    const data = inventoryCollections(db);
    const mutations = createMutationRunner(client, data);
    return {
        ...productOperations(data, mutations),
        ...lotOperations(data, mutations),
        ...locationOperations(data, mutations),
        async listPallets() {
            const pallets = await data.pallets.find().sort({ code: 1 }).toArray();
            return { pallets: pallets.map(({ _id, receivedAt, ...fields }) => ({
                id: _id, ...fields, receivedAt: receivedAt.toISOString(),
            })) };
        },
        async history(entityType: EntityType, entityId: string) {
            const events = await data.events.find({ entityType, entityId }).sort({ createdAt: -1, _id: 1 }).toArray();
            return { events: events.map(({ _id, createdAt, ...fields }) => ({ id: _id, ...fields, createdAt: createdAt.toISOString() })) };
        },
    };
}

export type InventoryService = ReturnType<typeof createInventoryService>;
