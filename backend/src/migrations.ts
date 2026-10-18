import { readdir } from 'node:fs/promises';
import type { Db } from 'mongodb';

export async function assertMigrationsReady(db: Db) {
    await assertNoActiveMigration(db);
    await assertMatchingMigrationHistory(db);
}

async function assertNoActiveMigration(db: Db) {
    const activeLock = await db.collection<{ _id: string }>('_migration_lock').findOne({
        _id: 'runner',
    });

    if (activeLock) {
        throw new Error('Database migration is running. Start the API after it finishes.');
    }
}

async function assertMatchingMigrationHistory(db: Db) {
    const directoryEntries = await readdir(new URL('../migrations/', import.meta.url));
    const expectedFileNames = directoryEntries.filter(name => name.endsWith('.js')).sort();
    const appliedMigrations = await db.collection<{ fileName: string }>('_migrations')
        .find({}, { projection: { fileName: 1 } })
        .toArray();
    const appliedFileNames = appliedMigrations.map(migration => migration.fileName).sort();

    const sameCount = expectedFileNames.length === appliedFileNames.length;
    const sameFileNames = expectedFileNames.every((name, index) => name === appliedFileNames[index]);

    if (!sameCount || !sameFileNames) {
        throw new Error(
            'Database migrations do not match this application. '
            + 'In backend/, run yarn migrate-status and yarn migrate-up before starting the API. '
            + 'Use matching application code if the database is newer.',
        );
    }
}
