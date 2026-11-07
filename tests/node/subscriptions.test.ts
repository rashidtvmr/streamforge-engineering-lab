import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { platformFixture } from './platformFixture.ts';
describe('creator subscriptions', () => {
  it('stores idempotent follows, rejects anonymous mutation, isolates users', async () => {
    const env = await platformFixture();
    try {
      const path = '/api/v1/creators/Systems%20Studio/subscription';
      assert.equal((await env.request(path, 'PUT', undefined, false)).status, 401);
      await env.register();
      assert.equal((await env.request(path, 'PUT')).status, 200);
      assert.equal((await env.request(path, 'PUT')).status, 200);
      assert.deepEqual(await (await env.request('/api/v1/subscriptions')).json(), { data: [{ creator: 'Systems Studio' }] });
      assert.deepEqual(await (await env.request(path)).json(), { subscribed: true });
      assert.deepEqual(await (await env.request(path, 'GET', undefined, false)).json(), { subscribed: false });
      assert.equal((await env.request(path, 'DELETE')).status, 200);
      assert.deepEqual(await (await env.request('/api/v1/subscriptions')).json(), { data: [] });
    } finally { await env.close(); }
  });
});
