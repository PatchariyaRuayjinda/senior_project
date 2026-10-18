import type { Db } from 'mongodb';
import type { SessionRepository, UserRepository } from '../../application/ports';
import { publicUser } from '../../domain/models';
import { collections } from './collections';

export function createMongoAuthRepositories(db: Db): {
    users: UserRepository;
    sessions: SessionRepository;
} {
    const data = collections(db);
    return {
        users: {
            async findByUsername(username) {
                const record = await data.users.findOne({ username });
                if (!record) return null;
                const { _id, ...fields } = record;
                return { id: _id, ...fields };
            },
            async findEnabledById(id) {
                const record = await data.users.findOne({ _id: id, enabled: true });
                if (!record) return null;
                const { _id, ...fields } = record;
                return { id: _id, ...fields };
            },
            async listPublic() {
                const records = await data.users
                    .find({}, { projection: { passwordHash: 0 } })
                    .sort({ username: 1 })
                    .toArray();
                return records.map((record) => publicUser({ ...record, id: record._id }));
            },
        },
        sessions: {
            async insert({ id, ...fields }) {
                await data.sessions.insertOne({ _id: id, ...fields });
            },
            async findActive(sessionId, userId, at) {
                const record = await data.sessions.findOne({
                    _id: sessionId,
                    userId,
                    revokedAt: null,
                    expiresAt: { $gt: at },
                });
                if (!record) return null;
                const { _id, ...fields } = record;
                return { id: _id, ...fields };
            },
            async rotateRefresh(sessionId, userId, currentHash, nextHash, at) {
                const record = await data.sessions.findOneAndUpdate(
                    {
                        _id: sessionId,
                        userId,
                        revokedAt: null,
                        expiresAt: { $gt: at },
                        refreshHash: currentHash,
                    },
                    { $set: { refreshHash: nextHash } },
                    { returnDocument: 'after' },
                );
                if (!record) return null;
                const { _id, ...fields } = record;
                return { id: _id, ...fields };
            },
            async revoke(sessionId, userId, at, onlyUnexpired = false) {
                await data.sessions.updateOne(
                    {
                        _id: sessionId,
                        userId,
                        revokedAt: null,
                        ...(onlyUnexpired ? { expiresAt: { $gt: at } } : {}),
                    },
                    { $set: { revokedAt: at } },
                );
            },
        },
    };
}
