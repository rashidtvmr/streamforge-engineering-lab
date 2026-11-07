import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { platformFixture } from './platformFixture.ts';
import { publicStudioVideos } from '../../server/platform/catalogProjection.ts';
describe('public catalog projection', () => {
  it('only exposes explicitly published creator videos', async () => {
    const env = await platformFixture();
    try {
      await env.register();
      const created = await env.request('/api/v1/studio/videos', 'POST', { title: 'New science lesson', description: 'notes', category: 'science' });
      const id = (await created.json() as { video: { id: string } }).video.id;
      assert.deepEqual(publicStudioVideos(env.db), []);
      await env.request(`/api/v1/studio/videos/${id}`, 'PATCH', { status: 'published' });
      const published = publicStudioVideos(env.db);
      assert.equal(published.length, 1);
      assert.equal(published[0]?.title, 'New science lesson');
      assert.equal(published[0]?.creator, 'Student');
      await env.request(`/api/v1/studio/videos/${id}`, 'PATCH', { status: 'draft' });
      assert.deepEqual(publicStudioVideos(env.db), []);
    } finally { await env.close(); }
  });
});
