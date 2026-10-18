import type { Actor } from '../../shared/domain/actor';
import type {
    EntityType,
    InventoryEvent,
    LocationRecord,
    LocationReservation,
    LotRecord,
    PalletRecord,
    ProductRecord,
} from '../domain/models';

export interface ProductRepository {
    list(): Promise<ProductRecord[]>;
    findById(id: string): Promise<ProductRecord | null>;
    /** Acquire the product write before dependent reads; returns the previous version. */
    lockForUpdate(id: string, revision?: number): Promise<ProductRecord | null>;
    insert(product: ProductRecord): Promise<void>;
    replace(product: ProductRecord): Promise<void>;
}

export interface LotRepository {
    list(productId?: string): Promise<LotRecord[]>;
    findById(id: string): Promise<LotRecord | null>;
    lockForUpdate(id: string, revision: number): Promise<LotRecord | null>;
    hasMissingExpiry(productId: string): Promise<boolean>;
    insert(lot: LotRecord): Promise<void>;
    replace(lot: LotRecord): Promise<void>;
}

export interface LocationRepository {
    list(): Promise<LocationRecord[]>;
    findById(id: string): Promise<LocationRecord | null>;
    lockForUpdate(id: string, revision: number): Promise<LocationRecord | null>;
    insert(location: LocationRecord): Promise<void>;
    replace(location: LocationRecord): Promise<void>;
}

export interface PalletRepository {
    list(): Promise<PalletRecord[]>;
    listLocated(): Promise<PalletRecord[]>;
    firstReceivedForProduct(productId: string): Promise<PalletRecord | null>;
    exceedingCapacity(productId: string, capacity: number): Promise<PalletRecord | null>;
    existsForLot(lotId: string): Promise<boolean>;
    existsAtLocation(locationId: string): Promise<boolean>;
}

export interface ReservationRepository {
    list(): Promise<LocationReservation[]>;
    existsAtLocation(locationId: string): Promise<boolean>;
}

export interface InventoryRepositories {
    products: ProductRepository;
    lots: LotRepository;
    locations: LocationRepository;
    pallets: PalletRepository;
    reservations: ReservationRepository;
}

export interface MutationContext {
    actor: Actor;
    key: string | null;
}

export interface InventoryTransaction extends InventoryRepositories {
    recordEvent(event: InventoryEvent): Promise<void>;
}

export interface InventoryUnitOfWork {
    /** Change, audit and original response commit together. Identical retries replay it. */
    run<T extends Record<string, unknown>>(
        context: MutationContext,
        operation: string,
        input: unknown,
        change: (transaction: InventoryTransaction) => Promise<T>,
    ): Promise<T>;
}

export interface InventoryHistory {
    list(entityType: EntityType, entityId: string): Promise<InventoryEvent[]>;
}
