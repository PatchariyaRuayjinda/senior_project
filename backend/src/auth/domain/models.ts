import type { Role } from '../../shared/domain/actor';

export interface User {
    id: string;
    username: string;
    passwordHash: string;
    role: Role;
    enabled: boolean;
    createdAt: Date;
}

export interface Session {
    id: string;
    userId: string;
    refreshHash: string;
    createdAt: Date;
    expiresAt: Date;
    revokedAt: Date | null;
}

export const publicUser = (user: Pick<User, 'id' | 'username' | 'role'>) => ({
    id: user.id,
    username: user.username,
    role: user.role,
});
