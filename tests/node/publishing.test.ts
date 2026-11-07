import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { platformFixture } from './platformFixture.ts';
describe('draft to published content lifecycle', () => {
  it('owner can publish/unpublish validated video metadata', async () => {
    const env = await platformFixture();
    try {
      await env.register();
      const created = await env.request('/api/v1/studio/videos', 'POST', { title: 'A tutorial', description: 'notes', category: 'science' });
      const id = (await created.json() as { video: { id: string } }).video.id;
      assert.equal((await env.request(`/api/v1/studio/videos/${id}`, 'PATCH', { status: 'public' })).status, 400);
      assert.equal((await env.request(`/api/v1/studio/videos/${id}`, 'PATCH', { status: 'published', title: 'Deep science' })).status, 200);
      const row = env.db.prepare('SELECT status,title FROM studio_videos WHERE id=?').get(id) as { status: string; title: string };
      assert.equal(row.status, 'published'); assert.equal(row.title, 'Deep science');
      assert.equal((await env.request(`/api/v1/studio/videos/${id}`, 'PATCH', { status: 'draft' })).status, 200);
    } finally { await env.close(); }
  });
});
