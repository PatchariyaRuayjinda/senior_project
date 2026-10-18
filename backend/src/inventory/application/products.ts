import type { Runtime } from '../../shared/application/runtime';
import { ApplicationError } from '../../shared/domain/errors';
import type { ProductRecord } from '../domain/models';
import { productFields } from '../domain/product-rules';
import type { InventoryRepositories, InventoryUnitOfWork, MutationContext } from './ports';
import type { ProductInput, ProductUpdate } from './product-commands';
import { productView } from './product-view';
import { audit, requireAdmin, staleRecord } from './support';

export function createProductUseCases(
    repositories: InventoryRepositories,
    unitOfWork: InventoryUnitOfWork,
    runtime: Runtime,
) {
    return {
        async listProducts() {
            return { products: (await repositories.products.list()).map(productView) };
        },
        async createProduct(context: MutationContext, input: ProductInput) {
            requireAdmin(context.actor);
            const fields = productFields(input);
            return unitOfWork.run(context, 'product.create', input, async (transaction) => {
                const { products } = transaction;
                const now = runtime.now();
                const record: ProductRecord = {
                    id: runtime.newId(),
                    ...fields,
                    active: true,
                    firstReceivedAt: null,
                    revision: 0,
                    createdAt: now,
                    updatedAt: now,
                };
                await products.insert(record);
                const product = productView(record);
                await audit(
                    transaction,
                    runtime,
                    context.actor,
                    'product',
                    record.id,
                    null,
                    product,
                );
                return { product };
            });
        },
        async updateProduct(context: MutationContext, id: string, input: ProductUpdate) {
            requireAdmin(context.actor);
            const fields = productFields(input);
            return unitOfWork.run(context, `product.update:${id}`, input, async (transaction) => {
                const { products, lots, pallets } = transaction;
                // Acquiring the write first serializes this change with future receipt/stock writes.
                const before = await products.lockForUpdate(id, input.revision);
                if (!before) {
                    if (!(await products.findById(id)))
                        throw new ApplicationError('not_found', 'NOT_FOUND', 'Product not found.');
                    staleRecord();
                }
                const firstPallet = await pallets.firstReceivedForProduct(id);
                const firstReceivedAt = before.firstReceivedAt ?? firstPallet?.receivedAt ?? null;
                if (
                    firstReceivedAt &&
                    (fields.sku !== before.sku ||
                        fields.unit !== before.unit ||
                        fields.tracksExpiry !== before.tracksExpiry)
                ) {
                    throw new ApplicationError(
                        'conflict',
                        'PRODUCT_FIELDS_LOCKED',
                        'SKU, base unit and expiry tracking are locked after the first receipt.',
                    );
                }
                const overCapacity = await pallets.exceedingCapacity(
                    id,
                    fields.maxQuantityPerPallet,
                );
                if (overCapacity)
                    throw new ApplicationError(
                        'conflict',
                        'CAPACITY_IN_USE',
                        `Pallet ${overCapacity.code} exceeds the requested capacity.`,
                    );
                if (
                    fields.tracksExpiry &&
                    !before.tracksExpiry &&
                    (await lots.hasMissingExpiry(id))
                ) {
                    throw new ApplicationError(
                        'conflict',
                        'LOT_EXPIRY_REQUIRED',
                        'Complete the existing lot expiry dates before enabling expiry tracking.',
                    );
                }
                const after: ProductRecord = {
                    ...before,
                    ...fields,
                    active: input.active,
                    firstReceivedAt,
                    revision: before.revision + 1,
                    updatedAt: runtime.now(),
                };
                await products.replace(after);
                const product = productView(after);
                await audit(
                    transaction,
                    runtime,
                    context.actor,
                    'product',
                    id,
                    productView(before),
                    product,
                );
                return { product };
            });
        },
    };
}
