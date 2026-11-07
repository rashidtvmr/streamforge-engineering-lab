import { isVideoId } from '../../src/domain/videoId.ts';
import { HttpError, readJson, respond, type Context } from './http.ts';
import { getSessionUser, requireUser } from './auth.ts';

export async function handleReactions(ctx: Context): Promise<boolean> {
  const match = /^\/api\/v1\/videos\/([^/]+)\/reactions$/.exec(ctx.url.pathname);
  if (!match) return false;
  const videoId = match[1]!;
  if (!isVideoId(videoId)) throw new HttpError(400, 'INVALID_VIDEO_ID');
  if (ctx.request.method === 'GET') {
    const rows = ctx.db.prepare('SELECT kind, COUNT(*) AS count FROM reactions WHERE video_id=? GROUP BY kind').all(videoId) as { kind: string; count: number }[];
    const user = getSessionUser(ctx);
    const reaction = user ? ctx.db.prepare('SELECT kind FROM reactions WHERE user_id=? AND video_id=?').get(user.id, videoId) as { kind: string } | undefined : undefined;
    respond(ctx.response, 200, { likes: rows.find((row) => row.kind === 'like')?.count ?? 0, dislikes: rows.find((row) => row.kind === 'dislike')?.count ?? 0, mine: reaction?.kind ?? null });
    return true;
  }
  const user = requireUser(ctx);
  if (ctx.request.method === 'PUT') {
    const body = await readJson(ctx.request);
    if (body.kind !== 'like' && body.kind !== 'dislike') throw new HttpError(400, 'INVALID_REACTION');
    ctx.db.prepare(`INSERT INTO reactions(user_id,video_id,kind) VALUES(?,?,?)
      ON CONFLICT(user_id,video_id) DO UPDATE SET kind=excluded.kind`).run(user.id, videoId, body.kind);
    respond(ctx.response, 200, { kind: body.kind });
  } else if (ctx.request.method === 'DELETE') {
    ctx.db.prepare('DELETE FROM reactions WHERE user_id=? AND video_id=?').run(user.id, videoId);
    respond(ctx.response, 200, { kind: null });
  } else throw new HttpError(405, 'METHOD_NOT_ALLOWED');
  return true;
}
