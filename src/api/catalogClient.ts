import { parseCatalogPage, parseVideo, parseVideoList } from '../contracts/catalog.ts';
import type { CatalogPage, CatalogQuery, Video } from '../domain/types.ts';

export interface CatalogClient {
  list(query: Partial<CatalogQuery>, signal?: AbortSignal): Promise<CatalogPage>;
  get(id: string, signal?: AbortSignal): Promise<Video>;
  getMany(ids: readonly string[], signal?: AbortSignal): Promise<Video[]>;
}

export function createCatalogClient(fetcher: typeof fetch = fetch): CatalogClient {
  return {
    async list(query, signal) {
      const parameters = new URLSearchParams();
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) parameters.set(key, String(value));
      }
      const response = await fetcher(`/api/videos?${parameters.toString()}`, { signal });
      if (!response.ok) throw new Error(`CATALOG_HTTP_${response.status}`);
      return parseCatalogPage(await response.json());
    },
    async getMany(ids, signal) {
      if (ids.length === 0) return [];
      const response = await fetcher(`/api/videos/lookup?ids=${encodeURIComponent(ids.join(','))}`, { signal });
      if (!response.ok) throw new Error(`VIDEO_LOOKUP_HTTP_${response.status}`);
      return parseVideoList(await response.json());
    },
    async get(id, signal) {
      const response = await fetcher(`/api/videos/${encodeURIComponent(id)}`, { signal });
      if (!response.ok) throw new Error(`VIDEO_HTTP_${response.status}`);
      return parseVideo(await response.json());
    },
  };
}
