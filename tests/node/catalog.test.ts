import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { catalogPage, filterVideos, paginateVideos, sortVideos } from '../../src/domain/catalog.ts';
import { seedVideos } from '../../src/domain/seed.ts';

const byId = (ids: readonly string[]) => seedVideos.filter((video) => ids.includes(video.id));

describe('catalog domain — executable without npm packages', () => {
  it('searches title, creator and description without case sensitivity', () => {
    const matches = filterVideos(seedVideos, 'REACT', 'all');
    assert.equal(matches.length, 1);
    assert.equal(matches[0]?.id, 'video-001');
  });

  it('intersects category with query, not unions', () => {
    assert.equal(filterVideos(seedVideos, 'rendering', 'science').length, 0);
  });

  it('sorts ties by id and never mutates inputs', () => {
    const input = byId(['video-001', 'video-002']).reverse();
    const before = input.map((video) => video.id);
    const result = sortVideos(input.map((video) => ({ ...video, views: 1 })), 'popular');
    assert.deepEqual(result.map((video) => video.id), ['video-001', 'video-002']);
    assert.deepEqual(input.map((video) => video.id), before);
  });

  it('rejects invalid page boundaries', () => {
    for (const value of [0, -1, 1.5, NaN, Infinity]) {
      assert.throws(() => paginateVideos(seedVideos, value, 10), RangeError);
    }
    assert.throws(() => paginateVideos(seedVideos, 1, 0), RangeError);
  });

  it('invariant: pagination reconstructs the original list', () => {
    for (let size = 1; size <= 25; size += 1) {
      const pages = [];
      for (let page = 1; page <= Math.ceil(seedVideos.length / size); page += 1) {
        pages.push(...paginateVideos(seedVideos, page, size));
      }
      assert.deepEqual(pages, seedVideos);
    }
  });

  it('invariant: no filter can invent a video or reorder results', () => {
    for (const query of ['', 'React', 'a', 'not-found', ' science ', '<script>']) {
      for (const category of ['all', 'engineering', 'design', 'product', 'science'] as const) {
        const result = filterVideos(seedVideos, query, category);
        const sourcePositions = result.map((item) => seedVideos.indexOf(item));
        assert.ok(sourcePositions.every((position) => position >= 0));
        assert.deepEqual(sourcePositions, [...sourcePositions].sort((a, b) => a - b));
      }
    }
  });

  it('returns total independently from page size', () => {
    const result = catalogPage(seedVideos, { query: '', category: 'all', sort: 'recent', page: 2, pageSize: 5 });
    assert.equal(result.total, 24);
    assert.equal(result.data.length, 5);
    assert.equal(result.page, 2);
  });
});
