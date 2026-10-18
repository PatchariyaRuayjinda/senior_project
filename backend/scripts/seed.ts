import { randomUUID } from 'node:crypto';
import { collections } from '../src/auth/adapters/mongodb/collections';
import { hashPassword } from '../src/auth/adapters/security/passwords';
import { loadConfig } from '../src/config';
import { connectDatabase } from '../src/database';
import type { Role } from '../src/shared/domain/actor';

const accounts: { username: string; password: string; role: Role }[] = [
    { username: process.env.ADMIN_USERNAME ?? 'admin', password: process.env.ADMIN_PASSWORD ?? '', role: 'admin' },
    { username: process.env.STAFF_USERNAME ?? 'staff', password: process.env.STAFF_PASSWORD ?? '', role: 'staff' },
];
for (const account of accounts) {
    account.username = account.username.trim().toLowerCase();
    if (!/^[a-z0-9._-]{3,64}$/.test(account.username) || account.password.length < 12 || account.password.length > 128) {
        throw new Error('Set valid ADMIN/STAFF usernames and passwords of 12-128 characters in .env before seeding.');
    }
}
if (accounts[0]?.username === accounts[1]?.username) throw new Error('Admin and staff usernames must be different.');
const { client, db } = await connectDatabase(loadConfig());
try {
    const { users } = collections(db);
    for (const account of accounts) {
        const passwordHash = await hashPassword(account.password);
        await users.updateOne({ username: account.username }, { $setOnInsert: {
            _id: randomUUID(), username: account.username, passwordHash,
            role: account.role, enabled: true, createdAt: new Date(),
        } }, { upsert: true });
        console.log(`Account ready: ${account.username} (${account.role}). Existing accounts are unchanged.`);
    }
} finally {
    await client.close();
}
