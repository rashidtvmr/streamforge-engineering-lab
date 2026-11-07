import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { platformFixture } from './platformFixture.ts';
describe('comment owner edits, deletion and reports', () => {
  it('enforces ownership and deduplicates abuse reports', async () => {
    const env = await platformFixture();
    try {
      await env.register();
      const posted = await env.request('/api/v1/videos/video-001/comments', 'POST', { body: 'first' });
      const id = (await posted.json() as { comment: { id: string } }).comment.id;
      assert.equal((await env.request(`/api/v1/comments/${id}`, 'PATCH', { body: 'updated' })).status, 200);
      await env.register();
      assert.equal((await env.request(`/api/v1/comments/${id}`, 'PATCH', { body: 'steal' })).status, 403);
      assert.equal((await env.request(`/api/v1/comments/${id}/reports`, 'POST', { reason: 'spam' })).status, 201);
      assert.equal((await env.request(`/api/v1/comments/${id}/reports`, 'POST', { reason: 'spam' })).status, 201);
      assert.equal(env.db.prepare('SELECT COUNT(*) AS n FROM comment_reports').get()?.n, 1);
    } finally { await env.close(); }
  });
});
