import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { openPlatformDatabase } from '../../server/platform/database.ts';
import { handlePlatformRequest } from '../../server/platform/router.ts';

export async function platformFixture() {
  const db = openPlatformDatabase();
  const server = createServer((req, res) => { void handlePlatformRequest(db, req, res, new URL(req.url ?? '/', 'http://localhost')); });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  let cookie = '';
  const request = (path: string, method = 'GET', body?: object, authenticate = true) => fetch(origin + path, {
    method,
    headers: { ...(body ? { 'content-type': 'application/json' } : {}), ...(authenticate && cookie ? { cookie } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const register = async (email = `student-${Math.random().toString(16).slice(2)}@example.test`) => {
    const response = await request('/api/v1/accounts', 'POST', { email, name: 'Student', password: 'a-long-test-password' }, false);
    if (response.status !== 201) throw new Error(`Registration failed: ${response.status}`);
    cookie = (response.headers.get('set-cookie') ?? '').split(';')[0] ?? '';
    const body = await response.json() as { user: { id: string } };
    return body.user;
  };
  const close = async () => {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    db.close();
  };
  return { db, origin, register, request, close, get cookie() { return cookie; } };
}
