import { createHash, randomUUID } from 'node:crypto';
import { MongoServerError, type ClientSession, type MongoClient } from 'mongodb';
import type { PublicUser } from '../auth/service';
import { HttpError } from '../errors';
import { inventoryCollections, type EntityType, type InventoryEvent } from './records';

export type InventoryData = ReturnType<typeof inventoryCollections>;
export interface MutationContext {
    actor: PublicUser;
    key: string | null;
}

export function requireAdmin(actor: PublicUser) {
    if (actor.role !== 'admin') throw new HttpError(403, 'FORBIDDEN', 'Administrator access required.');
}

export function requiredText(value: string, field: string): string {
    const trimmed = value.trim();
    if (!trimmed) throw new HttpError(400, 'INVALID_REQUEST', `${field} must not be blank.`);
    return trimmed;
}

export function staleRecord(): never {
    throw new HttpError(409, 'STALE_RECORD', 'This record changed. Reload it before saving.');
}

function canonicalJson(value: unknown): string {
    if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
    if (value && typeof value === 'object') {
        return `{${Object.entries(value).filter(([, item]) => item !== undefined)
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`).join(',')}}`;
    }
    return JSON.stringify(value);
}

export function createMutationRunner(client: MongoClient, data: InventoryData) {
    async function run<T extends Record<string, unknown>>(
        context: MutationContext,
        operation: string,
        input: unknown,
        change: (session: ClientSession) => Promise<T>,
    ): Promise<T> {
        if (!context.key || !/^[a-zA-Z0-9._:-]{1,128}$/.test(context.key)) {
            throw new HttpError(400, 'IDEMPOTENCY_KEY_REQUIRED', 'Supply an Idempotency-Key for this change.');
        }
        const mutationId = `${context.actor.id}:${context.key}`;
        const fingerprint = createHash('sha256').update(canonicalJson({ operation, input })).digest('hex');
        const replay = async (session?: ClientSession): Promise<T | undefined> => {
            const previous = await data.mutations.findOne({ _id: mutationId }, { session });
            if (!previous) return undefined;
            if (previous.fingerprint !== fingerprint) {
                throw new HttpError(409, 'IDEMPOTENCY_CONFLICT', 'This key was already used for a different change.');
            }
            return previous.result as T;
        };
        const session = client.startSession();
        try {
            return await session.withTransaction(async () => {
                const previous = await replay(session);
                if (previous) return previous;
                const result = await change(session);
                await data.mutations.insertOne({ _id: mutationId, fingerprint, result, createdAt: new Date() }, { session });
                return result;
            });
        } catch (error) {
            if (error instanceof MongoServerError && error.code === 11000) {
                // A concurrent retry can lose either the entity or the idempotency insert.
                const previous = await replay();
                if (previous) return previous;
                throw new HttpError(409, 'DUPLICATE_CODE', 'This code is already in use, including inactive records.');
            }
            throw error;
        } finally {
            await session.endSession();
        }
    }

    async function audit(
        session: ClientSession, actor: PublicUser, entityType: EntityType, entityId: string,
        before: InventoryEvent['before'], after: InventoryEvent['after'], reason?: string,
    ) {
        await data.events.insertOne({
            _id: randomUUID(), entityType, entityId, actorId: actor.id, actorUsername: actor.username,
            action: before ? 'updated' : 'created', before, after, createdAt: new Date(),
            ...(reason?.trim() ? { reason: reason.trim() } : {}),
        }, { session });
    }

    return { run, audit };
}

export type MutationRunner = ReturnType<typeof createMutationRunner>;
