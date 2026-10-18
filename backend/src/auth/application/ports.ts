import type { Actor } from '../../shared/domain/actor';
import type { Session, User } from '../domain/models';

export interface UserRepository {
    findByUsername(username: string): Promise<User | null>;
    findEnabledById(id: string): Promise<User | null>;
    listPublic(): Promise<Actor[]>;
}

export interface SessionRepository {
    insert(session: Session): Promise<void>;
    findActive(sessionId: string, userId: string, at: Date): Promise<Session | null>;
    /** Consume exactly the current refresh token. Concurrent reuse must fail. */
    rotateRefresh(
        sessionId: string,
        userId: string,
        currentHash: string,
        nextHash: string,
        at: Date,
    ): Promise<Session | null>;
    revoke(sessionId: string, userId: string, at: Date, onlyUnexpired?: boolean): Promise<void>;
}

export type TokenKind = 'access' | 'refresh';
export interface TokenClaims {
    userId: string;
    sessionId: string;
    expiresAt: Date;
}
export interface TokenProvider {
    sign(kind: TokenKind, userId: string, sessionId: string, expiresAt: Date): Promise<string>;
    verify(kind: TokenKind, token: string): Promise<TokenClaims>;
    hash(token: string): string;
}

export interface PasswordVerifier {
    /** Unknown users still incur a real password-verification cost. */
    matches(password: string, hash: string | undefined): Promise<boolean>;
}

export interface SessionPolicy {
    accessTtlSeconds: number;
    refreshTtlSeconds: number;
}
