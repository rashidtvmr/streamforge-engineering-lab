import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { join } from 'node:path';
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

async function serveStatic(response: ServerResponse, pathname: string, staticDir: string): Promise<void> {
  const asset = /^\/assets\/([A-Za-z0-9._-]+)$/.exec(pathname);
  const filename = pathname === '/' || pathname === '/index.html'
    ? 'index.html'
    : asset ? join('assets', asset[1] ?? '') : null;
  if (!filename) {
    sendJson(response, 404, { error: 'NOT_FOUND' });
    return;
  }
  const extension = filename.split('.').pop();
  const mime = extension === 'html' ? 'text/html; charset=utf-8'
    : extension === 'js' ? 'text/javascript; charset=utf-8'
    : extension === 'css' ? 'text/css; charset=utf-8'
    : extension === 'svg' ? 'image/svg+xml'
    : extension === 'png' ? 'image/png'
    : 'application/octet-stream';
  const file = join(staticDir, filename);
  try {
    const info = await stat(file);
    if (!info.isFile()) throw new Error('not a file');
    response.statusCode = 200;
    response.setHeader('content-type', mime);
    response.setHeader('content-length', info.size);
    response.setHeader('x-content-type-options', 'nosniff');
    response.setHeader('cache-control', filename === 'index.html' ? 'no-cache' : 'public, max-age=31536000, immutable');
    response.setHeader('content-security-policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; media-src 'self' https://interactive-examples.mdn.mozilla.net; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");
    const stream = createReadStream(file);
    stream.on('error', (error) => {
      if (!response.headersSent) sendJson(response, 500, { error: 'ASSET_READ_FAILED' });
      else response.destroy(error);
    });
    stream.pipe(response);
  } catch {
    sendJson(response, 404, { error: 'NOT_FOUND' });
  }
}

function route(request: IncomingMessage, response: ServerResponse, staticDir?: string): void {
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
  if (staticDir && !url.pathname.startsWith('/api/')) {
    void serveStatic(response, url.pathname, staticDir);
    return;
  }
  sendJson(response, 404, { error: 'NOT_FOUND' });
}

export function createApp(options: { staticDir?: string } = {}) {
  return createServer((request, response) => route(request, response, options.staticDir));
}
