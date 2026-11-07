import { randomUUID } from 'node:crypto';
import { HttpError, readJson, respond, type Context } from './http.ts';
import { requireUser } from './auth.ts';

export async function handleComments(ctx: Context): Promise<boolean> {
  const match = /^\/api\/v1\/videos\/(video-[0-9]{3})\/comments$/.exec(ctx.url.pathname);
  if (!match) return false;
  const videoId = match[1]!;
  if (ctx.request.method === 'GET') {
    const data = ctx.db.prepare(`SELECT c.id,c.video_id AS videoId,c.parent_id AS parentId,
      c.body,c.created_at AS createdAt,c.edited_at AS editedAt,a.display_name AS author,
      c.author_id AS authorId FROM comments c JOIN accounts a ON a.id=c.author_id
      WHERE c.video_id=? AND c.deleted_at IS NULL ORDER BY c.created_at ASC,c.id ASC LIMIT 200`)
      .all(videoId);
    respond(ctx.response, 200, { data }); return true;
  }
  if (ctx.request.method !== 'POST') throw new HttpError(405, 'METHOD_NOT_ALLOWED');
  const user = requireUser(ctx);
  const input = await readJson(ctx.request);
  if (typeof input.body !== 'string' || !input.body.trim() || input.body.trim().length > 1000 ||
      (input.parentId !== undefined && typeof input.parentId !== 'string')) throw new HttpError(400, 'INVALID_COMMENT');
  const parentId = input.parentId ?? null;
  if (parentId) {
    const parent = ctx.db.prepare('SELECT id FROM comments WHERE id=? AND video_id=? AND deleted_at IS NULL').get(parentId, videoId);
    if (!parent) throw new HttpError(400, 'INVALID_PARENT');
  }
  const comment = { id: randomUUID(), videoId, parentId, body: input.body.trim(), author: user.name, authorId: user.id, createdAt: new Date().toISOString(), editedAt: null };
  ctx.db.prepare('INSERT INTO comments(id,video_id,author_id,parent_id,body,created_at) VALUES(?,?,?,?,?,?)')
    .run(comment.id, videoId, user.id, parentId, comment.body, comment.createdAt);
  respond(ctx.response, 201, { comment }); return true;
}
