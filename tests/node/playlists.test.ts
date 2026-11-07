import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { platformFixture } from './platformFixture.ts';
describe('playlist CRUD and membership', () => {
  it('creates a private playlist, prevents duplicates and deletes it', async () => {
    const env = await platformFixture();
    try {
      assert.equal((await env.request('/api/v1/playlists', 'POST', { name: 'Study' }, false)).status, 401);
      await env.register();
      const response = await env.request('/api/v1/playlists', 'POST', { name: 'Study' });
      assert.equal(response.status, 201);
      const id = ((await response.json()) as { playlist: { id: string } }).playlist.id;
      assert.equal((await env.request(`/api/v1/playlists/${id}/items`, 'POST', { videoId: 'video-001' })).status, 200);
      assert.equal((await env.request(`/api/v1/playlists/${id}/items`, 'POST', { videoId: 'video-001' })).status, 200);
      const body = await (await env.request(`/api/v1/playlists/${id}`)).json() as { data: { videoId: string }[] };
      assert.deepEqual(body.data.map((item) => item.videoId), ['video-001']);
      assert.equal((await env.request(`/api/v1/playlists/${id}/items/video-001`, 'DELETE')).status, 200);
      assert.equal((await env.request(`/api/v1/playlists/${id}`, 'DELETE')).status, 200);
      assert.equal((await env.request(`/api/v1/playlists/${id}`)).status, 404);
    } finally { await env.close(); }
  });
});
