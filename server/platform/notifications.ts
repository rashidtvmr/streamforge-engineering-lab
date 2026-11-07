import { randomUUID } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import { HttpError, respond, type Context } from './http.ts';
import { requireUser } from './auth.ts';
export function notifyNewPublication(db: DatabaseSync, creatorId: string, videoId: string, title: string): void {
  const owner = db.prepare('SELECT display_name FROM accounts WHERE id=?').get(creatorId) as { display_name: string } | undefined;
  if (!owner) return;
  const followers = db.prepare('SELECT user_id FROM subscriptions WHERE creator=? AND user_id != ?').all(owner.display_name, creatorId);
  const insert = db.prepare('INSERT INTO notifications(id,user_id,kind,message,video_id,created_at) VALUES(?,?,?,?,?,?)');
  for (const row of followers) insert.run(randomUUID(), String(row.user_id), 'published', `${owner.display_name} published ${title}`, videoId, new Date().toISOString());
}
export function notifyReply(db: DatabaseSync, parentId: string, replierId: string, videoId: string): void {
  const parent = db.prepare('SELECT author_id FROM comments WHERE id=?').get(parentId) as { author_id: string } | undefined;
  if (!parent || parent.author_id === replierId) return;
  db.prepare('INSERT INTO notifications(id,user_id,kind,message,video_id,created_at) VALUES(?,?,?,?,?,?)')
    .run(randomUUID(), parent.author_id, 'reply', 'Someone replied to your comment', videoId, new Date().toISOString());
}
export async function handleNotifications(ctx: Context): Promise<boolean> {
  const path = ctx.url.pathname;
  if (!path.startsWith('/api/v1/notifications')) return false;
  const user = requireUser(ctx);
  if (path === '/api/v1/notifications') {
    if (ctx.request.method === 'GET') {
      const data = ctx.db.prepare('SELECT id,kind,message,video_id AS videoId,created_at AS createdAt,read_at AS readAt FROM notifications WHERE user_id=? ORDER BY created_at DESC,id DESC LIMIT 50').all(user.id);
      respond(ctx.response, 200, { data });
    } else if (ctx.request.method === 'DELETE') {
      ctx.db.prepare('DELETE FROM notifications WHERE user_id=?').run(user.id);
      respond(ctx.response, 200, { cleared: true });
    } else throw new HttpError(405, 'METHOD_NOT_ALLOWED');
    return true;
  }
  const match = /^\/api\/v1\/notifications\/([0-9a-f-]{36})$/.exec(path);
  if (!match) throw new HttpError(404, 'NOTIFICATION_NOT_FOUND');
  if (ctx.request.method !== 'PATCH') throw new HttpError(405, 'METHOD_NOT_ALLOWED');
  const result = ctx.db.prepare('UPDATE notifications SET read_at=? WHERE id=? AND user_id=?').run(new Date().toISOString(), match[1], user.id);
  if (result.changes === 0) throw new HttpError(404, 'NOTIFICATION_NOT_FOUND');
  respond(ctx.response, 200, { read: true }); return true;
}
