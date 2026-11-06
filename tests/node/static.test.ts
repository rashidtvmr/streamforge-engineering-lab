import { strict as assert } from 'node:assert';
import { after, before, describe, it } from 'node:test';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { type AddressInfo } from 'node:net';
import { createApp } from '../../server/app.ts';

const dir = mkdtempSync(join(tmpdir(), 'streamforge-static-'));
mkdirSync(join(dir, 'assets'));
writeFileSync(join(dir, 'index.html'), '<!doctype html><title>StreamForge production</title>');
writeFileSync(join(dir, 'assets', 'bundle.js'), 'console.log("hello")');
const server = createApp({ staticDir: dir });
let origin = '';

before(async () => {
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
after(async () => {
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  rmSync(dir, { recursive: true, force: true });
});

describe('single-origin production runtime', () => {
  it('serves HTML with a restrictive CSP and no cached entrypoint', async () => {
    const response = await fetch(origin + '/');
    assert.equal(response.status, 200);
    assert.match(await response.text(), /StreamForge production/);
    assert.match(response.headers.get('content-security-policy') ?? '', /script-src 'self'/);
    assert.equal(response.headers.get('cache-control'), 'no-cache');
  });

  it('streams hashed-style assets with long immutable cache policy', async () => {
    const response = await fetch(origin + '/assets/bundle.js');
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-type'), 'text/javascript; charset=utf-8');
    assert.match(response.headers.get('cache-control') ?? '', /immutable/);
    assert.match(await response.text(), /console.log/);
  });

  it('blocks path traversal and missing static resources', async () => {
    for (const path of ['/assets/%2e%2e%2fhidden.js', '/assets/missing.js', '/secret.txt']) {
      const response = await fetch(origin + path);
      assert.equal(response.status, 404, path);
    }
  });

  it('preserves API routing in the production server', async () => {
    const response = await fetch(origin + '/api/health');
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: 'ok' });
  });
});
