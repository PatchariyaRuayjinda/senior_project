import type { Db } from 'mongodb';
import type {
    InventoryEvent,
    LocationRecord,
    LocationReservation,
    LotRecord,
    PalletRecord,
    ProductRecord,
    StockSource,
} from '../../domain/models';
import type { MongoRecord } from './mappers';

export interface MutationRecord {
    _id: string;
    fingerprint: string;
    result: Record<string, unknown>;
    createdAt: Date;
}

export function inventoryCollections(db: Db) {
    return {
        products: db.collection<MongoRecord<ProductRecord>>('products'),
        lots: db.collection<MongoRecord<LotRecord>>('lots'),
        locations: db.collection<MongoRecord<LocationRecord>>('locations'),
        pallets: db.collection<MongoRecord<PalletRecord>>('pallets'),
        events: db.collection<MongoRecord<InventoryEvent>>('inventoryEvents'),
        mutations: db.collection<MutationRecord>('inventoryMutations'),
        reservations: db.collection<MongoRecord<LocationReservation>>('locationReservations'),
        stockSources: db.collection<MongoRecord<StockSource>>('stockSources'),
    };
}

export type InventoryCollections = ReturnType<typeof inventoryCollections>;
