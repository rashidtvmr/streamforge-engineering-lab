import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { platformFixture } from './platformFixture.ts';
describe('video comment threads', () => {
  it('allows public reading and authenticated replies with validated parent', async () => {
    const env = await platformFixture();
    try {
      const path = '/api/v1/videos/video-001/comments';
      assert.equal((await env.request(path, 'POST', { body: 'hello' }, false)).status, 401);
      await env.register();
      const response = await env.request(path, 'POST', { body: 'Great breakdown!' });
      assert.equal(response.status, 201);
      const parent = (await response.json() as { comment: { id: string } }).comment.id;
      assert.equal((await env.request(path, 'POST', { body: 'Thanks', parentId: parent })).status, 201);
      assert.equal((await env.request(path, 'POST', { body: 'x', parentId: 'notfound' })).status, 400);
      const comments = (await (await env.request(path, 'GET', undefined, false)).json() as { data: { parentId: string | null }[] }).data;
      assert.equal(comments.length, 2);
      assert.equal(comments[1]?.parentId, parent);
    } finally { await env.close(); }
  });
});
