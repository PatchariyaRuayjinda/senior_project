import { checkSeedRecords, locations, refuse, warehouse } from '../migration-support/v1.js';

export async function up(db, client) {
    await checkSeedRecords(db, 'warehouses', [warehouse]);
    await checkSeedRecords(db, 'locations', locations);
    const session = client.startSession();
    try {
        await session.withTransaction(async () => {
            await db.collection('warehouses').updateOne({ _id: warehouse._id }, { $setOnInsert: warehouse }, { upsert: true, session });
            for (const location of locations) {
                await db.collection('locations').updateOne({ _id: location._id }, { $setOnInsert: location }, { upsert: true, session });
            }
        });
    } finally {
        await session.endSession();
    }
}

export async function down(db, client) {
    await checkSeedRecords(db, 'warehouses', [warehouse], true);
    await checkSeedRecords(db, 'locations', locations, true);
    // Future operational collections must also prevent removal of reference data.
    const exempt = new Set(['warehouses', 'locations', 'users', 'sessions', '_migrations', '_migration_lock']);
    for (const { name } of await db.listCollections({}, { nameOnly: true }).toArray()) {
        if (!exempt.has(name) && await db.collection(name).findOne({}, { projection: { _id: 1 } })) {
            refuse('Cannot remove the base warehouse while inventory or operational data exists.');
        }
    }
    const session = client.startSession();
    try {
        await session.withTransaction(async () => {
            await db.collection('locations').deleteMany({ _id: { $in: locations.map(location => location._id) } }, { session });
            await db.collection('warehouses').deleteOne({ _id: warehouse._id }, { session });
        });
    } finally {
        await session.endSession();
    }
}
