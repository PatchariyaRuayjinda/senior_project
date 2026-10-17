import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { MongoClient } from 'mongodb';
import { config, status, up, down } from 'migrate-mongo';

const action = process.argv[2];
let client;
let db;
let owner;

try {
    if (!['status', 'up', 'down'].includes(action) || process.argv.length !== 3) {
        throw new Error('[migration-precondition] Usage: yarn migrate-status | migrate-up | migrate-down');
    }
    const uri = process.env.MONGODB_URI;
    const database = process.env.MONGODB_DATABASE;
    if (!uri || !/^mongodb(?:\+srv)?:\/\//.test(uri) || !database || /[\s/\\.\x00"$*<>:|?]/.test(database)
        || ['admin', 'local', 'config'].includes(database)) {
        throw new Error('[migration-precondition] Set an explicit MONGODB_URI and application MONGODB_DATABASE.');
    }
    config.set({
        migrationsDir: fileURLToPath(new URL('../migrations/', import.meta.url)),
        migrationFileExtension: '.js', changelogCollectionName: '_migrations',
        useFileHash: false, moduleSystem: 'esm', lockTtl: 0,
    });
    client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });
    await client.connect();
    db = client.db(database);

    if (action === 'status') {
        const rows = await status(db);
        console.table(rows.map(({ fileName, appliedAt }) => ({ migration: fileName, appliedAt })));
        console.log(await db.collection('_migration_lock').findOne({ _id: 'runner' }) ? 'Migration lock: active' : 'Migration lock: none');
        const known = new Set(rows.map(row => row.fileName));
        if (await db.collection('_migrations').findOne({ fileName: { $nin: [...known] } })) {
            console.error('Database contains unknown migrations. Use matching application code.');
            process.exitCode = 1;
        }
    } else {
        owner = randomUUID();
        try {
            await db.collection('_migration_lock').insertOne({ _id: 'runner', owner, createdAt: new Date() });
        } catch (error) {
            if (error.code === 11000) throw new Error('[migration-precondition] Another migration holds the lock. If a runner crashed, follow the lock recovery guide.');
            throw error;
        }
        await db.collection('_migrations').createIndex({ fileName: 1 }, { unique: true });
        const rows = await status(db);
        const known = new Set(rows.map(row => row.fileName));
        const history = await db.collection('_migrations').find({}, { projection: { fileName: 1 } }).toArray();
        if (history.some(row => !known.has(row.fileName))) {
            throw new Error('[migration-precondition] Database contains unknown migrations. Use matching application code.');
        }
        let pendingSeen = false;
        for (const row of rows) {
            if (row.appliedAt === 'PENDING') pendingSeen = true;
            else if (pendingSeen) throw new Error('[migration-precondition] Migration history is out of order. Inspect the changelog before proceeding.');
        }
        const files = await (action === 'up' ? up : down)(db, client);
        console.log(files.length ? files.map(file => `${action}: ${file}`).join('\n') : 'No migrations to apply.');
    }
} catch (error) {
    // Driver errors may contain connection details. Only our controlled preconditions are printed.
    const message = error instanceof Error ? error.message : '';
    const marker = '[migration-precondition] ';
    const position = message.indexOf(marker);
    console.error(position >= 0 ? message.slice(position + marker.length)
        : 'Migration failed. Check database access, replica-set support and schema/index compatibility. Credentials are omitted.');
    process.exitCode = 1;
} finally {
    if (db && owner) {
        await db.collection('_migration_lock').deleteOne({ _id: 'runner', owner }).catch(() => {
            console.error('Could not release the migration lock. Follow the lock recovery guide before restarting the API.');
            process.exitCode = 1;
        });
    }
    await client?.close().catch(() => { process.exitCode = 1; });
}
