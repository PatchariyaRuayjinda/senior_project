import { parse, serialize } from 'cookie';
import { Elysia, t } from 'elysia';
import type { Config } from '../../../config';
import { bearerToken } from '../../../shared/adapters/http/bearer-token';
import { ApplicationError } from '../../../shared/domain/errors';
import type { AuthService } from '../../application/service';
import { createRateLimiter } from './rate-limit';

export function createAuthRoutes(auth: AuthService, config: Config, now: () => number) {
    const rateLimit = createRateLimiter(now);
    const cookieName = config.secureCookies ? '__Host-inventory_refresh' : 'inventory_refresh';
    const cookieOptions = {
        httpOnly: true,
        secure: config.secureCookies,
        sameSite: 'strict' as const,
        path: '/',
    };
    const readRefresh = (request: Request) =>
        parse(request.headers.get('cookie') ?? '')[cookieName];
    const clearCookie = () => serialize(cookieName, '', { ...cookieOptions, maxAge: 0 });
    const sessionResponse = (result: Awaited<ReturnType<AuthService['login']>>) => ({
        accessToken: result.accessToken,
        expiresIn: result.expiresIn,
        user: result.user,
    });
    const sessionCookie = (result: Awaited<ReturnType<AuthService['login']>>) =>
        serialize(cookieName, result.refreshToken, {
            ...cookieOptions,
            expires: result.refreshExpiresAt,
            maxAge: Math.max(0, Math.floor((result.refreshExpiresAt.getTime() - now()) / 1000)),
        });

    return new Elysia()
        .post(
            '/api/auth/login',
            async ({ body, request, server, set }) => {
                const ip = server?.requestIP(request)?.address ?? 'local';
                rateLimit(`login:${ip}`, 10);
                const result = await auth.login(body.username, body.password, readRefresh(request));
                set.headers['set-cookie'] = sessionCookie(result);
                return sessionResponse(result);
            },
            {
                body: t.Object(
                    {
                        username: t.String({
                            minLength: 3,
                            maxLength: 64,
                            pattern: '^[a-zA-Z0-9._-]+$',
                        }),
                        password: t.String({ minLength: 1, maxLength: 128 }),
                    },
                    { additionalProperties: false },
                ),
            },
        )
        .post('/api/auth/refresh', async ({ request, server, set }) => {
            const ip = server?.requestIP(request)?.address ?? 'local';
            rateLimit(`refresh:${ip}`, 60);
            try {
                const result = await auth.refresh(readRefresh(request));
                set.headers['set-cookie'] = sessionCookie(result);
                return sessionResponse(result);
            } catch (error) {
                if (error instanceof ApplicationError && error.kind === 'unauthenticated')
                    set.headers['set-cookie'] = clearCookie();
                throw error;
            }
        })
        .post('/api/auth/logout', async ({ request, set }) => {
            await auth.logout(readRefresh(request));
            set.headers['set-cookie'] = clearCookie();
            set.status = 204;
            return undefined;
        })
        .get('/api/auth/me', async ({ request }) => ({
            user: await auth.authenticate(bearerToken(request.headers.get('authorization'))),
        }))
        .get('/api/admin/users', async ({ request }) => ({
            users: await auth.listUsers(bearerToken(request.headers.get('authorization'))),
        }));
}
