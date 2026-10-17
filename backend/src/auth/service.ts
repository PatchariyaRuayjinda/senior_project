import { createHash, randomUUID } from 'node:crypto';
import { SignJWT, jwtVerify } from 'jose';
import type { Db } from 'mongodb';
import type { Config } from '../config';
import { collections, type UserRecord } from '../database';
import { HttpError, unauthorized } from '../errors';

const issuer = 'inventory';
const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex');
export const publicUser = (user: UserRecord) => ({ id: user._id, username: user.username, role: user.role });
export type PublicUser = ReturnType<typeof publicUser>;
export const hashPassword = (password: string) => Bun.password.hash(password, {
    algorithm: 'argon2id', memoryCost: 19456, timeCost: 2,
});

export async function createAuthService(db: Db, config: Config, now = () => new Date()) {
    const { users, sessions } = collections(db);
    const dummyPasswordHash = await hashPassword(randomUUID());
    const keys = {
        access: new TextEncoder().encode(config.accessSecret),
        refresh: new TextEncoder().encode(config.refreshSecret),
    };

    async function sign(kind: 'access' | 'refresh', userId: string, sessionId: string, expiresAt: Date) {
        return new SignJWT({ sid: sessionId })
            .setProtectedHeader({ alg: 'HS256', typ: kind === 'access' ? 'at+jwt' : 'rt+jwt' })
            .setSubject(userId).setIssuer(issuer).setAudience(`inventory-${kind}`)
            .setJti(randomUUID()).setIssuedAt(Math.floor(now().getTime() / 1000))
            .setExpirationTime(Math.floor(expiresAt.getTime() / 1000)).sign(keys[kind]);
    }

    async function verify(kind: 'access' | 'refresh', token: string) {
        try {
            const { payload } = await jwtVerify(token, keys[kind], {
                algorithms: ['HS256'], issuer, audience: `inventory-${kind}`,
                typ: kind === 'access' ? 'at+jwt' : 'rt+jwt', currentDate: now(),
                requiredClaims: ['exp', 'iat', 'sub', 'sid', 'jti'],
            });
            if (typeof payload.sub !== 'string' || typeof payload.sid !== 'string' || typeof payload.exp !== 'number') {
                throw unauthorized();
            }
            return { userId: payload.sub, sessionId: payload.sid, expiresAt: new Date(payload.exp * 1000) };
        } catch {
            throw unauthorized();
        }
    }

    async function bundle(user: UserRecord, sessionId: string, refreshToken: string, refreshExpiresAt: Date) {
        const accessExpiresAt = new Date(Math.min(
            now().getTime() + config.accessTtlSeconds * 1000, refreshExpiresAt.getTime(),
        ));
        return {
            accessToken: await sign('access', user._id, sessionId, accessExpiresAt),
            expiresIn: Math.max(0, Math.floor((accessExpiresAt.getTime() - now().getTime()) / 1000)),
            user: publicUser(user), refreshToken, refreshExpiresAt,
        };
    }

    async function logout(refreshToken: string | undefined) {
        if (!refreshToken) return;
        let claims;
        try { claims = await verify('refresh', refreshToken); } catch { return; }
        await sessions.updateOne(
            { _id: claims.sessionId, userId: claims.userId, revokedAt: null },
            { $set: { revokedAt: now() } },
        );
    }

    async function login(username: string, password: string, previousRefreshToken?: string) {
        const user = await users.findOne({ username: username.trim().toLowerCase() });
        // Unknown users still pay the password-verification cost; the response is identical.
        const matches = await Bun.password.verify(password, user?.passwordHash ?? dummyPasswordHash);
        if (!user || !matches || !user.enabled) {
            throw new HttpError(401, 'INVALID_CREDENTIALS', 'Username or password is incorrect.');
        }
        await logout(previousRefreshToken);
        const sessionId = randomUUID();
        const expiresAt = new Date(Math.floor(now().getTime() / 1000) * 1000 + config.refreshTtlSeconds * 1000);
        const refreshToken = await sign('refresh', user._id, sessionId, expiresAt);
        await sessions.insertOne({
            _id: sessionId, userId: user._id, refreshHash: tokenHash(refreshToken),
            createdAt: now(), expiresAt, revokedAt: null,
        });
        return bundle(user, sessionId, refreshToken, expiresAt);
    }

    async function refresh(refreshToken: string | undefined) {
        if (!refreshToken) throw unauthorized();
        const claims = await verify('refresh', refreshToken);
        const nextToken = await sign('refresh', claims.userId, claims.sessionId, claims.expiresAt);
        const session = await sessions.findOneAndUpdate(
            {
                _id: claims.sessionId, userId: claims.userId, revokedAt: null,
                expiresAt: { $gt: now() }, refreshHash: tokenHash(refreshToken),
            },
            { $set: { refreshHash: tokenHash(nextToken) } },
            { returnDocument: 'after' },
        );
        if (!session) {
            // A correctly signed, previously consumed token means replay. Revoke the family.
            // A forged token fails verification above and cannot revoke somebody's session.
            await sessions.updateOne(
                { _id: claims.sessionId, userId: claims.userId, revokedAt: null, expiresAt: { $gt: now() } },
                { $set: { revokedAt: now() } },
            );
            throw unauthorized();
        }
        const user = await users.findOne({ _id: session.userId, enabled: true });
        if (!user) {
            await sessions.updateOne({ _id: session._id }, { $set: { revokedAt: now() } });
            throw unauthorized();
        }
        return bundle(user, session._id, nextToken, session.expiresAt);
    }

    async function authenticate(authorization: string | null) {
        const token = authorization?.match(/^Bearer (\S+)$/)?.[1];
        if (!token) throw unauthorized();
        const claims = await verify('access', token);
        const session = await sessions.findOne({
            _id: claims.sessionId, userId: claims.userId, revokedAt: null, expiresAt: { $gt: now() },
        });
        if (!session) throw unauthorized();
        const user = await users.findOne({ _id: claims.userId, enabled: true });
        if (!user) throw unauthorized();
        // Authorization uses the current database role, never a role sent by the browser.
        return publicUser(user);
    }

    async function listUsers(authorization: string | null) {
        const user = await authenticate(authorization);
        if (user.role !== 'admin') throw new HttpError(403, 'FORBIDDEN', 'Administrator access required.');
        return users.find({}, { projection: { passwordHash: 0 } }).sort({ username: 1 }).map(publicUser).toArray();
    }

    return { login, refresh, logout, authenticate, listUsers };
}

export type AuthService = Awaited<ReturnType<typeof createAuthService>>;
