import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { platformFixture } from './platformFixture.ts';
describe('playlist ordering and read-only sharing', () => {
  it('never leaks private playlists; supports atomic ordering and unlisted sharing', async () => {
    const env = await platformFixture();
    try {
      await env.register();
      const playlist = (await (await env.request('/api/v1/playlists', 'POST', { name: 'Curriculum' })).json() as { playlist: { id: string } }).playlist;
      for (const id of ['video-001', 'video-002']) await env.request(`/api/v1/playlists/${playlist.id}/items`, 'POST', { videoId: id });
      assert.equal((await env.request(`/api/v1/shared-playlists/${playlist.id}`, 'GET', undefined, false)).status, 404);
      assert.equal((await env.request(`/api/v1/playlists/${playlist.id}/order`, 'PUT', { ids: ['video-002', 'video-001'] })).status, 200);
      const details = await (await env.request(`/api/v1/playlists/${playlist.id}`)).json() as { data: { videoId: string }[] };
      assert.deepEqual(details.data.map((item) => item.videoId), ['video-002', 'video-001']);
      assert.equal((await env.request(`/api/v1/playlists/${playlist.id}/order`, 'PUT', { ids: ['video-002', 'video-002'] })).status, 400);
      const renamed = await env.request(`/api/v1/playlists/${playlist.id}`, 'PATCH', { name: 'Expert lessons', visibility: 'unlisted' });
      assert.equal(renamed.status, 200);
      const publicResponse = await env.request(`/api/v1/shared-playlists/${playlist.id}`, 'GET', undefined, false);
      assert.equal(publicResponse.status, 200);
      assert.equal(((await publicResponse.json()) as { playlist: { name: string } }).playlist.name, 'Expert lessons');
    } finally { await env.close(); }
  });
});
