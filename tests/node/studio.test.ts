import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { platformFixture } from './platformFixture.ts';
describe('creator studio draft lifecycle', () => {
  it('creates an owned draft and validates metadata', async () => {
    const env = await platformFixture();
    try {
      const payload = { title: 'Architecture from scratch', description: 'A deep-dive', category: 'engineering' };
      assert.equal((await env.request('/api/v1/studio/videos', 'POST', payload, false)).status, 401);
      await env.register();
      const response = await env.request('/api/v1/studio/videos', 'POST', payload);
      assert.equal(response.status, 201);
      const video = (await response.json() as { video: { id: string; status: string } }).video;
      assert.match(video.id, /^video-[0-9a-f-]{36}$/);
      assert.equal(video.status, 'draft');
      const listed = await env.request('/api/v1/studio/videos');
      assert.equal(((await listed.json()) as { data: unknown[] }).data.length, 1);
      assert.equal((await env.request('/api/v1/studio/videos', 'POST', { title: '', description: 'x', category: 'unknown' })).status, 400);
    } finally { await env.close(); }
  });
});
