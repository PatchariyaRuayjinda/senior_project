import { createCollection, date, dropEmptyCollections, schema, text } from '../migration-support/v1.js';

export async function up(db) {
    await createCollection(db, 'users', schema(
        ['_id', 'username', 'passwordHash', 'role', 'enabled', 'createdAt'], {
            username: { ...text, minLength: 3, maxLength: 64, pattern: '^[a-z0-9._-]+$' },
            passwordHash: text, role: { enum: ['admin', 'staff'] },
            enabled: { bsonType: 'bool' }, createdAt: date,
        },
    ), [{ key: { username: 1 }, name: 'username_1', unique: true }]);
    await createCollection(db, 'sessions', schema(
        ['_id', 'userId', 'refreshHash', 'createdAt', 'expiresAt', 'revokedAt'], {
            userId: text, refreshHash: { ...text, pattern: '^[a-f0-9]{64}$' },
            createdAt: date, expiresAt: date, revokedAt: { bsonType: ['date', 'null'] },
        },
    ), [
        { key: { expiresAt: 1 }, name: 'expiresAt_1', expireAfterSeconds: 0 },
        { key: { userId: 1 }, name: 'userId_1' },
    ]);
}

export async function down(db) {
    await dropEmptyCollections(db, ['users', 'sessions']);
}
