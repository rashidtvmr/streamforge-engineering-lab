import { useEffect, useState } from 'react';
import { createCatalogClient, type CatalogClient } from './api/catalogClient.ts';
import { VideoCard } from './components/VideoCard.tsx';
import { WatchPanel } from './components/WatchPanel.tsx';
import { SavedLibrary } from './components/SavedLibrary.tsx';
import { AccountPanel } from './components/AccountPanel.tsx';
import { HistoryPanel } from './components/HistoryPanel.tsx';
import { SubscriptionsPanel } from './components/SubscriptionsPanel.tsx';
import { PlaylistPanel } from './components/PlaylistPanel.tsx';
import { SharedPlaylistPanel } from './components/SharedPlaylistPanel.tsx';
import { StudioPanel } from './components/StudioPanel.tsx';
import { CuratedFeedPanel } from './components/CuratedFeedPanel.tsx';
import { SearchSuggestions } from './components/SearchSuggestions.tsx';
import { RecentSearchesPanel } from './components/RecentSearchesPanel.tsx';
import { NotificationsPanel } from './components/NotificationsPanel.tsx';
import { platformRequest } from './platform/client.ts';
import { toggleSaved } from './domain/watchlist.ts';
import { createWatchlistStore, type WatchlistStore } from './storage/watchlistStore.ts';
import { categories, type Category, type SortOrder, type Video } from './domain/types.ts';

const defaultCatalog = createCatalogClient();
const defaultWatchlist = createWatchlistStore();
const categoryLabels: Record<Category | 'all', string> = {
  all: 'All videos', engineering: 'Engineering', design: 'Design', product: 'Product', science: 'Science',
};

interface AppProps { catalog?: CatalogClient; watchlist?: WatchlistStore }
interface Filters { query: string; category: Category | 'all'; sort: SortOrder }

export function App({ catalog = defaultCatalog, watchlist = defaultWatchlist }: AppProps) {
  const [filters, setFilters] = useState<Filters>({ query: '', category: 'all', sort: 'recent' });
  const [page, setPage] = useState(1);
  const [videos, setVideos] = useState<Video[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [watching, setWatching] = useState<Video | null>(null);
  const [view, setView] = useState<'discover' | 'saved' | 'account' | 'history' | 'subscriptions' | 'playlists' | 'shared' | 'studio' | 'trending' | 'for-you' | 'recent-searches' | 'notifications'>(() =>
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('playlist') ? 'shared' : 'discover'
  );
  const [savedIds, setSavedIds] = useState<string[]>(() => watchlist.read());
  const [savedVideos, setSavedVideos] = useState<Video[]>([]);
  const [savedLoading, setSavedLoading] = useState(false);
  const [savedError, setSavedError] = useState('');
  const [savedRetry, setSavedRetry] = useState(0);

  useEffect(() => watchlist.write(savedIds), [watchlist, savedIds]);
  useEffect(() => {
    if (view !== 'saved' || savedIds.length === 0) {
      setSavedVideos([]);
      setSavedError('');
      setSavedLoading(false);
      return;
    }
    const controller = new AbortController();
    let ignore = false;
    setSavedLoading(true);
    setSavedError('');
    catalog.getMany(savedIds, controller.signal)
      .then((items) => { if (!ignore) setSavedVideos(items); })
      .catch((reason: unknown) => { if (!ignore) setSavedError(reason instanceof Error ? reason.message : 'Unable to load collection'); })
      .finally(() => { if (!ignore) setSavedLoading(false); });
    return () => { ignore = true; controller.abort(); };
  }, [catalog, view, savedIds, savedRetry]);

  function goHome() { setWatching(null); setView('discover'); }
  function toggleVideo(id: string) { setSavedIds((previous) => toggleSaved(previous, id)); }
  function recordQuery(query: string) { if (query.trim()) void platformRequest('/search/recent', { method: 'POST', body: { query: query.slice(0, 80) } }).catch(() => {}); }
  function openVideo(video: Video) {
    setWatching(video);
    void platformRequest('/history', { method: 'POST', body: { videoId: video.id, progressSeconds: 0 } }).catch(() => {});
  }


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
        <button type="button" className="brand" onClick={goHome} aria-label="StreamForge home">
          <span className="brand-icon" aria-hidden="true">▶</span><span>Stream<span className="brand-accent">Forge</span></span>
        </button>
        <form role="search" className="search-form" onSubmit={(event) => { event.preventDefault(); recordQuery(filters.query); }}>
          <span aria-hidden="true">⌕</span>
          <input aria-label="Search videos" type="search" placeholder="Search videos, creators and topics" value={filters.query} onChange={(event) => { goHome(); changeFilters({ query: event.target.value }); }} />
          <kbd>/</kbd>
          <SearchSuggestions query={filters.query} onSelect={(title) => { changeFilters({ query: title }); setView('discover'); setWatching(null); recordQuery(title); }} />
        </form>
        <span className="topbar-label">ENGINEERING LAB <span className="live-dot" /></span>
        <button type="button" className="mobile-saved" aria-label="Open saved videos" onClick={() => { setWatching(null); setView('saved'); }}>♡ Saved</button>
        <button type="button" className="mobile-account" onClick={() => { setWatching(null); setView('account'); }}>Account</button>
      </header>
      <div className="page-layout">
        <aside className="sidebar" aria-label="Primary navigation">
          <div className="side-section">
            <p className="side-heading">WORKSPACE</p>
            <button type="button" className={`side-link ${view === 'discover' ? 'side-link-active' : ''}`} onClick={goHome} aria-current={view === 'discover' && !watching ? 'page' : undefined}>
              <span aria-hidden="true">▦</span> Discover
            </button>
            <button type="button" className={`side-link ${view === 'saved' ? 'side-link-active' : ''}`} aria-label="Saved videos" onClick={() => { setWatching(null); setView('saved'); }} aria-current={view === 'saved' && !watching ? 'page' : undefined}>
              <span aria-hidden="true">♡</span> Saved videos <span className="side-count">{savedIds.length}</span>
            </button>
            <button type="button" className={`side-link ${view === 'notifications' ? 'side-link-active' : ''}`} onClick={() => { setWatching(null); setView('notifications'); }}><span aria-hidden="true">♧</span> Notifications</button>
            <button type="button" className={`side-link ${view === 'recent-searches' ? 'side-link-active' : ''}`} onClick={() => { setWatching(null); setView('recent-searches'); }}><span aria-hidden="true">⌕</span> Recent searches</button>
            <button type="button" className={`side-link ${view === 'trending' ? 'side-link-active' : ''}`} onClick={() => { setWatching(null); setView('trending'); }}><span aria-hidden="true">↗</span> Trending</button>
            <button type="button" className={`side-link ${view === 'for-you' ? 'side-link-active' : ''}`} onClick={() => { setWatching(null); setView('for-you'); }}><span aria-hidden="true">★</span> For you</button>
            <button type="button" className={`side-link ${view === 'studio' ? 'side-link-active' : ''}`} onClick={() => { setWatching(null); setView('studio'); }}><span aria-hidden="true">✦</span> Creator Studio</button>
            <button type="button" className={`side-link ${view === 'playlists' ? 'side-link-active' : ''}`} onClick={() => { setWatching(null); setView('playlists'); }}><span aria-hidden="true">☷</span> Playlists</button>
            <button type="button" className={`side-link ${view === 'subscriptions' ? 'side-link-active' : ''}`} onClick={() => { setWatching(null); setView('subscriptions'); }}><span aria-hidden="true">▤</span> Subscriptions</button>
            <button type="button" className={`side-link ${view === 'history' ? 'side-link-active' : ''}`} onClick={() => { setWatching(null); setView('history'); }}><span aria-hidden="true">◷</span> Watch history</button>
            <button type="button" className={`side-link ${view === 'account' ? 'side-link-active' : ''}`} onClick={() => { setWatching(null); setView('account'); }} aria-current={view === 'account' ? 'page' : undefined}><span aria-hidden="true">♙</span> Account</button>
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
            <WatchPanel video={watching} onBack={() => setWatching(null)} saved={savedIds.includes(watching.id)} onToggleSaved={() => toggleVideo(watching.id)} />
          ) : view === 'notifications' ? (
            <NotificationsPanel />
          ) : view === 'recent-searches' ? (
            <RecentSearchesPanel onSearch={(query) => { changeFilters({ query }); setView('discover'); }} />
          ) : view === 'trending' || view === 'for-you' ? (
            <CuratedFeedPanel kind={view} onWatch={openVideo} savedIds={savedIds} onToggleSaved={toggleVideo} />
          ) : view === 'studio' ? (
            <StudioPanel />
          ) : view === 'shared' ? (
            <SharedPlaylistPanel playlistId={new URLSearchParams(window.location.search).get('playlist') ?? ''} catalog={catalog} onWatch={openVideo} savedIds={savedIds} onToggleSaved={toggleVideo} />
          ) : view === 'playlists' ? (
            <PlaylistPanel catalog={catalog} onWatch={openVideo} savedIds={savedIds} onToggleSaved={toggleVideo} />
          ) : view === 'subscriptions' ? (
            <SubscriptionsPanel explore={(creator) => { setWatching(null); changeFilters({ query: creator, category: 'all' }); setView('discover'); }} />
          ) : view === 'history' ? (
            <HistoryPanel catalog={catalog} onWatch={openVideo} savedIds={savedIds} onToggleSaved={toggleVideo} />
          ) : view === 'account' ? (
            <AccountPanel />
          ) : view === 'saved' ? (
            <SavedLibrary videos={savedVideos.filter((video) => savedIds.includes(video.id))} hasSaved={savedIds.length > 0} loading={savedLoading} error={savedError} onWatch={openVideo} onRemove={toggleVideo} onRetry={() => setSavedRetry((value) => value + 1)} />
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
                {videos.map((video) => <VideoCard key={video.id} video={video} saved={savedIds.includes(video.id)} onToggleSaved={toggleVideo} onWatch={openVideo} />)}
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
