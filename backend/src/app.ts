import { Elysia } from 'elysia';
import { createAuthRoutes } from './auth/adapters/http/routes';
import type { AuthService } from './auth/application/service';
import type { Config } from './config';
import { createInventoryRoutes } from './inventory/adapters/http/routes';
import type { InventoryUseCases } from './inventory/application/service';
import { httpStatus } from './shared/adapters/http/errors';
import { ApplicationError } from './shared/domain/errors';

export function createApp(
    auth: AuthService,
    config: Config,
    now = () => Date.now(),
    inventory?: InventoryUseCases,
) {
    return new Elysia({ serve: { maxRequestBodySize: 16 * 1024 } })
        .onRequest(({ request, set }) => {
            set.headers['cache-control'] = 'no-store';
            set.headers['x-content-type-options'] = 'nosniff';
            if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
                if (request.headers.get('origin') !== config.appOrigin) {
                    throw new ApplicationError(
                        'forbidden',
                        'UNTRUSTED_ORIGIN',
                        'Request origin is not allowed.',
                    );
                }
            }
        })
        .onError(({ error, code, set }) => {
            if (error instanceof ApplicationError) {
                set.status = httpStatus(error.kind);
                if (error.kind === 'rate_limit') set.headers['retry-after'] = '60';
                return { error: { code: error.code, message: error.message } };
            }
            if (code === 'VALIDATION' || code === 'PARSE') {
                set.status = 400;
                return {
                    error: { code: 'INVALID_REQUEST', message: 'Check the submitted fields.' },
                };
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
        .use(createAuthRoutes(auth, config, now))
        .use(inventory ? createInventoryRoutes(auth, inventory) : new Elysia());
}
