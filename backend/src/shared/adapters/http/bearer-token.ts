export function bearerToken(authorization: string | null): string | null {
    return authorization?.match(/^Bearer (\S+)$/)?.[1] ?? null;
}
