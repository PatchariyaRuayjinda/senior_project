// Only the browser tests use this entry point. It never connects to MONGODB_URI.
import { randomBytes } from 'node:crypto';
import { resolve } from 'node:path';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';
import { createApp } from '../src/app';
import { createAuthService, hashPassword } from '../src/auth/service';
import { loadConfig } from '../src/config';
import { collections } from '../src/database';
import { migrateTestDatabase } from '../tests/helpers/migrations';
import { assertMigrationsReady } from '../src/migrations';

process.env.MONGOMS_DOWNLOAD_DIR = resolve(import.meta.dir, '../../.cache/mongodb');
const config = loadConfig({
    PORT: '3101', APP_ORIGIN: 'http://localhost:4173',
    JWT_ACCESS_SECRET: randomBytes(32).toString('hex'), JWT_REFRESH_SECRET: randomBytes(32).toString('hex'),
});
const mongo = await MongoMemoryReplSet.create({ binary: { version: '7.0.24' }, replSet: { count: 1 } });
const client = await new MongoClient(mongo.getUri()).connect();
const db = client.db('browser_tests');
await migrateTestDatabase(mongo.getUri(), 'browser_tests');
await assertMigrationsReady(db);
const passwordHash = await hashPassword('browser-test-password');
await collections(db).users.insertMany([
    { _id: 'test-admin', username: 'admin', passwordHash, role: 'admin', enabled: true, createdAt: new Date() },
    { _id: 'test-staff', username: 'staff', passwordHash, role: 'staff', enabled: true, createdAt: new Date() },
]);
const app = createApp(await createAuthService(db, config), config).listen({ hostname: '127.0.0.1', port: config.port });
async function shutdown() {
    await app.stop();
    await client.close();
    await mongo.stop();
    process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
