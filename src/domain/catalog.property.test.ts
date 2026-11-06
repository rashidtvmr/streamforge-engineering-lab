import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { filterVideos, paginateVideos, sortVideos } from './catalog.ts';
import { seedVideos } from './seed.ts';

describe('generated catalog properties', () => {
  it('a filter only removes items, never invents or rearranges them', () => {
    fc.assert(fc.property(fc.string({ maxLength: 40 }), (query) => {
      const result = filterVideos(seedVideos, query, 'all');
      const offsets = result.map((video) => seedVideos.indexOf(video));
      expect(offsets.every((index) => index >= 0)).toBe(true);
      expect(offsets).toEqual([...offsets].sort((a, b) => a - b));
    }), { numRuns: 200 });
  });

  it('all valid page sizes reconstruct the full catalog', () => {
    fc.assert(fc.property(fc.integer({ min: 1, max: 40 }), (size) => {
      const pages = Array.from(
        { length: Math.ceil(seedVideos.length / size) },
        (_, i) => paginateVideos(seedVideos, i + 1, size),
      );
      expect(pages.flat()).toEqual(seedVideos);
    }), { numRuns: 100 });
  });

  it('ranking never mutates the caller-owned input', () => {
    fc.assert(fc.property(fc.constantFrom('popular', 'recent'), (sort) => {
      const before = [...seedVideos];
      sortVideos(before, sort);
      expect(before).toEqual(seedVideos);
    }), { numRuns: 20 });
  });
});
