import { HttpError, respond, type Context } from './http.ts';
import { getSessionUser, requireUser } from './auth.ts';

export async function handleSubscriptions(ctx: Context): Promise<boolean> {
  const path = ctx.url.pathname;
  if (path === '/api/v1/subscriptions') {
    const user = requireUser(ctx);
    if (ctx.request.method !== 'GET') throw new HttpError(405, 'METHOD_NOT_ALLOWED');
    const data = ctx.db.prepare('SELECT creator FROM subscriptions WHERE user_id=? ORDER BY creator COLLATE NOCASE').all(user.id);
    respond(ctx.response, 200, { data }); return true;
  }
  const match = /^\/api\/v1\/creators\/([^/]+)\/subscription$/.exec(path);
  if (!match) return false;
  const creator = decodeURIComponent(match[1]!);
  if (!/^[\p{L}\p{N} ._-]{1,80}$/u.test(creator)) throw new HttpError(400, 'INVALID_CREATOR');
  if (ctx.request.method === 'GET') {
    const user = getSessionUser(ctx);
    const found = user ? ctx.db.prepare('SELECT 1 FROM subscriptions WHERE user_id=? AND creator=?').get(user.id, creator) : null;
    respond(ctx.response, 200, { subscribed: Boolean(found) }); return true;
  }
  const user = requireUser(ctx);
  if (ctx.request.method === 'PUT') {
    ctx.db.prepare('INSERT OR IGNORE INTO subscriptions(user_id, creator) VALUES (?, ?)').run(user.id, creator);
    respond(ctx.response, 200, { subscribed: true });
  } else if (ctx.request.method === 'DELETE') {
    ctx.db.prepare('DELETE FROM subscriptions WHERE user_id=? AND creator=?').run(user.id, creator);
    respond(ctx.response, 200, { subscribed: false });
  } else throw new HttpError(405, 'METHOD_NOT_ALLOWED');
  return true;
}
