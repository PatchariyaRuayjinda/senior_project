import { randomUUID } from 'node:crypto';
import { HttpError } from '../errors';
import { calendarDate, formatCalendarDate } from './dates';
import { requireAdmin, staleRecord, type InventoryData, type MutationContext, type MutationRunner } from './mutations';
import type { LotRecord } from './records';

export interface LotInput {
    productId: string;
    lotNumber?: string;
    manufacturedAt?: string;
    expiresAt?: string;
}
export interface LotUpdate extends LotInput { revision: number }

export function lotView({ _id, manufacturedAt, expiresAt, createdAt, updatedAt, firstReceivedAt, ...fields }: LotRecord) {
    return {
        id: _id, ...fields, manufacturedAt: manufacturedAt ? formatCalendarDate(manufacturedAt) : null,
        expiresAt: expiresAt ? formatCalendarDate(expiresAt) : null,
        createdAt: createdAt.toISOString(), updatedAt: updatedAt.toISOString(),
        firstReceivedAt: firstReceivedAt?.toISOString() ?? null,
    };
}

function lotFields(input: LotInput, tracksExpiry: boolean) {
    const manufacturedAt = calendarDate(input.manufacturedAt);
    const expiresAt = calendarDate(input.expiresAt);
    if (tracksExpiry && !expiresAt) throw new HttpError(400, 'LOT_EXPIRY_REQUIRED', 'An expiry date is required for this product.');
    if (manufacturedAt && expiresAt && expiresAt < manufacturedAt) {
        throw new HttpError(400, 'INVALID_DATE_ORDER', 'Expiry cannot precede manufacture.');
    }
    const lotNumber = input.lotNumber?.trim();
    return {
        productId: input.productId,
        ...(lotNumber ? { lotNumber } : {}),
        ...(manufacturedAt ? { manufacturedAt } : {}), ...(expiresAt ? { expiresAt } : {}),
    };
}

export function lotOperations(data: InventoryData, mutations: MutationRunner) {
    return {
        async listLots(productId?: string) {
            const records = await data.lots.find(productId ? { productId } : {}).sort({ createdAt: -1, code: 1 }).toArray();
            return { lots: records.map(lotView) };
        },
        async createLot(context: MutationContext, input: LotInput) {
            return mutations.run(context, 'lot.create', input, async session => {
                const product = await data.products.findOneAndUpdate(
                    { _id: input.productId }, { $inc: { revision: 1 } }, { session, returnDocument: 'after' },
                );
                if (!product) throw new HttpError(404, 'NOT_FOUND', 'Product not found.');
                if (!product.active) throw new HttpError(409, 'PRODUCT_INACTIVE', 'This product is inactive.');
                const id = randomUUID();
                const now = new Date();
                const record: LotRecord = {
                    _id: id, code: `LOT-${id}`, ...lotFields(input, product.tracksExpiry),
                    firstReceivedAt: null, revision: 0, createdAt: now, updatedAt: now,
                };
                await data.lots.insertOne(record, { session });
                const lot = lotView(record);
                await mutations.audit(session, context.actor, 'lot', id, null, lot);
                return { lot };
            });
        },
        async updateLot(context: MutationContext, id: string, input: LotUpdate) {
            requireAdmin(context.actor);
            return mutations.run(context, `lot.update:${id}`, input, async session => {
                const product = await data.products.findOneAndUpdate(
                    { _id: input.productId }, { $inc: { revision: 1 } }, { session, returnDocument: 'after' },
                );
                if (!product) throw new HttpError(404, 'NOT_FOUND', 'Product not found.');
                const before = await data.lots.findOneAndUpdate(
                    { _id: id, revision: input.revision }, { $inc: { revision: 1 } }, { session, returnDocument: 'before' },
                );
                if (!before) {
                    if (!await data.lots.findOne({ _id: id }, { session })) throw new HttpError(404, 'NOT_FOUND', 'Lot not found.');
                    staleRecord();
                }
                if (before.productId !== input.productId) throw new HttpError(409, 'LOT_PRODUCT_LOCKED', 'A lot cannot change products.');
                if (before.firstReceivedAt || await data.pallets.findOne({ lotId: id }, { session })) {
                    throw new HttpError(409, 'LOT_FIELDS_LOCKED', 'Received lots require a date-correction approval; direct editing is locked.');
                }
                const { lotNumber, manufacturedAt, expiresAt, ...unchanged } = before;
                const after: LotRecord = {
                    ...unchanged, ...lotFields(input, product.tracksExpiry), revision: before.revision + 1, updatedAt: new Date(),
                };
                await data.lots.replaceOne({ _id: id }, after, { session });
                const lot = lotView(after);
                await mutations.audit(session, context.actor, 'lot', id, lotView(before), lot);
                return { lot };
            });
        },
    };
}
