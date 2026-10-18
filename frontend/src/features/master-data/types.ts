export interface Versioned {
  id: string;
  revision: number;
  updatedAt: string;
}

export interface ProductInput {
  sku: string;
  name: string;
  unit: string;
  maxQuantityPerPallet: number;
  tracksExpiry: boolean;
  pickingMinimum: number;
  pickingTarget: number;
}
export interface Product extends Versioned, ProductInput {
  active: boolean;
  firstReceivedAt: string | null;
  createdAt: string;
}

export interface Lot extends Versioned {
  code: string;
  productId: string;
  lotNumber?: string;
  manufacturedAt: string | null;
  expiresAt: string | null;
  firstReceivedAt: string | null;
  createdAt: string;
}
export interface LotInput {
  productId: string;
  lotNumber?: string;
  manufacturedAt?: string;
  expiresAt?: string;
}

export type LocationKind = "picking" | "reserve" | "temporary";
export type Zone = "A" | "B" | "C" | "R" | "TMP";
export interface LocationInput {
  code: string;
  kind: LocationKind;
  zone: Zone;
}
export interface Location extends Versioned, LocationInput {
  warehouseId: string;
  capacity: 1;
  active: boolean;
  inboundBlocked: boolean;
  outboundBlocked: boolean;
  blockReason: string | null;
  palletCode: string | null;
  reservedBy: string | null;
}

export interface Pallet {
  id: string;
  code: string;
  productId: string;
  lotId: string;
  quantity: number;
  locationId: string | null;
  status: "stored" | "awaiting_clearance" | "cleared";
  receivedAt: string;
}

export type EntityType = "product" | "lot" | "location";
export interface InventoryEvent {
  id: string;
  entityType: EntityType;
  entityId: string;
  action: "created" | "updated";
  actorId: string;
  actorUsername: string;
  createdAt: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown>;
  reason?: string;
}

export interface Catalog {
  products: Product[];
  lots: Lot[];
  locations: Location[];
  pallets: Pallet[];
}
