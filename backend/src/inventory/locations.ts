import { randomUUID } from 'node:crypto';
import { HttpError } from '../errors';
import { requireAdmin, requiredText, staleRecord, type InventoryData, type MutationContext, type MutationRunner } from './mutations';
import type { LocationKind, LocationRecord, Zone } from './records';

export interface LocationInput { code: string; kind: LocationKind; zone: Zone }
export interface LocationUpdate extends LocationInput {
    revision: number;
    active: boolean;
    inboundBlocked: boolean;
    outboundBlocked: boolean;
    reason?: string;
    labelConfirmed?: boolean;
}

export function locationView({ _id, updatedAt, ...fields }: LocationRecord) {
    return { id: _id, ...fields, updatedAt: updatedAt.toISOString() };
}

function locationFields(input: LocationInput, id?: string) {
    const code = requiredText(input.code, 'Location code').toUpperCase();
    const validZone = input.kind === 'picking' ? ['A', 'B', 'C'].includes(input.zone)
        : input.kind === 'reserve' ? input.zone === 'R' : input.zone === 'TMP';
    if (!validZone) throw new HttpError(400, 'INVALID_LOCATION_ZONE', 'The zone must match the location kind.');
    if ((input.kind === 'temporary' || code === 'TMP01') && id !== 'TMP01') {
        throw new HttpError(409, 'TEMPORARY_LOCATION_FIXED', 'TMP01 is the dedicated temporary slot.');
    }
    return { code, kind: input.kind, zone: input.zone };
}

export function locationOperations(data: InventoryData, mutations: MutationRunner) {
    return {
        async listLocations() {
            const [records, pallets, reservations] = await Promise.all([
                data.locations.find().sort({ code: 1 }).toArray(),
                data.pallets.find({ locationId: { $ne: null } }).toArray(),
                data.reservations.find().toArray(),
            ]);
            const occupied = new Map(pallets.map(pallet => [pallet.locationId, pallet.code]));
            const reserved = new Map(reservations.map(reservation => [reservation._id, reservation.workId]));
            return { locations: records.map(record => ({
                ...locationView(record), palletCode: occupied.get(record._id) ?? null,
                reservedBy: reserved.get(record._id) ?? null,
            })) };
        },
        async createLocation(context: MutationContext, input: LocationInput) {
            requireAdmin(context.actor);
            const fields = locationFields(input);
            return mutations.run(context, 'location.create', input, async session => {
                const record: LocationRecord = {
                    _id: randomUUID(), warehouseId: 'main', ...fields, capacity: 1, active: true,
                    inboundBlocked: false, outboundBlocked: false, blockReason: null,
                    revision: 0, updatedAt: new Date(),
                };
                await data.locations.insertOne(record, { session });
                const location = locationView(record);
                await mutations.audit(session, context.actor, 'location', record._id, null, location);
                return { location };
            });
        },
        async updateLocation(context: MutationContext, id: string, input: LocationUpdate) {
            requireAdmin(context.actor);
            const fields = locationFields(input, id);
            return mutations.run(context, `location.update:${id}`, input, async session => {
                const before = await data.locations.findOneAndUpdate(
                    { _id: id, revision: input.revision }, { $inc: { revision: 1 } }, { session, returnDocument: 'before' },
                );
                if (!before) {
                    if (!await data.locations.findOne({ _id: id }, { session })) throw new HttpError(404, 'NOT_FOUND', 'Location not found.');
                    staleRecord();
                }
                const metadataChanged = fields.code !== before.code || fields.kind !== before.kind || fields.zone !== before.zone;
                if (id === 'TMP01' && (metadataChanged || !input.active)) {
                    throw new HttpError(409, 'TEMPORARY_LOCATION_FIXED', 'Keep TMP01 active with its dedicated code and purpose.');
                }
                if (metadataChanged || (!input.active && before.active)) {
                    const occupied = await data.pallets.findOne({ locationId: id }, { session });
                    const reserved = await data.reservations.findOne({ _id: id }, { session });
                    if (occupied || reserved) throw new HttpError(409, 'LOCATION_IN_USE', 'Clear the pallet and finish or cancel reserved work first.');
                }
                if (fields.code !== before.code && !input.labelConfirmed) {
                    throw new HttpError(400, 'LABEL_CONFIRMATION_REQUIRED', 'Confirm the physical label matches the new code.');
                }
                const blocksChanged = input.inboundBlocked !== before.inboundBlocked || input.outboundBlocked !== before.outboundBlocked;
                if (blocksChanged && !input.reason?.trim()) {
                    throw new HttpError(400, 'BLOCK_REASON_REQUIRED', 'A reason is required when blocking or unblocking a location.');
                }
                const after: LocationRecord = {
                    ...before, ...fields, active: input.active,
                    inboundBlocked: input.inboundBlocked, outboundBlocked: input.outboundBlocked,
                    blockReason: blocksChanged ? input.reason!.trim() : before.blockReason,
                    revision: before.revision + 1, updatedAt: new Date(),
                };
                await data.locations.replaceOne({ _id: id }, after, { session });
                const location = locationView(after);
                await mutations.audit(session, context.actor, 'location', id, locationView(before), location, input.reason);
                return { location };
            });
        },
    };
}
