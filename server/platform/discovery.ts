import { respond, type Context } from './http.ts';
import { getSessionUser } from './auth.ts';
import { rankForYou, rankTrending } from './ranking.ts';
import { seedVideos } from '../../src/domain/seed.ts';
import { publicStudioVideos } from './catalogProjection.ts';
export function handleDiscovery(ctx: Context): boolean {
  const path = ctx.url.pathname;
  if (path !== '/api/v1/discover/trending' && path !== '/api/v1/discover/for-you') return false;
  const catalog = [...seedVideos, ...publicStudioVideos(ctx.db)];
  if (path.endsWith('/trending')) {
    respond(ctx.response, 200, { data: rankTrending(catalog).slice(0, 24) }); return true;
  }
  const user = getSessionUser(ctx);
  const follows = user ? ctx.db.prepare('SELECT creator FROM subscriptions WHERE user_id=?').all(user.id).map((row) => String(row.creator)) : [];
  const history = user ? ctx.db.prepare('SELECT video_id FROM history WHERE user_id=?').all(user.id).map((row) => String(row.video_id)) : [];
  respond(ctx.response, 200, { data: rankForYou(catalog, follows, history).slice(0, 24) });
  return true;
}
