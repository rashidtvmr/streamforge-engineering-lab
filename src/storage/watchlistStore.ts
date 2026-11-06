import { sanitizeSavedIds } from '../domain/watchlist.ts';

const STORAGE_KEY = 'streamforge.saved.v1';
export interface WatchlistStore {
  read(): string[];
  write(ids: readonly string[]): void;
}

interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function createWatchlistStore(backend?: KeyValueStore): WatchlistStore {
  const getBackend = () => backend ?? (typeof window === 'undefined' ? undefined : window.localStorage);
  return {
    read() {
      try {
        const raw = getBackend()?.getItem(STORAGE_KEY);
        return raw ? sanitizeSavedIds(JSON.parse(raw) as unknown) : [];
      } catch {
        return [];
      }
    },
    write(ids) {
      try {
        getBackend()?.setItem(STORAGE_KEY, JSON.stringify(sanitizeSavedIds(ids)));
      } catch {
        // Private mode/quota errors are non-fatal: state remains usable in memory.
      }
    },
  };
}
