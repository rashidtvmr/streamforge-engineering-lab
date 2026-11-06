import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { sanitizeSavedIds, toggleSaved } from '../../src/domain/watchlist.ts';
import { createWatchlistStore } from '../../src/storage/watchlistStore.ts';

describe('watchlist state and persistence invariants', () => {
  it('toggles membership without mutating original state', () => {
    const original = ['video-001'];
    const saved = toggleSaved(original, 'video-002');
    assert.deepEqual(saved, ['video-001', 'video-002']);
    assert.deepEqual(original, ['video-001']);
    assert.deepEqual(toggleSaved(saved, 'video-001'), ['video-002']);
  });

  it('sanitizes malicious, duplicate and excessive storage values', () => {
    const ids = Array.from({ length: 30 }, (_, i) => `video-${String(i + 1).padStart(3, '0')}`);
    assert.equal(sanitizeSavedIds([...ids, '<script>', 1, null, 'video-001']).length, 24);
    assert.deepEqual(sanitizeSavedIds(['video-002', 'video-002', 'video-001']), ['video-002', 'video-001']);
    assert.deepEqual(sanitizeSavedIds({ invalid: true }), []);
  });

  it('invariant: toggling the same id twice restores state', () => {
    for (let count = 0; count < 24; count += 1) {
      const ids = Array.from({ length: count }, (_, i) => `video-${String(i + 1).padStart(3, '0')}`);
      const id = 'video-024';
      assert.deepEqual(toggleSaved(toggleSaved(ids, id), id), ids);
    }
  });

  it('roundtrips durable storage, and recovers from malformed JSON', () => {
    const values = new Map<string, string>();
    const store = createWatchlistStore({
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => { values.set(key, value); },
    });
    store.write(['video-002', 'video-001', 'video-002']);
    assert.deepEqual(store.read(), ['video-002', 'video-001']);
    values.set('streamforge.saved.v1', '{broken');
    assert.deepEqual(store.read(), []);
  });
});
