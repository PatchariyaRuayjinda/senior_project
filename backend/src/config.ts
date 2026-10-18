export interface Config {
    port: number;
    appOrigin: string;
    mongoUri: string;
    database: string;
    accessSecret: string;
    refreshSecret: string;
    secureCookies: boolean;
    accessTtlSeconds: number;
    refreshTtlSeconds: number;
}

export function loadConfig(env: Record<string, string | undefined> = process.env): Config {
    const accessSecret = env.JWT_ACCESS_SECRET ?? '';
    const refreshSecret = env.JWT_REFRESH_SECRET ?? '';
    if (Buffer.byteLength(accessSecret) < 32 || Buffer.byteLength(refreshSecret) < 32) {
        throw new Error('Set JWT_ACCESS_SECRET and JWT_REFRESH_SECRET to different random values of at least 32 bytes.');
    }
    if (accessSecret === refreshSecret) throw new Error('JWT signing secrets must be different.');
    const appOrigin = new URL(env.APP_ORIGIN ?? 'http://localhost:5173');
    if (!['http:', 'https:'].includes(appOrigin.protocol) || appOrigin.origin !== (env.APP_ORIGIN ?? 'http://localhost:5173')) {
        throw new Error('APP_ORIGIN must be an HTTP(S) origin without a path or trailing slash.');
    }
    const secureCookies = env.NODE_ENV === 'production';
    if (secureCookies && appOrigin.protocol !== 'https:') throw new Error('Production requires an HTTPS APP_ORIGIN.');
    const port = Number(env.PORT ?? 3001);
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be between 1 and 65535.');
    return {
        port,
        appOrigin: appOrigin.origin,
        mongoUri: env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017',
        database: env.MONGODB_DATABASE ?? 'inventory_dev',
        accessSecret,
        refreshSecret,
        secureCookies,
        accessTtlSeconds: 15 * 60,
        refreshTtlSeconds: 7 * 24 * 60 * 60,
    };
}
