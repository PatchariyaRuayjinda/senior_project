import type { ErrorKind } from '../../domain/errors';

const statuses: Record<ErrorKind, number> = {
    validation: 400,
    unauthenticated: 401,
    forbidden: 403,
    not_found: 404,
    conflict: 409,
    rate_limit: 429,
};

export const httpStatus = (kind: ErrorKind) => statuses[kind];
