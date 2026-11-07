import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { platformFixture } from './platformFixture.ts';
describe('typeahead and private recent searches', () => {
  it('suggests matching titles and bounds/privatizes search history', async () => {
    const env = await platformFixture();
    try {
      const suggestions = await env.request('/api/v1/search/suggest?q=rea');
      assert.equal(suggestions.status, 200);
      assert.ok(((await suggestions.json()) as { data: string[] }).data.some((title) => title.includes('React')));
      assert.equal((await env.request('/api/v1/search/recent', 'GET', undefined, false)).status, 401);
      await env.register();
      assert.equal((await env.request('/api/v1/search/recent', 'POST', { query: 'react' })).status, 200);
      assert.deepEqual(await (await env.request('/api/v1/search/recent')).json(), { data: ['react'] });
      assert.equal((await env.request('/api/v1/search/recent', 'DELETE')).status, 200);
      assert.deepEqual(await (await env.request('/api/v1/search/recent')).json(), { data: [] });
      assert.equal((await env.request('/api/v1/search/suggest?q=' + 'x'.repeat(81))).status, 400);
    } finally { await env.close(); }
  });
});
