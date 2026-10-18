import type { ProductRecord } from '../domain/models';

export function productView({
    id,
    createdAt,
    updatedAt,
    firstReceivedAt,
    ...fields
}: ProductRecord) {
    return {
        id,
        ...fields,
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString(),
        firstReceivedAt: firstReceivedAt?.toISOString() ?? null,
    };
}
