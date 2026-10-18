import type { Runtime } from '../../shared/application/runtime';
import { ApplicationError } from '../../shared/domain/errors';
import { lotFields } from '../domain/lot-rules';
import type { LotRecord } from '../domain/models';
import type { LotInput, LotUpdate } from './lot-commands';
import { lotView } from './lot-view';
import type { InventoryRepositories, InventoryUnitOfWork, MutationContext } from './ports';
import { audit, requireAdmin, staleRecord } from './support';

export function createLotUseCases(
    repositories: InventoryRepositories,
    unitOfWork: InventoryUnitOfWork,
    runtime: Runtime,
) {
    return {
        async listLots(productId?: string) {
            const records = await repositories.lots.list(productId);
            return { lots: records.map(lotView) };
        },
        async createLot(context: MutationContext, input: LotInput) {
            return unitOfWork.run(context, 'lot.create', input, async (transaction) => {
                const { products, lots } = transaction;
                const product = await products.lockForUpdate(input.productId);
                if (!product)
                    throw new ApplicationError('not_found', 'NOT_FOUND', 'Product not found.');
                if (!product.active)
                    throw new ApplicationError(
                        'conflict',
                        'PRODUCT_INACTIVE',
                        'This product is inactive.',
                    );
                const id = runtime.newId();
                const now = runtime.now();
                const record: LotRecord = {
                    id,
                    code: `LOT-${id}`,
                    ...lotFields(input, product.tracksExpiry),
                    firstReceivedAt: null,
                    revision: 0,
                    createdAt: now,
                    updatedAt: now,
                };
                await lots.insert(record);
                const lot = lotView(record);
                await audit(transaction, runtime, context.actor, 'lot', id, null, lot);
                return { lot };
            });
        },
        async updateLot(context: MutationContext, id: string, input: LotUpdate) {
            requireAdmin(context.actor);
            return unitOfWork.run(context, `lot.update:${id}`, input, async (transaction) => {
                const { products, lots, pallets } = transaction;
                const product = await products.lockForUpdate(input.productId);
                if (!product)
                    throw new ApplicationError('not_found', 'NOT_FOUND', 'Product not found.');
                const before = await lots.lockForUpdate(id, input.revision);
                if (!before) {
                    if (!(await lots.findById(id)))
                        throw new ApplicationError('not_found', 'NOT_FOUND', 'Lot not found.');
                    staleRecord();
                }
                if (before.productId !== input.productId)
                    throw new ApplicationError(
                        'conflict',
                        'LOT_PRODUCT_LOCKED',
                        'A lot cannot change products.',
                    );
                if (before.firstReceivedAt || (await pallets.existsForLot(id))) {
                    throw new ApplicationError(
                        'conflict',
                        'LOT_FIELDS_LOCKED',
                        'Received lots require a date-correction approval; direct editing is locked.',
                    );
                }
                const { lotNumber, manufacturedAt, expiresAt, ...unchanged } = before;
                const after: LotRecord = {
                    ...unchanged,
                    ...lotFields(input, product.tracksExpiry),
                    revision: before.revision + 1,
                    updatedAt: runtime.now(),
                };
                await lots.replace(after);
                const lot = lotView(after);
                await audit(transaction, runtime, context.actor, 'lot', id, lotView(before), lot);
                return { lot };
            });
        },
    };
}
