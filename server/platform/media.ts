import { HttpError, respond, type Context } from './http.ts';
import { requireUser } from './auth.ts';
import { ownedStudioVideo } from './studio.ts';

const maxBytes = 8 * 1024 * 1024;
async function readMedia(ctx: Context): Promise<Buffer> {
  if (ctx.request.headers['content-type'] !== 'video/mp4') throw new HttpError(415, 'MP4_REQUIRED');
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of ctx.request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > maxBytes) throw new HttpError(413, 'MEDIA_TOO_LARGE');
    chunks.push(buffer);
  }
  const data = Buffer.concat(chunks);
  if (data.length < 12 || data.toString('ascii', 4, 8) !== 'ftyp') throw new HttpError(415, 'INVALID_MP4');
  return data;
}

export async function handleMedia(ctx: Context): Promise<boolean> {
  const upload = /^\/api\/v1\/studio\/videos\/(video-[0-9a-f-]{36})\/media$/.exec(ctx.url.pathname);
  if (upload) {
    if (ctx.request.method !== 'PUT') throw new HttpError(405, 'METHOD_NOT_ALLOWED');
    const user = requireUser(ctx);
    const video = ownedStudioVideo(ctx, user.id, upload[1]!);
    const bytes = await readMedia(ctx);
    ctx.db.prepare('UPDATE studio_videos SET media_blob=?,media_mime=? WHERE id=? AND owner_id=?')
      .run(bytes, 'video/mp4', video.id, user.id);
    respond(ctx.response, 200, { uploaded: true, bytes: bytes.length }); return true;
  }
  const playback = /^\/api\/v1\/media\/(video-[0-9a-f-]{36})$/.exec(ctx.url.pathname);
  if (!playback) return false;
  if (ctx.request.method !== 'GET') throw new HttpError(405, 'METHOD_NOT_ALLOWED');
  const row = ctx.db.prepare("SELECT media_blob AS media FROM studio_videos WHERE id=? AND status='published' AND media_blob IS NOT NULL")
    .get(playback[1]) as { media: Uint8Array } | undefined;
  if (!row) throw new HttpError(404, 'MEDIA_NOT_FOUND');
  const bytes = Buffer.from(row.media);
  const range = ctx.request.headers.range;
  let start = 0, end = bytes.length - 1;
  if (range) {
    const match = /^bytes=(\d+)-(\d*)$/.exec(range);
    if (!match) throw new HttpError(416, 'INVALID_RANGE');
    start = Number(match[1]);
    end = match[2] ? Math.min(Number(match[2]), end) : end;
    if (!Number.isSafeInteger(start) || start >= bytes.length || start < 0 || end < start) throw new HttpError(416, 'INVALID_RANGE');
    ctx.response.statusCode = 206;
    ctx.response.setHeader('content-range', `bytes ${start}-${end}/${bytes.length}`);
  } else ctx.response.statusCode = 200;
  ctx.response.setHeader('content-type', 'video/mp4');
  ctx.response.setHeader('content-length', end - start + 1);
  ctx.response.setHeader('accept-ranges', 'bytes');
  ctx.response.setHeader('x-content-type-options', 'nosniff');
  ctx.response.setHeader('cache-control', 'private, max-age=60');
  ctx.response.end(bytes.subarray(start, end + 1));
  return true;
}
