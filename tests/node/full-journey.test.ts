import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { platformFixture } from './platformFixture.ts';
import { publicStudioVideos } from '../../server/platform/catalogProjection.ts';
import { isVideoId } from '../../src/domain/videoId.ts';

describe('full creator to viewer platform journey', () => {
  it('publishes media, notifies follower, records history, playlist, reaction and comment', async () => {
    const env = await platformFixture();
    try {
      await env.register('owner@example.test');
      const owner = env.cookie;
      await env.register('viewer@example.test');
      const viewer = env.cookie;
      const req = (path: string, method = 'GET', body?: object, cookie = viewer) => fetch(env.origin + path, {
        method, headers: { ...(body ? { 'content-type': 'application/json' } : {}), cookie },
        body: body ? JSON.stringify(body) : undefined,
      });
      assert.equal((await req('/api/v1/creators/Student/subscription', 'PUT')).status, 200);
      const created = await req('/api/v1/studio/videos', 'POST', {
        title: 'An original physics lesson', description: 'Synthetic science', category: 'science',
      }, owner);
      assert.equal(created.status, 201);
      const id = (await created.json() as { video: { id: string } }).video.id;
      assert.equal(isVideoId(id), true);
      const mp4 = Buffer.concat([Buffer.from([0, 0, 0, 24]), Buffer.from('ftypisom'), Buffer.alloc(12)]);
      assert.equal((await fetch(env.origin + `/api/v1/studio/videos/${id}/media`, {
        method: 'PUT', headers: { cookie: owner, 'content-type': 'video/mp4' }, body: mp4,
      })).status, 200);
      assert.equal((await req(`/api/v1/media/${id}`)).status, 404);
      assert.equal((await req(`/api/v1/studio/videos/${id}`, 'PATCH', { status: 'published' }, owner)).status, 200);
      assert.equal(publicStudioVideos(env.db).some((video) => video.id === id), true);
      const media = await fetch(env.origin + `/api/v1/media/${id}`, { headers: { range: 'bytes=0-11' } });
      assert.equal(media.status, 206);
      assert.equal((await media.arrayBuffer()).byteLength, 12);
      const noticeRows = (await (await req('/api/v1/notifications')).json() as { data: { message: string }[] }).data;
      assert.equal(noticeRows.length, 1);
      assert.match(noticeRows[0]!.message, /original physics lesson/);
      assert.equal((await req('/api/v1/history', 'POST', { videoId: id, progressSeconds: 32 })).status, 200);
      const history = await req('/api/v1/history');
      assert.equal(((await history.json()) as { data: { videoId: string }[] }).data[0]!.videoId, id);
      const createdPlaylist = await req('/api/v1/playlists', 'POST', { name: 'Learning queue' });
      const playlistId = (await createdPlaylist.json() as { playlist: { id: string } }).playlist.id;
      assert.equal((await req(`/api/v1/playlists/${playlistId}/items`, 'POST', { videoId: id })).status, 200);
      const playlistDetails = await req(`/api/v1/playlists/${playlistId}`);
      assert.equal(((await playlistDetails.json()) as { data: { videoId: string }[] }).data[0]!.videoId, id);
      assert.equal((await req(`/api/v1/videos/${id}/reactions`, 'PUT', { kind: 'like' })).status, 200);
      assert.equal((await req(`/api/v1/videos/${id}/comments`, 'POST', { body: 'Great demonstration' })).status, 201);
      const comments = await req(`/api/v1/videos/${id}/comments`);
      assert.equal(((await comments.json()) as { data: { body: string }[] }).data[0]?.body, 'Great demonstration');
      assert.equal((await req(`/api/v1/studio/videos/${id}`, 'PATCH', { status: 'draft' }, owner)).status, 200);
      assert.equal(publicStudioVideos(env.db).some((video) => video.id === id), false);
      assert.equal((await req(`/api/v1/media/${id}`)).status, 404);
    } finally { await env.close(); }
  });
  it('only accepts seeded numeric or canonical UUID video IDs', () => {
    for (const id of ['video-001', 'video-999', 'video-11111111-1111-4111-8111-111111111111']) assert.equal(isVideoId(id), true);
    for (const id of ['video-1', 'video-wrong', 'video-1111', '../admin', 'video-11111111-1111']) assert.equal(isVideoId(id), false);
  });
});
