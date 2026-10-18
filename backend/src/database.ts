import { MongoClient, type Db } from 'mongodb';
import type { Config } from './config';
import { assertMigrationsReady } from './migrations';

export type Role = 'admin' | 'staff';
export interface UserRecord {
    _id: string;
    username: string;
    passwordHash: string;
    role: Role;
    enabled: boolean;
    createdAt: Date;
}
export interface SessionRecord {
    _id: string;
    userId: string;
    refreshHash: string;
    createdAt: Date;
    expiresAt: Date;
    revokedAt: Date | null;
}

export function collections(db: Db) {
    return {
        users: db.collection<UserRecord>('users'),
        sessions: db.collection<SessionRecord>('sessions'),
    };
}

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
