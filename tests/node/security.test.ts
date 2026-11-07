import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { createRateLimiter } from '../../server/platform/guard.ts';
import { platformFixture } from './platformFixture.ts';

describe('platform security controls', () => {
  it('rate limiter enforces windows with an injected clock', () => {
    const allow = createRateLimiter(2, 60_000);
    assert.equal(allow('remote-user', 100), true);
    assert.equal(allow('remote-user', 101), true);
    assert.equal(allow('remote-user', 102), false);
    assert.equal(allow('another-user', 102), true);
    assert.equal(allow('remote-user', 60_100), true);
  });
  it('rejects cross-site mutations while preserving same-origin login', async () => {
    const env = await platformFixture();
    try {
      const payload = JSON.stringify({ email: 'valid@example.test', name: 'Test', password: 'strong-test-secret' });
      const wrong = await fetch(env.origin + '/api/v1/accounts', {
        method: 'POST', body: payload,
        headers: { origin: 'https://evil.example', 'content-type': 'application/json' },
      });
      assert.equal(wrong.status, 403);
      assert.deepEqual(await wrong.json(), { error: 'CROSS_ORIGIN_BLOCKED' });
      const good = await fetch(env.origin + '/api/v1/accounts', {
        method: 'POST', body: payload,
        headers: { origin: env.origin, 'content-type': 'application/json' },
      });
      assert.equal(good.status, 201);
      assert.equal(good.headers.get('referrer-policy'), 'no-referrer');
      assert.equal(good.headers.get('cross-origin-resource-policy'), 'same-origin');
      const badFetch = await fetch(env.origin + '/api/v1/session', {
        method: 'POST', body: JSON.stringify({ email: 'valid@example.test', password: 'strong-test-secret' }),
        headers: { origin: env.origin, 'sec-fetch-site': 'cross-site', 'content-type': 'application/json' },
      });
      assert.equal(badFetch.status, 403);
      assert.deepEqual(await badFetch.json(), { error: 'CROSS_SITE_BLOCKED' });
    } finally { await env.close(); }
  });
});
