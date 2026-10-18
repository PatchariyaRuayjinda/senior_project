import type { Runtime } from '../../shared/application/runtime';
import type { Actor } from '../../shared/domain/actor';
import { ApplicationError } from '../../shared/domain/errors';
import type { EntityType, InventoryEvent } from '../domain/models';
import type { InventoryTransaction } from './ports';

export function requireAdmin(actor: Actor) {
    if (actor.role !== 'admin') {
        throw new ApplicationError('forbidden', 'FORBIDDEN', 'Administrator access required.');
    }
}

export function staleRecord(): never {
    throw new ApplicationError(
        'conflict',
        'STALE_RECORD',
        'This record changed. Reload it before saving.',
    );
}

export async function audit(
    transaction: InventoryTransaction,
    runtime: Runtime,
    actor: Actor,
    entityType: EntityType,
    entityId: string,
    before: InventoryEvent['before'],
    after: InventoryEvent['after'],
    reason?: string,
) {
    await transaction.recordEvent({
        id: runtime.newId(),
        entityType,
        entityId,
        actorId: actor.id,
        actorUsername: actor.username,
        action: before ? 'updated' : 'created',
        before,
        after,
        createdAt: runtime.now(),
        ...(reason?.trim() ? { reason: reason.trim() } : {}),
    });
}
