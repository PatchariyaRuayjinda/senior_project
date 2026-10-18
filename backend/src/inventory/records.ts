import type { Db } from 'mongodb';

export interface VersionedRecord {
    _id: string;
    revision: number;
    updatedAt: Date;
}

export interface ProductRecord extends VersionedRecord {
    sku: string;
    name: string;
    unit: string;
    maxQuantityPerPallet: number;
    tracksExpiry: boolean;
    pickingMinimum: number;
    pickingTarget: number;
    active: boolean;
    firstReceivedAt: Date | null;
    createdAt: Date;
}

export interface LotRecord extends VersionedRecord {
    code: string;
    productId: string;
    lotNumber?: string;
    manufacturedAt?: Date;
    expiresAt?: Date;
    firstReceivedAt: Date | null;
    createdAt: Date;
}

export type LocationKind = 'picking' | 'reserve' | 'temporary';
export type Zone = 'A' | 'B' | 'C' | 'R' | 'TMP';

export interface LocationRecord extends VersionedRecord {
    warehouseId: string;
    code: string;
    kind: LocationKind;
    zone: Zone;
    capacity: 1;
    active: boolean;
    inboundBlocked: boolean;
    outboundBlocked: boolean;
    blockReason: string | null;
}

export interface PalletRecord {
    _id: string;
    code: string;
    productId: string;
    lotId: string;
    quantity: number;
    locationId: string | null;
    status: 'stored' | 'awaiting_clearance' | 'cleared';
    receivedAt: Date;
}

export type EntityType = 'product' | 'lot' | 'location';
export interface InventoryEvent {
    _id: string;
    entityType: EntityType;
    entityId: string;
    action: 'created' | 'updated';
    actorId: string;
    actorUsername: string;
    createdAt: Date;
    before: Record<string, unknown> | null;
    after: Record<string, unknown>;
    reason?: string;
}

export interface MutationRecord {
    _id: string;
    fingerprint: string;
    result: Record<string, unknown>;
    createdAt: Date;
}

export interface LocationReservation {
    _id: string; // The location ID is unique: two works cannot own the same slot.
    workId: string;
    createdAt: Date;
}

// Future receiving/adjustment workflows retain these sources through moves and returns.
export interface StockSource {
    _id: string;
    productId: string;
    lotId: string;
    palletId: string;
    sourceType: 'receipt' | 'count_gain';
    sourceId: string;
    quantity: number;
    fifoAt: Date;
}

export function inventoryCollections(db: Db) {
    return {
        products: db.collection<ProductRecord>('products'),
        lots: db.collection<LotRecord>('lots'),
        locations: db.collection<LocationRecord>('locations'),
        pallets: db.collection<PalletRecord>('pallets'),
        events: db.collection<InventoryEvent>('inventoryEvents'),
        mutations: db.collection<MutationRecord>('inventoryMutations'),
        reservations: db.collection<LocationReservation>('locationReservations'),
        stockSources: db.collection<StockSource>('stockSources'),
    };
}
