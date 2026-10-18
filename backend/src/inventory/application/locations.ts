import type { Runtime } from '../../shared/application/runtime';
import { ApplicationError } from '../../shared/domain/errors';
import { locationFields } from '../domain/location-rules';
import type { LocationRecord } from '../domain/models';
import type { LocationInput, LocationUpdate } from './location-commands';
import { locationView } from './location-view';
import type { InventoryRepositories, InventoryUnitOfWork, MutationContext } from './ports';
import { audit, requireAdmin, staleRecord } from './support';

export function createLocationUseCases(
    repositories: InventoryRepositories,
    unitOfWork: InventoryUnitOfWork,
    runtime: Runtime,
) {
    return {
        async listLocations() {
            const [records, pallets, reservations] = await Promise.all([
                repositories.locations.list(),
                repositories.pallets.listLocated(),
                repositories.reservations.list(),
            ]);
            const occupied = new Map(pallets.map((pallet) => [pallet.locationId, pallet.code]));
            const reserved = new Map(
                reservations.map((reservation) => [reservation.id, reservation.workId]),
            );
            return {
                locations: records.map((record) => ({
                    ...locationView(record),
                    palletCode: occupied.get(record.id) ?? null,
                    reservedBy: reserved.get(record.id) ?? null,
                })),
            };
        },
        async createLocation(context: MutationContext, input: LocationInput) {
            requireAdmin(context.actor);
            const fields = locationFields(input);
            return unitOfWork.run(context, 'location.create', input, async (transaction) => {
                const { locations } = transaction;
                const record: LocationRecord = {
                    id: runtime.newId(),
                    warehouseId: 'main',
                    ...fields,
                    capacity: 1,
                    active: true,
                    inboundBlocked: false,
                    outboundBlocked: false,
                    blockReason: null,
                    revision: 0,
                    updatedAt: runtime.now(),
                };
                await locations.insert(record);
                const location = locationView(record);
                await audit(
                    transaction,
                    runtime,
                    context.actor,
                    'location',
                    record.id,
                    null,
                    location,
                );
                return { location };
            });
        },
        async updateLocation(context: MutationContext, id: string, input: LocationUpdate) {
            requireAdmin(context.actor);
            const fields = locationFields(input, id);
            return unitOfWork.run(context, `location.update:${id}`, input, async (transaction) => {
                const { locations, pallets, reservations } = transaction;
                const before = await locations.lockForUpdate(id, input.revision);
                if (!before) {
                    if (!(await locations.findById(id)))
                        throw new ApplicationError('not_found', 'NOT_FOUND', 'Location not found.');
                    staleRecord();
                }
                const metadataChanged =
                    fields.code !== before.code ||
                    fields.kind !== before.kind ||
                    fields.zone !== before.zone;
                if (id === 'TMP01' && (metadataChanged || !input.active)) {
                    throw new ApplicationError(
                        'conflict',
                        'TEMPORARY_LOCATION_FIXED',
                        'Keep TMP01 active with its dedicated code and purpose.',
                    );
                }
                if (metadataChanged || (!input.active && before.active)) {
                    const occupied = await pallets.existsAtLocation(id);
                    const reserved = await reservations.existsAtLocation(id);
                    if (occupied || reserved)
                        throw new ApplicationError(
                            'conflict',
                            'LOCATION_IN_USE',
                            'Clear the pallet and finish or cancel reserved work first.',
                        );
                }
                if (fields.code !== before.code && !input.labelConfirmed) {
                    throw new ApplicationError(
                        'validation',
                        'LABEL_CONFIRMATION_REQUIRED',
                        'Confirm the physical label matches the new code.',
                    );
                }
                const blocksChanged =
                    input.inboundBlocked !== before.inboundBlocked ||
                    input.outboundBlocked !== before.outboundBlocked;
                if (blocksChanged && !input.reason?.trim()) {
                    throw new ApplicationError(
                        'validation',
                        'BLOCK_REASON_REQUIRED',
                        'A reason is required when blocking or unblocking a location.',
                    );
                }
                const after: LocationRecord = {
                    ...before,
                    ...fields,
                    active: input.active,
                    inboundBlocked: input.inboundBlocked,
                    outboundBlocked: input.outboundBlocked,
                    blockReason: blocksChanged ? input.reason!.trim() : before.blockReason,
                    revision: before.revision + 1,
                    updatedAt: runtime.now(),
                };
                await locations.replace(after);
                const location = locationView(after);
                await audit(
                    transaction,
                    runtime,
                    context.actor,
                    'location',
                    id,
                    locationView(before),
                    location,
                    input.reason,
                );
                return { location };
            });
        },
    };
}
