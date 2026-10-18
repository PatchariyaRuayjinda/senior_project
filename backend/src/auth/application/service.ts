import type { Runtime } from '../../shared/application/runtime';
import { ApplicationError, unauthorized } from '../../shared/domain/errors';
import { publicUser, type User } from '../domain/models';
import type {
    PasswordVerifier,
    SessionPolicy,
    SessionRepository,
    TokenProvider,
    UserRepository,
} from './ports';

export function createAuthUseCases({
    users,
    sessions,
    tokens,
    passwords,
    policy,
    runtime,
}: {
    users: UserRepository;
    sessions: SessionRepository;
    tokens: TokenProvider;
    passwords: PasswordVerifier;
    policy: SessionPolicy;
    runtime: Runtime;
}) {
    async function bundle(
        user: User,
        sessionId: string,
        refreshToken: string,
        refreshExpiresAt: Date,
    ) {
        const accessExpiresAt = new Date(
            Math.min(
                runtime.now().getTime() + policy.accessTtlSeconds * 1000,
                refreshExpiresAt.getTime(),
            ),
        );
        return {
            accessToken: await tokens.sign('access', user.id, sessionId, accessExpiresAt),
            expiresIn: Math.max(
                0,
                Math.floor((accessExpiresAt.getTime() - runtime.now().getTime()) / 1000),
            ),
            user: publicUser(user),
            refreshToken,
            refreshExpiresAt,
        };
    }

    async function logout(refreshToken: string | undefined) {
        if (!refreshToken) return;
        let claims;
        try {
            claims = await tokens.verify('refresh', refreshToken);
        } catch {
            return;
        }
        await sessions.revoke(claims.sessionId, claims.userId, runtime.now());
    }

    async function login(username: string, password: string, previousRefreshToken?: string) {
        const user = await users.findByUsername(username.trim().toLowerCase());
        // Unknown users still pay the password-verification cost; the response is identical.
        const matches = await passwords.matches(password, user?.passwordHash);
        if (!user || !matches || !user.enabled) {
            throw new ApplicationError(
                'unauthenticated',
                'INVALID_CREDENTIALS',
                'Username or password is incorrect.',
            );
        }
        await logout(previousRefreshToken);
        const sessionId = runtime.newId();
        const expiresAt = new Date(
            Math.floor(runtime.now().getTime() / 1000) * 1000 + policy.refreshTtlSeconds * 1000,
        );
        const refreshToken = await tokens.sign('refresh', user.id, sessionId, expiresAt);
        await sessions.insert({
            id: sessionId,
            userId: user.id,
            refreshHash: tokens.hash(refreshToken),
            createdAt: runtime.now(),
            expiresAt,
            revokedAt: null,
        });
        return bundle(user, sessionId, refreshToken, expiresAt);
    }

    async function refresh(refreshToken: string | undefined) {
        if (!refreshToken) throw unauthorized();
        const claims = await tokens.verify('refresh', refreshToken);
        const nextToken = await tokens.sign(
            'refresh',
            claims.userId,
            claims.sessionId,
            claims.expiresAt,
        );
        const session = await sessions.rotateRefresh(
            claims.sessionId,
            claims.userId,
            tokens.hash(refreshToken),
            tokens.hash(nextToken),
            runtime.now(),
        );
        if (!session) {
            // A correctly signed, previously consumed token means replay. Revoke the family.
            // A forged token fails verification above and cannot revoke somebody's session.
            await sessions.revoke(claims.sessionId, claims.userId, runtime.now(), true);
            throw unauthorized();
        }
        const user = await users.findEnabledById(session.userId);
        if (!user) {
            await sessions.revoke(session.id, session.userId, runtime.now());
            throw unauthorized();
        }
        return bundle(user, session.id, nextToken, session.expiresAt);
    }

    async function authenticate(token: string | null) {
        if (!token) throw unauthorized();
        const claims = await tokens.verify('access', token);
        const session = await sessions.findActive(claims.sessionId, claims.userId, runtime.now());
        if (!session) throw unauthorized();
        const user = await users.findEnabledById(claims.userId);
        if (!user) throw unauthorized();
        // Authorization uses the current database role, never a role sent by the browser.
        return publicUser(user);
    }

    async function listUsers(token: string | null) {
        const user = await authenticate(token);
        if (user.role !== 'admin')
            throw new ApplicationError('forbidden', 'FORBIDDEN', 'Administrator access required.');
        return users.listPublic();
    }

    return { login, refresh, logout, authenticate, listUsers };
}

export type AuthService = ReturnType<typeof createAuthUseCases>;
