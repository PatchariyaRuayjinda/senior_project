import type { Db } from 'mongodb';
import type { Role } from '../../../shared/domain/actor';

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
