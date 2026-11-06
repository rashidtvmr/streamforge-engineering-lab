import { strict as assert } from 'node:assert';
import { after, before, describe, it } from 'node:test';
import { type AddressInfo } from 'node:net';
import { createApp } from '../../server/app.ts';
import { parseCatalogPage, parseVideo } from '../../src/contracts/catalog.ts';

const server = createApp();
let origin = '';
before(async () => {
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address() as AddressInfo;
  origin = `http://127.0.0.1:${address.port}`;
});
after(async () => {
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

const get = (path: string) => fetch(origin + path);

describe('HTTP integration and contract tests', () => {
  it('health check is suitable for readiness probes', async () => {
    const response = await get('/api/health');
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: 'ok' });
  });

  it('returns a page matching the consumer contract', async () => {
    const response = await get('/api/videos?category=engineering&sort=popular&page=1&pageSize=3');
    assert.equal(response.status, 200);
    const body = parseCatalogPage(await response.json());
    assert.equal(body.data.length, 3);
    assert.ok(body.data.every((video) => video.category === 'engineering'));
    assert.ok((body.data[0]?.views ?? 0) >= (body.data[1]?.views ?? 0));
  });

  it('rejects invalid, excessive, unknown and repeated query parameters', async () => {
    const paths = [
      '/api/videos?page=-1', '/api/videos?page=0', '/api/videos?pageSize=20000',
      '/api/videos?sort=oldest', '/api/videos?sort=popular&sort=recent',
      '/api/videos?query=' + 'a'.repeat(121), '/api/videos?secret=oops',
    ];
    for (const path of paths) {
      const response = await get(path);
      assert.equal(response.status, 400, path);
      assert.deepEqual(await response.json(), { error: 'INVALID_QUERY' });
    }
  });

  it('does not reflect a malicious search string as executable content', async () => {
    const response = await get('/api/videos?query=%3Cscript%3E');
    assert.equal(response.status, 200);
    const page = parseCatalogPage(await response.json());
    assert.equal(page.data.length, 0);
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  });

  it('returns a validated detail page and a stable 404', async () => {
    const found = await get('/api/videos/video-001');
    assert.equal(found.status, 200);
    assert.equal(parseVideo(await found.json()).title, 'React rendering at scale');
    const missing = await get('/api/videos/does-not-exist');
    assert.equal(missing.status, 404);
    assert.deepEqual(await missing.json(), { error: 'VIDEO_NOT_FOUND' });
  });

  it('hydrates a watchlist using one batch HTTP request in requested order', async () => {
    const response = await get('/api/videos/lookup?ids=video-005,video-001');
    assert.equal(response.status, 200);
    const body = await response.json() as { data: Array<{ id: string }> };
    assert.deepEqual(body.data.map((video) => video.id), ['video-005', 'video-001']);
  });

  it('rejects invalid batch ids and unexpected parameters', async () => {
    for (const path of ['/api/videos/lookup?ids=<script>', '/api/videos/lookup', '/api/videos/lookup?ids=video-001&admin=true']) {
      const response = await get(path);
      assert.equal(response.status, 400, path);
    }
  });

  it('rejects unsupported methods', async () => {
    const response = await fetch(origin + '/api/videos', { method: 'POST' });
    assert.equal(response.status, 405);
    assert.equal(response.headers.get('allow'), 'GET');
  });
});
