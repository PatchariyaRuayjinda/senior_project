import { formatCalendarDate } from '../domain/dates';
import type { LotRecord } from '../domain/models';

export function lotView({
    id,
    manufacturedAt,
    expiresAt,
    createdAt,
    updatedAt,
    firstReceivedAt,
    ...fields
}: LotRecord) {
    return {
        id,
        ...fields,
        manufacturedAt: manufacturedAt ? formatCalendarDate(manufacturedAt) : null,
        expiresAt: expiresAt ? formatCalendarDate(expiresAt) : null,
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString(),
        firstReceivedAt: firstReceivedAt?.toISOString() ?? null,
    };
}
