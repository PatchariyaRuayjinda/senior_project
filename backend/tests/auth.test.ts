import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'bun:test';
import { createHash, randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { MongoClient, type Db } from 'mongodb';
import { SignJWT } from 'jose';
import { createApp } from '../src/app';
import { createAuthService, hashPassword } from '../src/auth/service';
import { loadConfig } from '../src/config';
import { collections } from '../src/database';
import { migrateTestDatabase } from './helpers/migrations';

// A real, isolated mongod exercises atomic rotation and TTL queries without touching user data.
process.env.MONGOMS_DOWNLOAD_DIR = resolve(import.meta.dir, '../../.cache/mongodb');
const config = loadConfig({ JWT_ACCESS_SECRET: 'test-access-secret-with-at-least-32-bytes', JWT_REFRESH_SECRET: 'test-refresh-secret-with-at-least-32-bytes' });
let mongo: MongoMemoryReplSet;
let client: MongoClient;
let db: Db;
let app: ReturnType<typeof createApp>;
let time: number;
let passwordHash: string;
const password = 'a-test-password-12345';
const cookieName = 'inventory_refresh';
const hash = (value: string) => createHash('sha256').update(value).digest('hex');

beforeAll(async () => {
    mongo = await MongoMemoryReplSet.create({ binary: { version: '7.0.24' }, replSet: { count: 1 } });
    client = await new MongoClient(mongo.getUri()).connect();
    db = client.db('auth_tests');
    await migrateTestDatabase(mongo.getUri(), 'auth_tests');
    passwordHash = await hashPassword(password);
}, 60000);

afterAll(async () => { await client?.close(); await mongo?.stop(); });
beforeEach(async () => {
    time = Date.now();
    const { users, sessions } = collections(db);
    await Promise.all([users.deleteMany({}), sessions.deleteMany({})]);
    await users.insertMany([
        { _id: 'admin-id', username: 'admin', passwordHash, role: 'admin', enabled: true, createdAt: new Date(time) },
        { _id: 'staff-id', username: 'staff', passwordHash, role: 'staff', enabled: true, createdAt: new Date(time) },
    ]);
    app = createApp(await createAuthService(db, config, () => new Date(time)), config, () => time);
});

function request(path: string, options: { method?: string; token?: string; cookie?: string; body?: unknown; origin?: string | null } = {}) {
    const headers = new Headers();
    if (options.origin !== null) headers.set('origin', options.origin ?? config.appOrigin);
    if (options.token) headers.set('authorization', `Bearer ${options.token}`);
    if (options.cookie) headers.set('cookie', options.cookie);
    if (options.body !== undefined) headers.set('content-type', 'application/json');
    return app.handle(new Request(`http://localhost${path}`, {
        method: options.method ?? 'GET', headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
    }));
}
function cookie(response: Response) { return response.headers.get('set-cookie')!.split(';')[0]!; }
function refreshValue(value: string) { return value.slice(value.indexOf('=') + 1); }
async function login(username = 'admin') {
    const response = await request('/api/auth/login', { method: 'POST', body: { username, password } });
    expect(response.status).toBe(200);
    const body = await response.json();
    return { response, body, cookie: cookie(response) };
}
const refresh = (value: string) => request('/api/auth/refresh', { method: 'POST', cookie: value });

describe('authentication HTTP flow', () => {
    test('login sets an HttpOnly cookie and keeps refresh tokens and hashes out of JSON', async () => {
        const result = await login();
        expect(result.body.user).toEqual({ id: 'admin-id', username: 'admin', role: 'admin' });
        expect(Object.keys(result.body).sort()).toEqual(['accessToken', 'expiresIn', 'user']);
        expect(result.body.expiresIn).toBe(900);
        expect(result.response.headers.get('set-cookie')).toContain('HttpOnly');
        expect(result.response.headers.get('set-cookie')).toContain('SameSite=Strict');
        expect(result.response.headers.get('cache-control')).toBe('no-store');
        const session = await collections(db).sessions.findOne({ userId: 'admin-id' });
        expect(session?.refreshHash).toBe(hash(refreshValue(result.cookie)));
        expect(JSON.stringify(session)).not.toContain(refreshValue(result.cookie));
        expect((await request('/api/auth/me', { token: result.body.accessToken })).status).toBe(200);
    });

    test('unknown users and incorrect passwords return the same generic response', async () => {
        const wrongPassword = await request('/api/auth/login', { method: 'POST', body: { username: 'admin', password: 'wrong' } });
        const unknownUser = await request('/api/auth/login', { method: 'POST', body: { username: 'unknown', password } });
        expect(wrongPassword.status).toBe(401);
        expect(unknownUser.status).toBe(401);
        expect(await wrongPassword.json()).toEqual(await unknownUser.json());
        expect(await collections(db).sessions.countDocuments()).toBe(0);
    });

    test('rotation replaces the stored hash, and reuse revokes the entire session', async () => {
        const first = await login();
        const rotated = await refresh(first.cookie);
        expect(rotated.status).toBe(200);
        const secondCookie = cookie(rotated);
        expect(secondCookie).not.toBe(first.cookie);
        const second = await rotated.json();
        expect((await collections(db).sessions.findOne({ userId: 'admin-id' }))?.refreshHash).toBe(hash(refreshValue(secondCookie)));
        expect((await refresh(first.cookie)).status).toBe(401);
        expect((await refresh(secondCookie)).status).toBe(401);
        expect((await request('/api/auth/me', { token: second.accessToken })).status).toBe(401);
    });

    test('concurrent refreshes consume a token only once and revoke on replay', async () => {
        const first = await login();
        const responses = await Promise.all([refresh(first.cookie), refresh(first.cookie)]);
        expect(responses.map((response) => response.status).sort()).toEqual([200, 401]);
        expect((await collections(db).sessions.findOne({ userId: 'admin-id' }))?.revokedAt).toBeInstanceOf(Date);
    });

    test('expired access can be renewed, but the absolute session lifetime cannot be extended', async () => {
        const first = await login();
        time += 901000;
        expect((await request('/api/auth/me', { token: first.body.accessToken })).status).toBe(401);
        const rotated = await refresh(first.cookie);
        expect(rotated.status).toBe(200);
        const rotatedBody = await rotated.json();
        expect((await request('/api/auth/me', { token: rotatedBody.accessToken })).status).toBe(200);
        time += config.refreshTtlSeconds * 1000;
        expect((await refresh(cookie(rotated))).status).toBe(401);
    });

    test('logout revokes both kinds of token immediately and is idempotent', async () => {
        const first = await login();
        const result = await request('/api/auth/logout', { method: 'POST', cookie: first.cookie });
        expect(result.status).toBe(204);
        expect(result.headers.get('set-cookie')).toContain('Max-Age=0');
        expect((await request('/api/auth/me', { token: first.body.accessToken })).status).toBe(401);
        expect((await refresh(first.cookie)).status).toBe(401);
        expect((await request('/api/auth/logout', { method: 'POST' })).status).toBe(204);
    });

    test('signing in again replaces the browser session without affecting other devices', async () => {
        const first = await login();
        const otherDevice = await login();
        const replacement = await request('/api/auth/login', { method: 'POST', cookie: first.cookie, body: { username: 'admin', password } });
        expect(replacement.status).toBe(200);
        expect((await request('/api/auth/me', { token: first.body.accessToken })).status).toBe(401);
        expect((await request('/api/auth/me', { token: otherDevice.body.accessToken })).status).toBe(200);
    });

    test('server authorization rejects staff and follows role changes immediately', async () => {
        const staff = await login('staff');
        expect((await request('/api/admin/users', { token: staff.body.accessToken })).status).toBe(403);
        const admin = await login();
        const response = await request('/api/admin/users', { token: admin.body.accessToken });
        expect(response.status).toBe(200);
        expect(JSON.stringify(await response.json())).not.toContain('passwordHash');
        await collections(db).users.updateOne({ _id: 'admin-id' }, { $set: { role: 'staff' } });
        expect((await request('/api/admin/users', { token: admin.body.accessToken })).status).toBe(403);
    });

    test('disabled users lose access and cannot refresh or log in', async () => {
        const first = await login();
        await collections(db).users.updateOne({ _id: 'admin-id' }, { $set: { enabled: false } });
        expect((await request('/api/auth/me', { token: first.body.accessToken })).status).toBe(401);
        expect((await refresh(first.cookie)).status).toBe(401);
        expect((await request('/api/auth/login', { method: 'POST', body: { username: 'admin', password } })).status).toBe(401);
    });

    test('missing and forged tokens fail; a refresh token cannot be used as an access token', async () => {
        const first = await login();
        expect((await request('/api/auth/me')).status).toBe(401);
        expect((await request('/api/auth/me', { token: 'forged.token.value' })).status).toBe(401);
        expect((await request('/api/auth/me', { token: refreshValue(first.cookie) })).status).toBe(401);
        const forgedRefresh = await new SignJWT({ sid: (await collections(db).sessions.findOne({ userId: 'admin-id' }))!._id })
            .setProtectedHeader({ alg: 'HS256', typ: 'rt+jwt' }).setSubject('admin-id').setJti(randomUUID())
            .setIssuer('inventory').setAudience('inventory-refresh').setIssuedAt().setExpirationTime('1h')
            .sign(new TextEncoder().encode('a-completely-different-secret-key-value'));
        expect((await refresh(`${cookieName}=${forgedRefresh}`)).status).toBe(401);
        expect((await request('/api/auth/me', { token: first.body.accessToken })).status).toBe(200);
    });

    test('state-changing auth endpoints require the exact trusted origin', async () => {
        for (const path of ['login', 'refresh', 'logout', 'logout/']) {
            for (const origin of [null, 'https://attacker.example']) {
                const response = await request(`/api/auth/${path}`, { method: 'POST', origin, body: path === 'login' ? { username: 'admin', password } : undefined });
                expect(response.status).toBe(403);
            }
        }
        expect(await collections(db).sessions.countDocuments()).toBe(0);
    });

    test('there is no public registration or legacy API; supplied roles cannot grant privileges', async () => {
        expect((await request('/api/register', { method: 'POST', body: { username: 'attacker', password, position: 'Admin' } })).status).toBe(404);
        expect((await request('/api/deleteUser/admin-id', { method: 'DELETE' })).status).toBe(404);
        expect((await request('/api/findAllProduct')).status).toBe(404);
        const injected = await request('/api/auth/login', { method: 'POST', body: { username: 'staff', password, role: 'admin' } });
        // Elysia may reject or strip unknown properties. Neither can change the database role.
        expect([200, 400]).toContain(injected.status);
        if (injected.status === 200) expect((await injected.json()).user.role).toBe('staff');
        expect((await collections(db).users.findOne({ username: 'staff' }))?.role).toBe('staff');
    });

    test('login attempts are rate limited and recover after the window', async () => {
        for (let index = 0; index < 10; index++) {
            expect((await request('/api/auth/login', { method: 'POST', body: { username: 'admin', password: 'wrong' } })).status).toBe(401);
        }
        const limited = await request('/api/auth/login', { method: 'POST', body: { username: 'admin', password } });
        expect(limited.status).toBe(429);
        expect(limited.headers.get('retry-after')).toBe('60');
        time += 60001;
        expect((await request('/api/auth/login', { method: 'POST', body: { username: 'admin', password } })).status).toBe(200);
    });

    test('production refresh cookies are Secure and host-only', async () => {
        const secureConfig = { ...config, secureCookies: true, appOrigin: 'https://inventory.example' };
        app = createApp(await createAuthService(db, secureConfig), secureConfig);
        const result = await request('/api/auth/login', { method: 'POST', origin: secureConfig.appOrigin, body: { username: 'admin', password } });
        expect(result.status).toBe(200);
        const header = result.headers.get('set-cookie');
        expect(header).toStartWith('__Host-inventory_refresh=');
        expect(header).toContain('Secure');
        expect(header).toContain('Path=/');
        expect(header).not.toContain('Domain=');
    });
});
