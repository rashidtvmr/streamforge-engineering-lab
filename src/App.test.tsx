import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { App } from './App.tsx';
import type { CatalogClient } from './api/catalogClient.ts';
import { catalogPage } from './domain/catalog.ts';
import { seedVideos } from './domain/seed.ts';

function fakeClient(): CatalogClient {
  return {
    list: vi.fn(async (query: Parameters<CatalogClient['list']>[0]) => catalogPage(seedVideos, {
      query: '', category: 'all', sort: 'recent', page: 1, pageSize: 12, ...query,
    })),
    get: vi.fn(async (id: string) => {
      const video = seedVideos.find((item) => item.id === id);
      if (!video) throw new Error('Not found');
      return video;
    }),
  };
}

describe('video discovery journey', () => {
  it('loads an accessible grid with synthetic videos', async () => {
    render(<App catalog={fakeClient()} />);
    expect(screen.getByRole('heading', { name: /discover videos/i })).toBeVisible();
    expect(await screen.findByRole('button', { name: /watch react rendering at scale/i })).toBeVisible();
    expect(within(screen.getByRole('region', { name: 'Video results' })).getAllByRole('article')).toHaveLength(12);
  });

  it('filters by category through the same catalog boundary', async () => {
    render(<App catalog={fakeClient()} />);
    await screen.findByRole('button', { name: /watch react rendering at scale/i });
    fireEvent.click(screen.getByRole('button', { name: 'Science' }));
    expect(await screen.findByRole('button', { name: /watch the science of deep oceans/i })).toBeVisible();
    expect(screen.queryByRole('button', { name: /watch react rendering at scale/i })).not.toBeInTheDocument();
  });

  it('paginates without dropping prior results', async () => {
    render(<App catalog={fakeClient()} />);
    await screen.findByRole('button', { name: /watch react rendering at scale/i });
    fireEvent.click(screen.getByRole('button', { name: 'Load more videos' }));
    await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(24));
  });

  it('shows useful empty results and allows clearing filters', async () => {
    render(<App catalog={fakeClient()} />);
    await screen.findByRole('button', { name: /watch react rendering at scale/i });
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search videos' }), { target: { value: 'nonsense-search-term' } });
    expect(await screen.findByRole('heading', { name: 'No videos found' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(await screen.findByRole('button', { name: /watch react rendering at scale/i })).toBeVisible();
  });

  it('opens a watch view and returns to discovery', async () => {
    render(<App catalog={fakeClient()} />);
    fireEvent.click(await screen.findByRole('button', { name: /watch react rendering at scale/i }));
    expect(screen.getByRole('heading', { name: 'React rendering at scale' })).toBeVisible();
    expect(screen.getByLabelText('Video player: React rendering at scale')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '← Back to discovery' }));
    expect(screen.getByRole('heading', { name: 'Discover videos' })).toBeVisible();
  });

  it('reports fetch errors and permits an explicit retry', async () => {
    const client = fakeClient();
    const original = client.list;
    let first = true;
    const list = vi.fn(async (...args: Parameters<CatalogClient['list']>) => {
      if (first) { first = false; throw new Error('offline'); }
      return original(...args);
    });
    render(<App catalog={{ ...client, list }} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('offline');
    fireEvent.click(screen.getByRole('button', { name: 'Retry loading' }));
    expect(await screen.findByRole('button', { name: /watch react rendering at scale/i })).toBeVisible();
  });
});
