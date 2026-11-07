import { randomUUID } from 'node:crypto';
import { HttpError, readJson, respond, type Context } from './http.ts';
import { requireUser } from './auth.ts';

const categories = ['engineering', 'design', 'product', 'science'];
export type StudioVideo = { id: string; title: string; description: string; category: string; status: string; createdAt: string; updatedAt: string; mediaPath: string | null };
export function ownedStudioVideo(ctx: Context, userId: string, id: string): StudioVideo {
  const row = ctx.db.prepare('SELECT id,title,description,category,status,created_at AS createdAt,updated_at AS updatedAt,media_path AS mediaPath FROM studio_videos WHERE id=? AND owner_id=?')
    .get(id, userId) as StudioVideo | undefined;
  if (!row) throw new HttpError(404, 'STUDIO_VIDEO_NOT_FOUND');
  return row;
}

export async function handleStudio(ctx: Context): Promise<boolean> {
  const path = ctx.url.pathname;
  if (!path.startsWith('/api/v1/studio/videos')) return false;
  const user = requireUser(ctx);
  if (path === '/api/v1/studio/videos') {
    if (ctx.request.method === 'GET') {
      const data = ctx.db.prepare('SELECT id,title,description,category,status,created_at AS createdAt,updated_at AS updatedAt,media_path AS mediaPath FROM studio_videos WHERE owner_id=? ORDER BY created_at DESC,id').all(user.id);
      respond(ctx.response, 200, { data }); return true;
    }
    if (ctx.request.method === 'POST') {
      const input = await readJson(ctx.request);
      if (typeof input.title !== 'string' || !input.title.trim() || input.title.trim().length > 120 ||
          typeof input.description !== 'string' || input.description.length > 3000 ||
          !categories.includes(String(input.category))) throw new HttpError(400, 'INVALID_STUDIO_VIDEO');
      const now = new Date().toISOString();
      const video = { id: `video-${randomUUID()}`, title: input.title.trim(), description: input.description.trim(), category: input.category as string, status: 'draft', createdAt: now, updatedAt: now, mediaPath: null };
      ctx.db.prepare('INSERT INTO studio_videos(id,owner_id,title,description,category,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)')
        .run(video.id, user.id, video.title, video.description, video.category, video.status, now, now);
      respond(ctx.response, 201, { video }); return true;
    }
    throw new HttpError(405, 'METHOD_NOT_ALLOWED');
  }
  const match = /^\/api\/v1\/studio\/videos\/(video-[0-9a-f-]{36})$/.exec(path);
  if (match) {
    const video = ownedStudioVideo(ctx, user.id, match[1]!);
    if (ctx.request.method === 'GET') { respond(ctx.response, 200, { video }); return true; }
    if (ctx.request.method === 'PATCH') {
      const input = await readJson(ctx.request);
      const title = input.title === undefined ? video.title : input.title;
      const description = input.description === undefined ? video.description : input.description;
      const category = input.category === undefined ? video.category : input.category;
      const status = input.status === undefined ? video.status : input.status;
      if (typeof title !== 'string' || !title.trim() || title.trim().length > 120 ||
          typeof description !== 'string' || description.length > 3000 ||
          !categories.includes(String(category)) || (status !== 'draft' && status !== 'published')) throw new HttpError(400, 'INVALID_STUDIO_VIDEO');
      const updatedAt = new Date().toISOString();
      ctx.db.prepare('UPDATE studio_videos SET title=?,description=?,category=?,status=?,updated_at=? WHERE id=? AND owner_id=?')
        .run(title.trim(), description.trim(), category, status, updatedAt, video.id, user.id);
      respond(ctx.response, 200, { video: { ...video, title: title.trim(), description: description.trim(), category, status, updatedAt } }); return true;
    }
    throw new HttpError(405, 'METHOD_NOT_ALLOWED');
  }
  throw new HttpError(404, 'STUDIO_VIDEO_NOT_FOUND');
}
