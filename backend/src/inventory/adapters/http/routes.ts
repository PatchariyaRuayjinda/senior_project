import { Elysia, t } from 'elysia';
import type { AuthService } from '../../../auth/application/service';
import { bearerToken } from '../../../shared/adapters/http/bearer-token';
import type { InventoryUseCases } from '../../application/service';

import { locationFields, lotFields, params, productFields, strict, text, whole } from './schemas';

export function createInventoryRoutes(auth: AuthService, inventory: InventoryUseCases) {
    return new Elysia({ prefix: '/api/inventory' })
        .derive(async ({ request }) => ({
            mutationContext: {
                actor: await auth.authenticate(bearerToken(request.headers.get('authorization'))),
                key: request.headers.get('idempotency-key'),
            },
        }))
        .get('/products', () => inventory.listProducts())
        .post(
            '/products',
            ({ mutationContext, body }) => inventory.createProduct(mutationContext, body),
            {
                body: t.Object(productFields, strict),
            },
        )
        .put(
            '/products/:id',
            ({ mutationContext, params, body }) =>
                inventory.updateProduct(mutationContext, params.id, body),
            {
                params,
                body: t.Object(
                    { ...productFields, revision: whole(), active: t.Boolean() },
                    strict,
                ),
            },
        )
        .get('/lots', ({ query }) => inventory.listLots(query.productId), {
            query: t.Object({ productId: t.Optional(text()) }, strict),
        })
        .post('/lots', ({ mutationContext, body }) => inventory.createLot(mutationContext, body), {
            body: t.Object(lotFields, strict),
        })
        .put(
            '/lots/:id',
            ({ mutationContext, params, body }) =>
                inventory.updateLot(mutationContext, params.id, body),
            {
                params,
                body: t.Object({ ...lotFields, revision: whole() }, strict),
            },
        )
        .get('/locations', () => inventory.listLocations())
        .post(
            '/locations',
            ({ mutationContext, body }) => inventory.createLocation(mutationContext, body),
            {
                body: t.Object(locationFields, strict),
            },
        )
        .put(
            '/locations/:id',
            ({ mutationContext, params, body }) =>
                inventory.updateLocation(mutationContext, params.id, body),
            {
                params,
                body: t.Object(
                    {
                        ...locationFields,
                        revision: whole(),
                        active: t.Boolean(),
                        inboundBlocked: t.Boolean(),
                        outboundBlocked: t.Boolean(),
                        reason: t.Optional(t.String({ maxLength: 1000 })),
                        labelConfirmed: t.Optional(t.Boolean()),
                    },
                    strict,
                ),
            },
        )
        .get('/pallets', () => inventory.listPallets())
        .get(
            '/history/:entityType/:id',
            ({ params }) => inventory.history(params.entityType, params.id),
            {
                params: t.Object({
                    id: text(),
                    entityType: t.Union([
                        t.Literal('product'),
                        t.Literal('lot'),
                        t.Literal('location'),
                    ]),
                }),
            },
        );
}
