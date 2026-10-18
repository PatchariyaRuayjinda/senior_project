export type ErrorKind =
    'validation' | 'unauthenticated' | 'forbidden' | 'not_found' | 'conflict' | 'rate_limit';

/** Application failures are transport independent; HTTP adapters choose the status. */
export class ApplicationError extends Error {
    constructor(
        public readonly kind: ErrorKind,
        public readonly code: string,
        message: string,
    ) {
        super(message);
        this.name = 'ApplicationError';
    }
}

export function unauthorized() {
    return new ApplicationError('unauthenticated', 'UNAUTHENTICATED', 'Please sign in again.');
}
