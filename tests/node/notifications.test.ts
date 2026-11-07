import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { platformFixture } from './platformFixture.ts';
describe('account notifications', () => {
  it('notifies followers on publish and secures read receipts', async () => {
    const env = await platformFixture();
    try {
      await env.register(); const viewerCookie = env.cookie;
      await env.request('/api/v1/creators/Student/subscription', 'PUT');
      await env.register();
      const video = await env.request('/api/v1/studio/videos', 'POST', { title: 'The demo broadcast', description: 'x', category: 'science' });
      const id = (await video.json() as { video: { id: string } }).video.id;
      await env.request(`/api/v1/studio/videos/${id}`, 'PATCH', { status: 'published' });
      const response = await fetch(env.origin + '/api/v1/notifications', { headers: { cookie: viewerCookie } });
      assert.equal(response.status, 200);
      const notices = (await response.json() as { data: { id: string; message: string }[] }).data;
      assert.equal(notices.length, 1);
      assert.match(notices[0]!.message, /published/);
      assert.equal((await fetch(env.origin + `/api/v1/notifications/${notices[0]!.id}`, { method: 'PATCH', headers: { cookie: viewerCookie } })).status, 200);
      assert.equal((await env.request('/api/v1/notifications', 'GET', undefined, false)).status, 401);
    } finally { await env.close(); }
  });
});
