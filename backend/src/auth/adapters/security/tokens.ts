import { SignJWT, jwtVerify } from 'jose';
import { createHash } from 'node:crypto';
import type { Runtime } from '../../../shared/application/runtime';
import { unauthorized } from '../../../shared/domain/errors';
import type { TokenProvider } from '../../application/ports';

const issuer = 'inventory';

export function createJwtTokenProvider(
    secrets: { access: string; refresh: string },
    runtime: Runtime,
): TokenProvider {
    const keys = {
        access: new TextEncoder().encode(secrets.access),
        refresh: new TextEncoder().encode(secrets.refresh),
    };
    return {
        hash: (token) => createHash('sha256').update(token).digest('hex'),
        async sign(kind, userId, sessionId, expiresAt) {
            return new SignJWT({ sid: sessionId })
                .setProtectedHeader({ alg: 'HS256', typ: kind === 'access' ? 'at+jwt' : 'rt+jwt' })
                .setSubject(userId)
                .setIssuer(issuer)
                .setAudience(`inventory-${kind}`)
                .setJti(runtime.newId())
                .setIssuedAt(Math.floor(runtime.now().getTime() / 1000))
                .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
                .sign(keys[kind]);
        },
        async verify(kind, token) {
            try {
                const { payload } = await jwtVerify(token, keys[kind], {
                    algorithms: ['HS256'],
                    issuer,
                    audience: `inventory-${kind}`,
                    typ: kind === 'access' ? 'at+jwt' : 'rt+jwt',
                    currentDate: runtime.now(),
                    requiredClaims: ['exp', 'iat', 'sub', 'sid', 'jti'],
                });
                if (
                    typeof payload.sub !== 'string' ||
                    typeof payload.sid !== 'string' ||
                    typeof payload.exp !== 'number'
                ) {
                    throw unauthorized();
                }
                return {
                    userId: payload.sub,
                    sessionId: payload.sid,
                    expiresAt: new Date(payload.exp * 1000),
                };
            } catch {
                throw unauthorized();
            }
        },
    };
}
