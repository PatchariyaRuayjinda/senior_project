import { randomUUID } from 'node:crypto';
import type { PasswordVerifier } from '../../application/ports';

export const hashPassword = (password: string) =>
    Bun.password.hash(password, {
        algorithm: 'argon2id',
        memoryCost: 19456,
        timeCost: 2,
    });

export async function createBunPasswordVerifier(): Promise<PasswordVerifier> {
    const dummyPasswordHash = await hashPassword(randomUUID());
    return {
        matches: (password, hash) => Bun.password.verify(password, hash ?? dummyPasswordHash),
    };
}
