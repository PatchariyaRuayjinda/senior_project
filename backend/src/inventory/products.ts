import { randomUUID } from 'node:crypto';
import { HttpError } from '../errors';
import { requireAdmin, requiredText, staleRecord, type InventoryData, type MutationContext, type MutationRunner } from './mutations';
import type { ProductRecord } from './records';

export interface ProductInput {
    sku: string;
    name: string;
    unit: string;
    maxQuantityPerPallet: number;
    tracksExpiry: boolean;
    pickingMinimum: number;
    pickingTarget: number;
}
export interface ProductUpdate extends ProductInput {
    revision: number;
    active: boolean;
}

export function productView({ _id, createdAt, updatedAt, firstReceivedAt, ...fields }: ProductRecord) {
    return {
        id: _id, ...fields, createdAt: createdAt.toISOString(), updatedAt: updatedAt.toISOString(),
        firstReceivedAt: firstReceivedAt?.toISOString() ?? null,
    };
}

function productFields(input: ProductInput): ProductInput {
    if (input.pickingTarget < input.pickingMinimum) {
        throw new HttpError(400, 'INVALID_PICKING_TARGET', 'Picking target must be at least the minimum.');
    }
    return {
        sku: requiredText(input.sku, 'SKU').toUpperCase(),
        name: requiredText(input.name, 'Name'), unit: requiredText(input.unit, 'Unit'),
        maxQuantityPerPallet: input.maxQuantityPerPallet, tracksExpiry: input.tracksExpiry,
        pickingMinimum: input.pickingMinimum, pickingTarget: input.pickingTarget,
    };
}

export function productOperations(data: InventoryData, mutations: MutationRunner) {
    return {
        async listProducts() {
            return { products: (await data.products.find().sort({ sku: 1 }).toArray()).map(productView) };
        },
        async createProduct(context: MutationContext, input: ProductInput) {
            requireAdmin(context.actor);
            const fields = productFields(input);
            return mutations.run(context, 'product.create', input, async session => {
                const now = new Date();
                const record: ProductRecord = {
                    _id: randomUUID(), ...fields, active: true, firstReceivedAt: null,
                    revision: 0, createdAt: now, updatedAt: now,
                };
                await data.products.insertOne(record, { session });
                const product = productView(record);
                await mutations.audit(session, context.actor, 'product', record._id, null, product);
                return { product };
            });
        },
        async updateProduct(context: MutationContext, id: string, input: ProductUpdate) {
            requireAdmin(context.actor);
            const fields = productFields(input);
            return mutations.run(context, `product.update:${id}`, input, async session => {
                // Acquiring the write first serializes this change with future receipt/stock writes.
                const before = await data.products.findOneAndUpdate(
                    { _id: id, revision: input.revision }, { $inc: { revision: 1 } },
                    { session, returnDocument: 'before' },
                );
                if (!before) {
                    if (!await data.products.findOne({ _id: id }, { session })) throw new HttpError(404, 'NOT_FOUND', 'Product not found.');
                    staleRecord();
                }
                const firstPallet = await data.pallets.findOne({ productId: id }, { session, sort: { receivedAt: 1 } });
                const firstReceivedAt = before.firstReceivedAt ?? firstPallet?.receivedAt ?? null;
                if (firstReceivedAt && (fields.sku !== before.sku || fields.unit !== before.unit || fields.tracksExpiry !== before.tracksExpiry)) {
                    throw new HttpError(409, 'PRODUCT_FIELDS_LOCKED', 'SKU, base unit and expiry tracking are locked after the first receipt.');
                }
                const overCapacity = await data.pallets.findOne({ productId: id, quantity: { $gt: fields.maxQuantityPerPallet } }, { session });
                if (overCapacity) throw new HttpError(409, 'CAPACITY_IN_USE', `Pallet ${overCapacity.code} exceeds the requested capacity.`);
                if (fields.tracksExpiry && !before.tracksExpiry && await data.lots.findOne({ productId: id, expiresAt: { $exists: false } }, { session })) {
                    throw new HttpError(409, 'LOT_EXPIRY_REQUIRED', 'Complete the existing lot expiry dates before enabling expiry tracking.');
                }
                const after: ProductRecord = {
                    ...before, ...fields, active: input.active, firstReceivedAt,
                    revision: before.revision + 1, updatedAt: new Date(),
                };
                await data.products.replaceOne({ _id: id }, after, { session });
                const product = productView(after);
                await mutations.audit(session, context.actor, 'product', id, productView(before), product);
                return { product };
            });
        },
    };
}
