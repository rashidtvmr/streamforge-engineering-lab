import { strict as assert } from 'node:assert';
import { after, before, describe, it } from 'node:test';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { openPlatformDatabase } from '../../server/platform/database.ts';
import { handlePlatformRequest } from '../../server/platform/router.ts';

const db = openPlatformDatabase();
const server = createServer((req, res) => { void handlePlatformRequest(db, req, res, new URL(req.url ?? '/', 'http://localhost')); });
let origin = '', cookie = '';
before(async () => {
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
after(async () => {
  await new Promise<void>((resolve, reject) => server.close((e) => e ? reject(e) : resolve()));
  db.close();
});
const req = (path: string, method = 'GET', body?: object, session?: string) => fetch(origin + path, {
  method, headers: { ...(body ? { 'content-type': 'application/json' } : {}), ...(session ? { cookie: session } : {}) },
  body: body ? JSON.stringify(body) : undefined,
});
describe('account and server-side session boundaries', () => {
  it('registers a real account and stores a salted secret, never plain password', async () => {
    const response = await req('/api/v1/accounts', 'POST', { email: 'ALICE@example.com', name: 'Alice', password: 'very-secure-demo-password' });
    assert.equal(response.status, 201);
    cookie = (response.headers.get('set-cookie') ?? '').split(';')[0] ?? '';
    assert.match(cookie, /^sf_session=[A-Za-z0-9_-]{43}$/);
    assert.match(response.headers.get('set-cookie') ?? '', /HttpOnly; SameSite=Lax/);
    const json = await response.json() as { user: { email: string } };
    assert.equal(json.user.email, 'alice@example.com');
    const dbAccount = db.prepare('SELECT password_hash FROM accounts WHERE email=?').get('alice@example.com') as { password_hash: string };
    assert.notEqual(dbAccount.password_hash, 'very-secure-demo-password');
  });
  it('rejects invalid login and duplicate account', async () => {
    assert.equal((await req('/api/v1/session', 'POST', { email: 'alice@example.com', password: 'wrong-password' })).status, 401);
    assert.equal((await req('/api/v1/accounts', 'POST', { email: 'alice@example.com', name: 'Alice', password: 'very-secure-demo-password' })).status, 409);
    assert.equal((await req('/api/v1/accounts', 'POST', { email: 'bad', name: 'Alice', password: 'tiny' })).status, 400);
  });
  it('authenticates through a HttpOnly session cookie', async () => {
    assert.equal((await (await req('/api/v1/me', 'GET', undefined, cookie)).json() as { user: { name: string } }).user.name, 'Alice');
    assert.deepEqual(await (await req('/api/v1/me')).json(), { user: null });
  });
  it('invalidates exactly the logged-out session', async () => {
    assert.equal((await req('/api/v1/session', 'DELETE', undefined, cookie)).status, 200);
    assert.deepEqual(await (await req('/api/v1/me', 'GET', undefined, cookie)).json(), { user: null });
  });
  it('enforces bounded JSON bodies and media types', async () => {
    const response = await fetch(origin + '/api/v1/accounts', { method: 'POST', body: '{}', headers: { 'content-type': 'text/plain' } });
    assert.equal(response.status, 415);
  });
});
