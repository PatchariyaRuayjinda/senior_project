import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { MongoClient } from 'mongodb';
import { config, status, up, down } from 'migrate-mongo';

const CHANGELOG_COLLECTION = '_migrations';
const LOCK_COLLECTION = '_migration_lock';
const LOCK_ID = 'runner';
const PRECONDITION_MARKER = '[migration-precondition] ';

async function main() {
    let client;

    try {
        const action = readAction(process.argv.slice(2));
        const { uri, database } = readDatabaseConfig(process.env);
        configureMigrations();

        client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });
        await client.connect();
        const db = client.db(database);

        if (action === 'status') {
            await showStatus(db);
            return;
        }

        await runMigrations(db, client, action);
    } catch (error) {
        reportFailure(error);
    } finally {
        if (client) {
            await closeConnection(client);
        }
    }
}

function readAction(args) {
    const [action] = args;
    if (args.length !== 1 || !['status', 'up', 'down'].includes(action)) {
        refuse('Usage: yarn migrate-status | migrate-up | migrate-down');
    }
    return action;
}

function readDatabaseConfig(environment) {
    const uri = environment.MONGODB_URI;
    const database = environment.MONGODB_DATABASE;
    const validUri = uri && /^mongodb(?:\+srv)?:\/\//.test(uri);
    const validDatabaseName = database && !/[\s/\\.\x00"$*<>:|?]/.test(database);
    const systemDatabase = ['admin', 'local', 'config'].includes(database);

    if (!validUri || !validDatabaseName || systemDatabase) {
        refuse('Set an explicit MONGODB_URI and application MONGODB_DATABASE.');
    }
    return { uri, database };
}

function configureMigrations() {
    config.set({
        migrationsDir: fileURLToPath(new URL('../migrations/', import.meta.url)),
        migrationFileExtension: '.js',
        changelogCollectionName: CHANGELOG_COLLECTION,
        useFileHash: false,
        moduleSystem: 'esm',
        // The runner owns a non-expiring atomic lock; disable the library's TTL lock.
        lockTtl: 0,
    });
}

async function showStatus(db) {
    const migrations = await status(db);
    const displayRows = migrations.map(({ fileName, appliedAt }) => ({
        migration: fileName,
        appliedAt,
    }));
    console.table(displayRows);

    const activeLock = await db.collection(LOCK_COLLECTION).findOne({ _id: LOCK_ID });
    console.log(activeLock ? 'Migration lock: active' : 'Migration lock: none');
    await assertKnownMigrations(db, migrations);
}

async function runMigrations(db, client, action) {
    const owner = randomUUID();

    try {
        await acquireLock(db, owner);
        await db.collection(CHANGELOG_COLLECTION).createIndex({ fileName: 1 }, { unique: true });

        const migrations = await status(db);
        await assertKnownMigrations(db, migrations);
        assertMigrationOrder(migrations);

        const migrate = action === 'up' ? up : down;
        const changedFiles = await migrate(db, client);
        showMigrationResult(action, changedFiles);
    } finally {
        // A failed acquisition must never remove another runner's lock.
        await releaseLock(db, owner);
    }
}

async function acquireLock(db, owner) {
    try {
        await db.collection(LOCK_COLLECTION).insertOne({
            _id: LOCK_ID,
            owner,
            createdAt: new Date(),
        });
    } catch (error) {
        if (error.code === 11000) {
            refuse('Another migration holds the lock. If a runner crashed, follow the lock recovery guide.');
        }
        throw error;
    }
}

async function releaseLock(db, owner) {
    try {
        await db.collection(LOCK_COLLECTION).deleteOne({ _id: LOCK_ID, owner });
    } catch {
        console.error('Could not release the migration lock. Follow the lock recovery guide before restarting the API.');
        process.exitCode = 1;
    }
}

async function assertKnownMigrations(db, migrations) {
    const knownFileNames = migrations.map(migration => migration.fileName);
    const unknownMigration = await db.collection(CHANGELOG_COLLECTION).findOne({
        fileName: { $nin: knownFileNames },
    });

    if (unknownMigration) {
        refuse('Database contains unknown migrations. Use matching application code.');
    }
}

function assertMigrationOrder(migrations) {
    let pendingSeen = false;

    for (const migration of migrations) {
        if (migration.appliedAt === 'PENDING') {
            pendingSeen = true;
        } else if (pendingSeen) {
            refuse('Migration history is out of order. Inspect the changelog before proceeding.');
        }
    }
}

function showMigrationResult(action, files) {
    const message = files.length
        ? files.map(file => `${action}: ${file}`).join('\n')
        : 'No migrations to apply.';
    console.log(message);
}

function refuse(message) {
    throw new Error(`${PRECONDITION_MARKER}${message}`);
}

function reportFailure(error) {
    // migrate-mongo wraps migration errors, so the marker may appear inside its message.
    // Driver errors may contain credentials; only controlled preconditions are displayed.
    const message = error instanceof Error ? error.message : '';
    const markerPosition = message.indexOf(PRECONDITION_MARKER);
    const safeMessage = markerPosition >= 0
        ? message.slice(markerPosition + PRECONDITION_MARKER.length)
        : 'Migration failed. Check database access, replica-set support and schema/index compatibility. Credentials are omitted.';

    console.error(safeMessage);
    process.exitCode = 1;
}

async function closeConnection(client) {
    try {
        await client.close();
    } catch {
        process.exitCode = 1;
    }
}

await main();
