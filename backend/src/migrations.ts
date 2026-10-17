import { readdir } from 'node:fs/promises';
import type { Db } from 'mongodb';

export async function assertMigrationsReady(db: Db) {
    if (await db.collection<{ _id: string }>('_migration_lock').findOne({ _id: 'runner' })) {
        throw new Error('Database migration is running. Start the API after it finishes.');
    }
    const expected = (await readdir(new URL('../migrations/', import.meta.url))).filter(name => name.endsWith('.js')).sort();
    const applied = await db.collection<{ fileName: string }>('_migrations').find({}, { projection: { fileName: 1 } }).toArray();
    const names = applied.map(row => row.fileName).sort();
    if (expected.length !== names.length || expected.some((name, index) => name !== names[index])) {
        throw new Error('Database migrations do not match this application. In backend/, run yarn migrate-status and yarn migrate-up before starting the API. Use matching application code if the database is newer.');
    }
}
