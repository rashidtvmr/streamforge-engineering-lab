import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { catalogPage } from '../src/domain/catalog.ts';
import { seedVideos } from '../src/domain/seed.ts';
import { categories, type CatalogQuery } from '../src/domain/types.ts';

function sendJson(response: ServerResponse, status: number, body: unknown): void {
  response.statusCode = status;
  response.setHeader('content-type', 'application/json; charset=utf-8');
  response.setHeader('x-content-type-options', 'nosniff');
  response.setHeader('cache-control', 'no-store');
  response.end(JSON.stringify(body));
}

export function parseCatalogQuery(parameters: URLSearchParams): CatalogQuery | null {
  const allowed = new Set(['query', 'category', 'sort', 'page', 'pageSize']);
  for (const key of parameters.keys()) {
    if (!allowed.has(key) || parameters.getAll(key).length !== 1) return null;
  }

  const query = parameters.get('query') ?? '';
  const category = parameters.get('category') ?? 'all';
  const sort = parameters.get('sort') ?? 'recent';
  if (query.length > 120) return null;
  if (category !== 'all' && !categories.some((value) => value === category)) return null;
  if (sort !== 'popular' && sort !== 'recent') return null;

  const positiveInt = (raw: string | null, fallback: number, max: number): number | null => {
    if (raw === null) return fallback;
    if (!/^[1-9][0-9]*$/.test(raw)) return null;
    const result = Number(raw);
    return Number.isSafeInteger(result) && result <= max ? result : null;
  };
  const page = positiveInt(parameters.get('page'), 1, 1000);
  const pageSize = positiveInt(parameters.get('pageSize'), 12, 24);
  if (page === null || pageSize === null) return null;

  return { query, category: category as CatalogQuery['category'], sort, page, pageSize };
}

function route(request: IncomingMessage, response: ServerResponse): void {
  if (request.method !== 'GET') {
    response.setHeader('allow', 'GET');
    sendJson(response, 405, { error: 'METHOD_NOT_ALLOWED' });
    return;
  }

  let url: URL;
  try {
    url = new URL(request.url ?? '/', 'http://127.0.0.1');
  } catch {
    sendJson(response, 400, { error: 'INVALID_URL' });
    return;
  }

  if (url.pathname === '/api/health') {
    sendJson(response, 200, { status: 'ok' });
    return;
  }
  if (url.pathname === '/api/videos') {
    const query = parseCatalogQuery(url.searchParams);
    if (!query) {
      sendJson(response, 400, { error: 'INVALID_QUERY' });
      return;
    }
    sendJson(response, 200, catalogPage(seedVideos, query));
    return;
  }
  if (url.pathname === '/api/videos/lookup') {
    const keys = [...url.searchParams.keys()];
    const ids = (url.searchParams.get('ids') ?? '').split(',');
    if (keys.length !== 1 || keys[0] !== 'ids' || ids.length > 24 ||
        ids.some((id) => !/^video-[0-9]{3}$/.test(id))) {
      sendJson(response, 400, { error: 'INVALID_IDS' });
      return;
    }
    const data = ids.flatMap((id) => {
      const video = seedVideos.find((item) => item.id === id);
      return video ? [video] : [];
    });
    sendJson(response, 200, { data });
    return;
  }
  const match = /^\/api\/videos\/([^/]+)$/.exec(url.pathname);
  if (match) {
    const video = seedVideos.find((item) => item.id === match[1]);
    sendJson(response, video ? 200 : 404, video ?? { error: 'VIDEO_NOT_FOUND' });
    return;
  }
  sendJson(response, 404, { error: 'NOT_FOUND' });
}

export function createApp() {
  return createServer(route);
}
