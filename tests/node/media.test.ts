import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { platformFixture } from './platformFixture.ts';
describe('bounded mp4 uploads and partial video streaming', () => {
  it('requires owner, checks magic, and serves published byte ranges', async () => {
    const env = await platformFixture();
    try {
      await env.register();
      const draft = await env.request('/api/v1/studio/videos', 'POST', { title: 'My lecture', description: 'example', category: 'science' });
      const id = (await draft.json() as { video: { id: string } }).video.id;
      const uri = `/api/v1/studio/videos/${id}/media`;
      const fakeMp4 = Buffer.concat([Buffer.from([0, 0, 0, 24]), Buffer.from('ftyp'), Buffer.from('isom'), Buffer.alloc(12)]);
      assert.equal((await fetch(env.origin + uri, { method: 'PUT', headers: { 'content-type': 'video/mp4' }, body: fakeMp4 })).status, 401);
      assert.equal((await fetch(env.origin + uri, { method: 'PUT', headers: { cookie: env.cookie, 'content-type': 'video/mp4' }, body: fakeMp4 })).status, 200);
      assert.equal((await env.request(`/api/v1/media/${id}`, 'GET', undefined, false)).status, 404);
      await env.request(`/api/v1/studio/videos/${id}`, 'PATCH', { status: 'published' });
      const partial = await fetch(env.origin + `/api/v1/media/${id}`, { headers: { range: 'bytes=0-11' } });
      assert.equal(partial.status, 206);
      assert.equal((await partial.arrayBuffer()).byteLength, 12);
      assert.match(partial.headers.get('content-range') ?? '', /bytes 0-11/);
    } finally { await env.close(); }
  });
});
