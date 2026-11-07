import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { rankForYou, rankTrending } from '../../server/platform/ranking.ts';
const examples = [
  { id: 'a', creator: 'X', category: 'science', views: 10, publishedAt: '2026-11-01T00:00:00Z' },
  { id: 'b', creator: 'Y', category: 'product', views: 100, publishedAt: '2026-10-01T00:00:00Z' },
  { id: 'c', creator: 'X', category: 'design', views: 20, publishedAt: '2026-11-02T00:00:00Z' },
];
describe('feed ranking invariants', () => {
  it('preserves input arrays and deterministically boosts subscriptions', () => {
    const before = [...examples];
    assert.equal(rankForYou(examples, ['Y'], [])[0]?.id, 'b');
    assert.deepEqual(examples, before);
  });
  it('supports clock injection for stable trending rankings', () => {
    const one = rankTrending(examples, Date.parse('2026-11-07'));
    assert.deepEqual(one, rankTrending(examples, Date.parse('2026-11-07')));
    assert.equal(one.length, examples.length);
  });
});
