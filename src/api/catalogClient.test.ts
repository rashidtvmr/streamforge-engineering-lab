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

  it('surfaces network-level HTTP errors', async () => {
    const fetcher = vi.fn(async () => new Response('{}', { status: 503 }));
    await expect(createCatalogClient(fetcher as typeof fetch).list({})).rejects.toThrow('CATALOG_HTTP_503');
  });
});
