import { useEffect, useState } from 'react';
import { createCatalogClient, type CatalogClient } from './api/catalogClient.ts';
import { VideoCard } from './components/VideoCard.tsx';
import { WatchPanel } from './components/WatchPanel.tsx';
import { categories, type Category, type SortOrder, type Video } from './domain/types.ts';

const defaultCatalog = createCatalogClient();
const categoryLabels: Record<Category | 'all', string> = {
  all: 'All videos', engineering: 'Engineering', design: 'Design', product: 'Product', science: 'Science',
};

interface AppProps { catalog?: CatalogClient }
interface Filters { query: string; category: Category | 'all'; sort: SortOrder }

export function App({ catalog = defaultCatalog }: AppProps) {
  const [filters, setFilters] = useState<Filters>({ query: '', category: 'all', sort: 'recent' });
  const [page, setPage] = useState(1);
  const [videos, setVideos] = useState<Video[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [watching, setWatching] = useState<Video | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let ignore = false;
    setLoading(true);
    setError('');
    catalog.list({ ...filters, page, pageSize: 12 }, controller.signal)
      .then((result) => {
        if (ignore) return;
        setVideos((previous) => page === 1 ? result.data : [...previous, ...result.data]);
        setTotal(result.total);
      })
      .catch((reason: unknown) => {
        if (!ignore) setError(reason instanceof Error ? reason.message : 'Unable to load videos');
      })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; controller.abort(); };
  }, [catalog, filters.query, filters.category, filters.sort, page, retry]);

  function changeFilters(changes: Partial<Filters>) {
    setVideos([]);
    setPage(1);
    setFilters((previous) => ({ ...previous, ...changes }));
  }

  return (
    <div className="app-frame">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="topbar">
        <button type="button" className="brand" onClick={() => setWatching(null)} aria-label="StreamForge home">
          <span className="brand-icon" aria-hidden="true">▶</span><span>Stream<span className="brand-accent">Forge</span></span>
        </button>
        <form role="search" className="search-form" onSubmit={(event) => event.preventDefault()}>
          <span aria-hidden="true">⌕</span>
          <input aria-label="Search videos" type="search" placeholder="Search videos, creators and topics" value={filters.query} onChange={(event) => changeFilters({ query: event.target.value })} />
          <kbd>/</kbd>
        </form>
        <span className="topbar-label">ENGINEERING LAB <span className="live-dot" /></span>
      </header>
      <div className="page-layout">
        <aside className="sidebar" aria-label="Primary navigation">
          <div className="side-section">
            <p className="side-heading">WORKSPACE</p>
            <button type="button" className="side-link side-link-active" onClick={() => setWatching(null)} aria-current={!watching ? 'page' : undefined}>
              <span aria-hidden="true">▦</span> Discover
            </button>
          </div>
          <div className="side-section side-feature">
            <p className="side-heading">ABOUT THIS BUILD</p>
            <p>Production engineering practices, one pull request at a time.</p>
            <span className="side-tag">React + TypeScript</span>
            <span className="side-tag">Test-driven</span>
          </div>
          <p className="sidebar-footer">STREAMFORGE © 2026</p>
        </aside>
        <main id="main-content" className="main-content">
          {watching ? (
            <WatchPanel video={watching} onBack={() => setWatching(null)} />
          ) : (
            <>
              <section className="hero" aria-label="Introduction">
                <div className="hero-copy">
                  <p className="eyebrow">EXPLORE • LEARN • BUILD</p>
                  <h1>Ideas worth <span>watching.</span></h1>
                  <p>Explore an experimental video platform built to demonstrate reliable, large-scale frontend and backend engineering.</p>
                </div>
                <span className="hero-decoration" aria-hidden="true">▶</span>
              </section>
              <div className="section-heading">
                <div><p className="eyebrow">CURATED FOR EXPLORERS</p><h2>Discover videos</h2></div>
                <label className="sort-label">Sort by
                  <select aria-label="Sort videos" value={filters.sort} onChange={(event) => changeFilters({ sort: event.target.value as SortOrder })}>
                    <option value="recent">Newest first</option><option value="popular">Most popular</option>
                  </select>
                </label>
              </div>
              <nav className="category-tabs" aria-label="Video categories">
                {(['all', ...categories] as Array<Category | 'all'>).map((category) => (
                  <button key={category} type="button" aria-pressed={filters.category === category} onClick={() => changeFilters({ category })}>
                    {categoryLabels[category]}
                  </button>
                ))}
              </nav>
              <div className="catalog-summary" aria-live="polite">
                {loading && videos.length === 0 ? 'Loading videos…' : `${total} videos found`}
              </div>
              {error && <div role="alert" className="error-panel"><p>Could not load videos: {error}</p><button type="button" onClick={() => setRetry((value) => value + 1)}>Retry loading</button></div>}
              {!loading && !error && videos.length === 0 && (
                <div className="empty-state"><h3>No videos found</h3><p>Try another search term or category.</p><button type="button" onClick={() => changeFilters({ query: '', category: 'all' })}>Clear filters</button></div>
              )}
              <section className="video-grid" aria-label="Video results">
                {videos.map((video) => <VideoCard key={video.id} video={video} onWatch={setWatching} />)}
              </section>
              {!error && videos.length > 0 && videos.length < total && (
                <div className="pagination"><button type="button" onClick={() => setPage((value) => value + 1)} disabled={loading}>
                  {loading ? 'Loading more…' : 'Load more videos'}
                </button></div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
