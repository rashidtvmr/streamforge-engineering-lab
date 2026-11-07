import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { platformFixture } from './platformFixture.ts';

describe('durable, per-user watch history', () => {
  it('requires a session, upserts progress and clears entries', async () => {
    const env = await platformFixture();
    try {
      assert.equal((await env.request('/api/v1/history', 'GET', undefined, false)).status, 401);
      await env.register();
      const input = { videoId: 'video-001', progressSeconds: 60 };
      assert.equal((await env.request('/api/v1/history', 'POST', input)).status, 200);
      assert.equal((await env.request('/api/v1/history', 'POST', { ...input, progressSeconds: 95 })).status, 200);
      const response = await env.request('/api/v1/history');
      const body = await response.json() as { data: { videoId: string; progressSeconds: number }[] };
      assert.equal(body.data.length, 1);
      assert.deepEqual([body.data[0]?.videoId, body.data[0]?.progressSeconds], ['video-001', 95]);
      assert.equal((await env.request('/api/v1/history', 'POST', { videoId: '../secret', progressSeconds: -1 })).status, 400);
      assert.equal((await env.request('/api/v1/history', 'DELETE')).status, 200);
      assert.deepEqual(await (await env.request('/api/v1/history')).json(), { data: [] });
    } finally { await env.close(); }
  });
});
