import { MongoServerError, type ClientSession, type MongoClient } from 'mongodb';
import { createHash } from 'node:crypto';
import type { Runtime } from '../../../shared/application/runtime';
import { ApplicationError } from '../../../shared/domain/errors';
import type {
    InventoryTransaction,
    InventoryUnitOfWork,
    MutationContext,
} from '../../application/ports';
import type { InventoryCollections } from './collections';
import { toDocument } from './mappers';
import { createMongoInventoryRepositories } from './repositories';

function canonicalJson(value: unknown): string {
    if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
    if (value && typeof value === 'object') {
        return `{${Object.entries(value)
            .filter(([, item]) => item !== undefined)
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`)
            .join(',')}}`;
    }
    return JSON.stringify(value);
}

export function createMongoInventoryUnitOfWork(
    client: MongoClient,
    data: InventoryCollections,
    runtime: Runtime,
): InventoryUnitOfWork {
    async function run<T extends Record<string, unknown>>(
        context: MutationContext,
        operation: string,
        input: unknown,
        change: (transaction: InventoryTransaction) => Promise<T>,
    ): Promise<T> {
        if (!context.key || !/^[a-zA-Z0-9._:-]{1,128}$/.test(context.key)) {
            throw new ApplicationError(
                'validation',
                'IDEMPOTENCY_KEY_REQUIRED',
                'Supply an Idempotency-Key for this change.',
            );
        }
        const mutationId = `${context.actor.id}:${context.key}`;
        const fingerprint = createHash('sha256')
            .update(canonicalJson({ operation, input }))
            .digest('hex');
        const replay = async (session?: ClientSession): Promise<T | undefined> => {
            const previous = await data.mutations.findOne({ _id: mutationId }, { session });
            if (!previous) return undefined;
            if (previous.fingerprint !== fingerprint) {
                throw new ApplicationError(
                    'conflict',
                    'IDEMPOTENCY_CONFLICT',
                    'This key was already used for a different change.',
                );
            }
            return previous.result as T;
        };
        const session = client.startSession();
        try {
            return await session.withTransaction(async () => {
                const previous = await replay(session);
                if (previous) return previous;
                const result = await change({
                    ...createMongoInventoryRepositories(data, session),
                    async recordEvent(event) {
                        await data.events.insertOne(toDocument(event), { session });
                    },
                });
                await data.mutations.insertOne(
                    { _id: mutationId, fingerprint, result, createdAt: runtime.now() },
                    { session },
                );
                return result;
            });
        } catch (error) {
            if (error instanceof MongoServerError && error.code === 11000) {
                // A concurrent retry can lose either the entity or the idempotency insert.
                const previous = await replay();
                if (previous) return previous;
                throw new ApplicationError(
                    'conflict',
                    'DUPLICATE_CODE',
                    'This code is already in use, including inactive records.',
                );
            }
            throw error;
        } finally {
            await session.endSession();
        }
    }

    return { run };
}
