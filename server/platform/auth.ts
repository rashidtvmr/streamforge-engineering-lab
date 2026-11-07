import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import { HttpError, parseCookies, readJson, respond, type Context } from './http.ts';

const SESSION_COOKIE = 'sf_session';
const SESSION_AGE_SECONDS = 60 * 60 * 24 * 7;
const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

type Account = { id: string; email: string; display_name: string; password_salt: string; password_hash: string };
export function getSessionUser(ctx: Context): { id: string; name: string; email: string } | null {
  const token = parseCookies(ctx.request).get(SESSION_COOKIE);
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  const row = ctx.db.prepare(`SELECT a.id, a.email, a.display_name FROM sessions s
    JOIN accounts a ON a.id=s.user_id WHERE s.token_hash=? AND s.expires_at > ?`)
    .get(hashToken(token), Date.now()) as { id: string; email: string; display_name: string } | undefined;
  return row ? { id: row.id, name: row.display_name, email: row.email } : null;
}

export function requireUser(ctx: Context): { id: string; name: string; email: string } {
  const user = getSessionUser(ctx);
  if (!user) throw new HttpError(401, 'SIGN_IN_REQUIRED');
  return user;
}

function setCookie(ctx: Context, token: string, maxAge = SESSION_AGE_SECONDS): void {
  const secure = process.env.COOKIE_SECURE === 'true' ? '; Secure' : '';
  ctx.response.setHeader('set-cookie', `${SESSION_COOKIE}=${token}; HttpOnly; SameSite=Lax; Path=/api/v1; Max-Age=${maxAge}${secure}`);
}
function startSession(ctx: Context, accountId: string): void {
  const token = randomBytes(32).toString('base64url');
  ctx.db.prepare('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES (?,?,?)')
    .run(hashToken(token), accountId, Date.now() + SESSION_AGE_SECONDS * 1000);
  setCookie(ctx, token);
}

export function registerAccount(db: DatabaseSync, email: string, name: string, password: string) {
  const normalized = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) || normalized.length > 180 ||
      name.trim().length < 1 || name.trim().length > 60 ||
      password.length < 10 || password.length > 128) throw new HttpError(400, 'INVALID_ACCOUNT');
  const existing = db.prepare('SELECT id FROM accounts WHERE email=?').get(normalized);
  if (existing) throw new HttpError(409, 'ACCOUNT_EXISTS');
  const salt = randomBytes(16).toString('hex');
  const secret = scryptSync(password, salt, 64).toString('hex');
  const id = randomUUID();
  db.prepare('INSERT INTO accounts VALUES(?,?,?,?,?,?)')
    .run(id, normalized, name.trim(), salt, secret, new Date().toISOString());
  return { id, email: normalized, name: name.trim() };
}

export async function handleAuth(ctx: Context): Promise<boolean> {
  const path = ctx.url.pathname;
  const method = ctx.request.method;
  if (path === '/api/v1/me') {
    if (method !== 'GET') throw new HttpError(405, 'METHOD_NOT_ALLOWED');
    respond(ctx.response, 200, { user: getSessionUser(ctx) });
    return true;
  }
  if (path === '/api/v1/accounts' && method === 'POST') {
    const input = await readJson(ctx.request);
    if (typeof input.email !== 'string' || typeof input.name !== 'string' || typeof input.password !== 'string') {
      throw new HttpError(400, 'INVALID_ACCOUNT');
    }
    const account = registerAccount(ctx.db, input.email, input.name, input.password);
    startSession(ctx, account.id);
    respond(ctx.response, 201, { user: account });
    return true;
  }
  if (path === '/api/v1/session' && method === 'POST') {
    const input = await readJson(ctx.request);
    if (typeof input.email !== 'string' || typeof input.password !== 'string') {
      throw new HttpError(401, 'INVALID_CREDENTIALS');
    }
    const account = ctx.db.prepare('SELECT * FROM accounts WHERE email=?')
      .get(input.email.trim().toLowerCase()) as Account | undefined;
    if (!account) throw new HttpError(401, 'INVALID_CREDENTIALS');
    const attempt = scryptSync(input.password, account.password_salt, 64);
    if (!timingSafeEqual(attempt, Buffer.from(account.password_hash, 'hex'))) {
      throw new HttpError(401, 'INVALID_CREDENTIALS');
    }
    startSession(ctx, account.id);
    respond(ctx.response, 200, { user: { id: account.id, email: account.email, name: account.display_name } });
    return true;
  }
  if (path === '/api/v1/session' && method === 'DELETE') {
    const token = parseCookies(ctx.request).get(SESSION_COOKIE);
    if (token) ctx.db.prepare('DELETE FROM sessions WHERE token_hash=?').run(hashToken(token));
    setCookie(ctx, '', 0);
    respond(ctx.response, 200, { signedOut: true });
    return true;
  }
  if (path === '/api/v1/accounts' || path === '/api/v1/session') {
    throw new HttpError(405, 'METHOD_NOT_ALLOWED');
  }
  return false;
}
