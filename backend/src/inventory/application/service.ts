import type { Runtime } from '../../shared/application/runtime';
import type { EntityType } from '../domain/models';
import { createLocationUseCases } from './locations';
import { createLotUseCases } from './lots';
import type { InventoryHistory, InventoryRepositories, InventoryUnitOfWork } from './ports';
import { createProductUseCases } from './products';

export function createInventoryUseCases(
    data: InventoryRepositories,
    mutations: InventoryUnitOfWork,
    history: InventoryHistory,
    runtime: Runtime,
) {
    return {
        ...createProductUseCases(data, mutations, runtime),
        ...createLotUseCases(data, mutations, runtime),
        ...createLocationUseCases(data, mutations, runtime),
        async listPallets() {
            const pallets = await data.pallets.list();
            return {
                pallets: pallets.map(({ id, receivedAt, ...fields }) => ({
                    id,
                    ...fields,
                    receivedAt: receivedAt.toISOString(),
                })),
            };
        },
        async history(entityType: EntityType, entityId: string) {
            const events = await history.list(entityType, entityId);
            return {
                events: events.map(({ id, createdAt, ...fields }) => ({
                    id,
                    ...fields,
                    createdAt: createdAt.toISOString(),
                })),
            };
        },
    };
}

export type InventoryUseCases = ReturnType<typeof createInventoryUseCases>;
