export class HttpError extends Error {
    constructor(public readonly status: number, public readonly code: string, message: string) {
        super(message);
    }
}

export function unauthorized() {
    return new HttpError(401, 'UNAUTHENTICATED', 'Please sign in again.');
}
