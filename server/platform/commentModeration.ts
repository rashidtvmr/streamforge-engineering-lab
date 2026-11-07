import { randomUUID } from 'node:crypto';
import { HttpError, readJson, respond, type Context } from './http.ts';
import { requireUser } from './auth.ts';

type Existing = { id: string; author_id: string; deleted_at: string | null };
export async function handleCommentModeration(ctx: Context): Promise<boolean> {
  const match = /^\/api\/v1\/comments\/([0-9a-f-]{36})(?:\/reports)?$/.exec(ctx.url.pathname);
  if (!match) return false;
  const user = requireUser(ctx);
  const id = match[1]!;
  const existing = ctx.db.prepare('SELECT id,author_id,deleted_at FROM comments WHERE id=?').get(id) as Existing | undefined;
  if (!existing || existing.deleted_at) throw new HttpError(404, 'COMMENT_NOT_FOUND');
  const isReport = ctx.url.pathname.endsWith('/reports');
  if (isReport && ctx.request.method === 'POST') {
    if (existing.author_id === user.id) throw new HttpError(400, 'CANNOT_REPORT_SELF');
    const input = await readJson(ctx.request);
    if (!['spam', 'harassment', 'other'].includes(String(input.reason))) throw new HttpError(400, 'INVALID_REPORT');
    ctx.db.prepare('INSERT OR IGNORE INTO comment_reports(id,comment_id,reporter_id,reason,created_at) VALUES(?,?,?,?,?)')
      .run(randomUUID(), id, user.id, input.reason, new Date().toISOString());
    respond(ctx.response, 201, { reported: true }); return true;
  }
  if (isReport) throw new HttpError(405, 'METHOD_NOT_ALLOWED');
  if (existing.author_id !== user.id) throw new HttpError(403, 'FORBIDDEN');
  if (ctx.request.method === 'PATCH') {
    const input = await readJson(ctx.request);
    if (typeof input.body !== 'string' || !input.body.trim() || input.body.trim().length > 1000) throw new HttpError(400, 'INVALID_COMMENT');
    ctx.db.prepare('UPDATE comments SET body=?,edited_at=? WHERE id=?').run(input.body.trim(), new Date().toISOString(), id);
    respond(ctx.response, 200, { updated: true }); return true;
  }
  if (ctx.request.method === 'DELETE') {
    ctx.db.prepare('UPDATE comments SET deleted_at=? WHERE id=?').run(new Date().toISOString(), id);
    respond(ctx.response, 200, { deleted: true }); return true;
  }
  throw new HttpError(405, 'METHOD_NOT_ALLOWED');
}
