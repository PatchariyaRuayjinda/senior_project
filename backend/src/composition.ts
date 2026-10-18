/** Composition root: the only place that selects concrete adapters for use cases. */
import type { Db, MongoClient } from 'mongodb';
import { randomUUID } from 'node:crypto';
import { createMongoAuthRepositories } from './auth/adapters/mongodb/repositories';
import { createBunPasswordVerifier } from './auth/adapters/security/passwords';
import { createJwtTokenProvider } from './auth/adapters/security/tokens';
import { createAuthUseCases } from './auth/application/service';
import type { Config } from './config';
import { inventoryCollections } from './inventory/adapters/mongodb/collections';
import {
    createMongoInventoryHistory,
    createMongoInventoryRepositories,
} from './inventory/adapters/mongodb/repositories';
import { createMongoInventoryUnitOfWork } from './inventory/adapters/mongodb/unit-of-work';
import { createInventoryUseCases } from './inventory/application/service';
import type { Runtime } from './shared/application/runtime';

const systemRuntime: Runtime = { now: () => new Date(), newId: randomUUID };

export async function createAuthService(db: Db, config: Config, now = systemRuntime.now) {
    const runtime: Runtime = { ...systemRuntime, now };
    return createAuthUseCases({
        ...createMongoAuthRepositories(db),
        tokens: createJwtTokenProvider(
            { access: config.accessSecret, refresh: config.refreshSecret },
            runtime,
        ),
        passwords: await createBunPasswordVerifier(),
        policy: {
            accessTtlSeconds: config.accessTtlSeconds,
            refreshTtlSeconds: config.refreshTtlSeconds,
        },
        runtime,
    });
}

export function createInventoryService(db: Db, client: MongoClient) {
    const data = inventoryCollections(db);
    return createInventoryUseCases(
        createMongoInventoryRepositories(data),
        createMongoInventoryUnitOfWork(client, data, systemRuntime),
        createMongoInventoryHistory(data),
        systemRuntime,
    );
}
