import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { platformFixture } from './platformFixture.ts';
describe('authenticated video reactions', () => {
  it('toggles one reaction per user and reports public aggregate counts', async () => {
    const env = await platformFixture();
    try {
      const url = '/api/v1/videos/video-001/reactions';
      assert.equal((await env.request(url, 'PUT', { kind: 'like' }, false)).status, 401);
      await env.register();
      assert.equal((await env.request(url, 'PUT', { kind: 'like' })).status, 200);
      assert.equal((await env.request(url, 'PUT', { kind: 'like' })).status, 200);
      assert.deepEqual(await (await env.request(url)).json(), { likes: 1, dislikes: 0, mine: 'like' });
      assert.equal((await env.request(url, 'PUT', { kind: 'dislike' })).status, 200);
      assert.deepEqual(await (await env.request(url)).json(), { likes: 0, dislikes: 1, mine: 'dislike' });
      assert.equal((await env.request(url, 'PUT', { kind: 'wat' })).status, 400);
      assert.equal((await env.request(url, 'DELETE')).status, 200);
      assert.deepEqual(await (await env.request(url)).json(), { likes: 0, dislikes: 0, mine: null });
    } finally { await env.close(); }
  });
});
