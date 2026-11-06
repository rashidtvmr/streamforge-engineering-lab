import { describe, expect, it, vi } from 'vitest';
import { createCatalogClient } from './catalogClient.ts';

describe('catalog HTTP client boundary', () => {
  it('encodes search terms and parses valid responses', async () => {
    const fetcher = vi.fn(async () => new Response(
      JSON.stringify({ data: [], total: 0, page: 1, pageSize: 12 }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    ));
    const client = createCatalogClient(fetcher as typeof fetch);
    await expect(client.list({ query: 'a&b' })).resolves.toMatchObject({ total: 0 });
    expect(fetcher).toHaveBeenCalledWith('/api/videos?query=a%26b', { signal: undefined });
  });

  it('rejects schema-invalid server responses, even on HTTP 200', async () => {
    const fetcher = vi.fn(async () => new Response(
      JSON.stringify({ data: [], total: 'not a number', page: 1, pageSize: 12 }),
      { status: 200 },
    ));
    await expect(createCatalogClient(fetcher as typeof fetch).list({})).rejects.toThrow('INVALID_CATALOG_RESPONSE');
  });

  it('batch-loads saved videos through one HTTP call', async () => {
    const video = {
      id: 'video-001', title: 'React rendering at scale', creator: 'Systems Studio',
      description: 'Example', category: 'engineering', durationSeconds: 600,
      views: 10, publishedAt: '2026-10-01T12:00:00.000Z',
    };
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ data: [video] }), { status: 200 }));
    const result = await createCatalogClient(fetcher as typeof fetch).getMany(['video-001', 'video-002']);
    expect(result.map((item) => item.id)).toEqual(['video-001']);
    expect(fetcher).toHaveBeenCalledWith('/api/videos/lookup?ids=video-001%2Cvideo-002', { signal: undefined });
  });

  it('surfaces network-level HTTP errors', async () => {
    const fetcher = vi.fn(async () => new Response('{}', { status: 503 }));
    await expect(createCatalogClient(fetcher as typeof fetch).list({})).rejects.toThrow('CATALOG_HTTP_503');
  });
});
