import { Elysia, t } from 'elysia';
import { parse, serialize } from 'cookie';
import type { Config } from './config';
import type { AuthService } from './auth/service';
import { createRateLimiter } from './auth/rateLimit';
import { HttpError } from './errors';

export function createApp(auth: AuthService, config: Config, now = () => Date.now()) {
    const rateLimit = createRateLimiter(now);
    const cookieName = config.secureCookies ? '__Host-inventory_refresh' : 'inventory_refresh';
    const cookieOptions = { httpOnly: true, secure: config.secureCookies, sameSite: 'strict' as const, path: '/' };
    const readRefresh = (request: Request) => parse(request.headers.get('cookie') ?? '')[cookieName];
    const clearCookie = () => serialize(cookieName, '', { ...cookieOptions, maxAge: 0 });
    const sessionResponse = (result: Awaited<ReturnType<AuthService['login']>>) => ({
        accessToken: result.accessToken, expiresIn: result.expiresIn, user: result.user,
    });
    const sessionCookie = (result: Awaited<ReturnType<AuthService['login']>>) => serialize(
        cookieName, result.refreshToken,
        { ...cookieOptions, expires: result.refreshExpiresAt, maxAge: Math.max(0, Math.floor((result.refreshExpiresAt.getTime() - now()) / 1000)) },
    );

    return new Elysia({ serve: { maxRequestBodySize: 16 * 1024 } })
        .onRequest(({ request, set }) => {
            set.headers['cache-control'] = 'no-store';
            set.headers['x-content-type-options'] = 'nosniff';
            if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
                if (request.headers.get('origin') !== config.appOrigin) {
                    throw new HttpError(403, 'UNTRUSTED_ORIGIN', 'Request origin is not allowed.');
                }
            }
        })
        .onError(({ error, code, set }) => {
            if (error instanceof HttpError) {
                set.status = error.status;
                if (error.status === 429) set.headers['retry-after'] = '60';
                return { error: { code: error.code, message: error.message } };
            }
            if (code === 'VALIDATION' || code === 'PARSE') {
                set.status = 400;
                return { error: { code: 'INVALID_REQUEST', message: 'Check the submitted fields.' } };
            }
            if (code === 'NOT_FOUND') {
                set.status = 404;
                return { error: { code: 'NOT_FOUND', message: 'Endpoint not found.' } };
            }
            set.status = 500;
            console.error('API request failed:', code);
            return { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' } };
        })
        .get('/api/health', () => ({ status: 'ok' }))
        .post('/api/auth/login', async ({ body, request, server, set }) => {
            const ip = server?.requestIP(request)?.address ?? 'local';
            rateLimit(`login:${ip}`, 10);
            const result = await auth.login(body.username, body.password, readRefresh(request));
            set.headers['set-cookie'] = sessionCookie(result);
            return sessionResponse(result);
        }, {
            body: t.Object({
                username: t.String({ minLength: 3, maxLength: 64, pattern: '^[a-zA-Z0-9._-]+$' }),
                password: t.String({ minLength: 1, maxLength: 128 }),
            }, { additionalProperties: false }),
        })
        .post('/api/auth/refresh', async ({ request, server, set }) => {
            const ip = server?.requestIP(request)?.address ?? 'local';
            rateLimit(`refresh:${ip}`, 60);
            try {
                const result = await auth.refresh(readRefresh(request));
                set.headers['set-cookie'] = sessionCookie(result);
                return sessionResponse(result);
            } catch (error) {
                if (error instanceof HttpError && error.status === 401) set.headers['set-cookie'] = clearCookie();
                throw error;
            }
        })
        .post('/api/auth/logout', async ({ request, set }) => {
            await auth.logout(readRefresh(request));
            set.headers['set-cookie'] = clearCookie();
            set.status = 204;
            return undefined;
        })
        .get('/api/auth/me', async ({ request }) => ({ user: await auth.authenticate(request.headers.get('authorization')) }))
        .get('/api/admin/users', async ({ request }) => ({ users: await auth.listUsers(request.headers.get('authorization')) }));
}
