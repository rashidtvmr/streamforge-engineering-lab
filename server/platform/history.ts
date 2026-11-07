import { HttpError, readJson, respond, type Context } from './http.ts';
import { requireUser } from './auth.ts';

export async function handleHistory(ctx: Context): Promise<boolean> {
  if (ctx.url.pathname !== '/api/v1/history') return false;
  const user = requireUser(ctx);
  if (ctx.request.method === 'GET') {
    const data = ctx.db.prepare('SELECT video_id AS videoId, progress_seconds AS progressSeconds, updated_at AS updatedAt FROM history WHERE user_id=? ORDER BY updated_at DESC, video_id ASC LIMIT 100').all(user.id);
    respond(ctx.response, 200, { data });
  } else if (ctx.request.method === 'POST') {
    const body = await readJson(ctx.request);
    if (typeof body.videoId !== 'string' || !/^video-[0-9]{3}$/.test(body.videoId) ||
        typeof body.progressSeconds !== 'number' || !Number.isSafeInteger(body.progressSeconds) || body.progressSeconds < 0 || body.progressSeconds > 36000) {
      throw new HttpError(400, 'INVALID_HISTORY');
    }
    ctx.db.prepare(`INSERT INTO history(user_id, video_id, progress_seconds, updated_at)
      VALUES(?,?,?,?) ON CONFLICT(user_id,video_id) DO UPDATE SET progress_seconds=excluded.progress_seconds,updated_at=excluded.updated_at`)
      .run(user.id, body.videoId, body.progressSeconds, new Date().toISOString());
    respond(ctx.response, 200, { saved: true });
  } else if (ctx.request.method === 'DELETE') {
    ctx.db.prepare('DELETE FROM history WHERE user_id=?').run(user.id);
    respond(ctx.response, 200, { cleared: true });
  } else throw new HttpError(405, 'METHOD_NOT_ALLOWED');
  return true;
}
