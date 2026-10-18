import { MongoClient } from 'mongodb';
import type { Config } from './config';
import { assertMigrationsReady } from './migrations';

export async function connectDatabase(config: Config) {
    const client = new MongoClient(config.mongoUri, { serverSelectionTimeoutMS: 5000 });
    try {
        await client.connect();
        const db = client.db(config.database);
        await assertMigrationsReady(db);
        return { client, db };
    } catch (error) {
        await client.close();
        throw error;
    }
}
