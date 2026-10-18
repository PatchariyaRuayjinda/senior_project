export interface VersionedRecord {
    id: string;
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
    id: string;
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
    id: string;
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

export interface LocationReservation {
    id: string; // The location ID is unique: two works cannot own the same slot.
    workId: string;
    createdAt: Date;
}

// Future receiving/adjustment workflows retain these sources through moves and returns.
export interface StockSource {
    id: string;
    productId: string;
    lotId: string;
    palletId: string;
    sourceType: 'receipt' | 'count_gain';
    sourceId: string;
    quantity: number;
    fifoAt: Date;
}
