import type { LocationRecord } from '../domain/models';

export function locationView({ id, updatedAt, ...fields }: LocationRecord) {
    return { id, ...fields, updatedAt: updatedAt.toISOString() };
}
