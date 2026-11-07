import { isVideoId } from '../../src/domain/videoId.ts';
import { randomUUID } from 'node:crypto';
import { HttpError, readJson, respond, type Context } from './http.ts';
import { requireUser } from './auth.ts';

type Playlist = { id: string; name: string; visibility: string; createdAt: string };
function ownedPlaylist(ctx: Context, userId: string, id: string): Playlist {
  const row = ctx.db.prepare('SELECT id,name,visibility,created_at AS createdAt FROM playlists WHERE id=? AND owner_id=?')
    .get(id, userId) as Playlist | undefined;
  if (!row) throw new HttpError(404, 'PLAYLIST_NOT_FOUND');
  return row;
}

export async function handlePlaylists(ctx: Context): Promise<boolean> {
  const path = ctx.url.pathname;
  if (!path.startsWith('/api/v1/playlists') && !path.startsWith('/api/v1/shared-playlists')) return false;
  const method = ctx.request.method;
  const shared = /^\/api\/v1\/shared-playlists\/([0-9a-f-]{36})$/.exec(path);
  if (shared && method === 'GET') {
    const playlist = ctx.db.prepare("SELECT id,name,visibility,created_at AS createdAt FROM playlists WHERE id=? AND visibility='unlisted'")
      .get(shared[1]) as Playlist | undefined;
    if (!playlist) throw new HttpError(404, 'PLAYLIST_NOT_FOUND');
    const data = ctx.db.prepare('SELECT video_id AS videoId,position FROM playlist_items WHERE playlist_id=? ORDER BY position,video_id').all(playlist.id);
    respond(ctx.response, 200, { playlist, data }); return true;
  }
  const user = requireUser(ctx);
  if (path === '/api/v1/playlists') {
    if (method === 'GET') {
      const data = ctx.db.prepare('SELECT id,name,visibility,created_at AS createdAt FROM playlists WHERE owner_id=? ORDER BY created_at DESC,id ASC').all(user.id);
      respond(ctx.response, 200, { data });
    } else if (method === 'POST') {
      const input = await readJson(ctx.request);
      if (typeof input.name !== 'string' || !input.name.trim() || input.name.trim().length > 80) throw new HttpError(400, 'INVALID_PLAYLIST');
      const playlist = { id: randomUUID(), name: input.name.trim(), visibility: 'private', createdAt: new Date().toISOString() };
      ctx.db.prepare('INSERT INTO playlists(id,owner_id,name,visibility,created_at) VALUES(?,?,?,?,?)')
        .run(playlist.id, user.id, playlist.name, playlist.visibility, playlist.createdAt);
      respond(ctx.response, 201, { playlist });
    } else throw new HttpError(405, 'METHOD_NOT_ALLOWED');
    return true;
  }
  const orderMatch = /^\/api\/v1\/playlists\/([0-9a-f-]{36})\/order$/.exec(path);
  if (orderMatch) {
    const playlist = ownedPlaylist(ctx, user.id, orderMatch[1]!);
    if (method !== 'PUT') throw new HttpError(405, 'METHOD_NOT_ALLOWED');
    const input = await readJson(ctx.request);
    if (!Array.isArray(input.ids) || input.ids.length > 100 || input.ids.some((id) => typeof id !== 'string')) throw new HttpError(400, 'INVALID_ORDER');
    const ids = input.ids as string[];
    const existing = ctx.db.prepare('SELECT video_id FROM playlist_items WHERE playlist_id=?').all(playlist.id).map((item) => item.video_id);
    if (new Set(ids).size !== ids.length || ids.length !== existing.length || ids.some((id) => !existing.includes(id))) throw new HttpError(400, 'INVALID_ORDER');
    ctx.db.exec('BEGIN IMMEDIATE');
    try {
      const update = ctx.db.prepare('UPDATE playlist_items SET position=? WHERE playlist_id=? AND video_id=?');
      ids.forEach((id, index) => update.run(index, playlist.id, id));
      ctx.db.exec('COMMIT');
    } catch (error) { ctx.db.exec('ROLLBACK'); throw error; }
    respond(ctx.response, 200, { reordered: true }); return true;
  }
  const match = /^\/api\/v1\/playlists\/([0-9a-f-]{36})(?:\/items(?:\/([^/]+))?)?$/.exec(path);
  if (!match) throw new HttpError(404, 'PLAYLIST_NOT_FOUND');
  const playlist = ownedPlaylist(ctx, user.id, match[1]!);
  const isItems = path.includes('/items');
  if (!isItems && method === 'PATCH') {
    const input = await readJson(ctx.request);
    const name = input.name === undefined ? playlist.name : input.name;
    const visibility = input.visibility === undefined ? playlist.visibility : input.visibility;
    if (typeof name !== 'string' || !name.trim() || name.trim().length > 80 || (visibility !== 'private' && visibility !== 'unlisted')) throw new HttpError(400, 'INVALID_PLAYLIST');
    ctx.db.prepare('UPDATE playlists SET name=?,visibility=? WHERE id=? AND owner_id=?').run(name.trim(), visibility, playlist.id, user.id);
    respond(ctx.response, 200, { playlist: { ...playlist, name: name.trim(), visibility } });
  } else if (!isItems && method === 'GET') {
    const data = ctx.db.prepare('SELECT video_id AS videoId,position FROM playlist_items WHERE playlist_id=? ORDER BY position,video_id').all(playlist.id);
    respond(ctx.response, 200, { playlist, data });
  } else if (!isItems && method === 'DELETE') {
    ctx.db.prepare('DELETE FROM playlists WHERE id=? AND owner_id=?').run(playlist.id, user.id);
    respond(ctx.response, 200, { deleted: true });
  } else if (isItems && method === 'POST' && !match[2]) {
    const input = await readJson(ctx.request);
    if (!isVideoId(input.videoId)) throw new HttpError(400, 'INVALID_VIDEO_ID');
    ctx.db.prepare(`INSERT OR IGNORE INTO playlist_items(playlist_id,video_id,position) VALUES(?,?,COALESCE((SELECT MAX(position)+1 FROM playlist_items WHERE playlist_id=?),0))`)
      .run(playlist.id, input.videoId, playlist.id);
    respond(ctx.response, 200, { added: true });
  } else if (isItems && method === 'DELETE' && match[2]) {
    if (!isVideoId(match[2])) throw new HttpError(400, 'INVALID_VIDEO_ID');
    ctx.db.prepare('DELETE FROM playlist_items WHERE playlist_id=? AND video_id=?').run(playlist.id, match[2]);
    respond(ctx.response, 200, { removed: true });
  } else throw new HttpError(405, 'METHOD_NOT_ALLOWED');
  return true;
}
