import { HttpError, readJson, respond, type Context } from './http.ts';
import { requireUser } from './auth.ts';

export async function handleSearch(ctx: Context): Promise<boolean> {
  const path = ctx.url.pathname;
  if (path === '/api/v1/search/suggest') {
    if (ctx.request.method !== 'GET') throw new HttpError(405, 'METHOD_NOT_ALLOWED');
    const q = ctx.url.searchParams.get('q') ?? '';
    if (q.length > 80 || ctx.url.searchParams.getAll('q').length > 1) throw new HttpError(400, 'INVALID_QUERY');
    const query = q.trim().toLowerCase();
    if (query.length < 2) { respond(ctx.response, 200, { data: [] }); return true; }
    const rows = ctx.db.prepare("SELECT title FROM studio_videos WHERE status='published'").all() as { title: string }[];
    const builtIn = ['React rendering at scale', 'Testing asynchronous JavaScript', 'How satellites stay in orbit', 'Designing accessible colors', 'Frontend performance budgets', 'The science of deep oceans', 'Resilient backend architecture'];
    const values = [...new Set([...builtIn, ...rows.map((row) => row.title)])];
    const data = values.filter((title) => title.toLowerCase().includes(query)).sort().slice(0, 8);
    respond(ctx.response, 200, { data }); return true;
  }
  if (path !== '/api/v1/search/recent') return false;
  const user = requireUser(ctx);
  if (ctx.request.method === 'GET') {
    const rows = ctx.db.prepare('SELECT query FROM recent_searches WHERE user_id=? ORDER BY updated_at DESC,query ASC LIMIT 10').all(user.id);
    respond(ctx.response, 200, { data: rows.map((row) => row.query) });
  } else if (ctx.request.method === 'POST') {
    const input = await readJson(ctx.request);
    if (typeof input.query !== 'string' || !input.query.trim() || input.query.trim().length > 80) throw new HttpError(400, 'INVALID_QUERY');
    ctx.db.prepare('INSERT INTO recent_searches(user_id,query,updated_at) VALUES(?,?,?) ON CONFLICT(user_id,query) DO UPDATE SET updated_at=excluded.updated_at')
      .run(user.id, input.query.trim(), new Date().toISOString());
    ctx.db.prepare('DELETE FROM recent_searches WHERE user_id=? AND query NOT IN (SELECT query FROM recent_searches WHERE user_id=? ORDER BY updated_at DESC,query ASC LIMIT 10)')
      .run(user.id, user.id);
    respond(ctx.response, 200, { stored: true });
  } else if (ctx.request.method === 'DELETE') {
    ctx.db.prepare('DELETE FROM recent_searches WHERE user_id=?').run(user.id);
    respond(ctx.response, 200, { cleared: true });
  } else throw new HttpError(405, 'METHOD_NOT_ALLOWED');
  return true;
}
