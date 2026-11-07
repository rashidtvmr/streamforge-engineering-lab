import { useEffect, useState } from 'react';
import { platformRequest } from '../platform/client.ts';
import type { CatalogClient } from '../api/catalogClient.ts';
import type { Video } from '../domain/types.ts';
import { VideoCard } from './VideoCard.tsx';

type HistoryRecord = { videoId: string; progressSeconds: number; updatedAt: string };
export function HistoryPanel({ catalog, onWatch, savedIds, onToggleSaved }: {
  catalog: CatalogClient; onWatch(video: Video): void; savedIds: readonly string[]; onToggleSaved(id: string): void;
}) {
  const [items, setItems] = useState<Video[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    platformRequest<{ data: HistoryRecord[] }>('/history', { signal: controller.signal })
      .then(async ({ data }) => catalog.getMany(data.map((entry) => entry.videoId), controller.signal))
      .then(setItems)
      .catch((reason: unknown) => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'History unavailable'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [catalog, revision]);

  async function clearHistory() {
    try { await platformRequest('/history', { method: 'DELETE' }); setRevision((value) => value + 1); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not clear history'); }
  }
  return <section aria-label="Watch history" className="saved-library">
    <p className="eyebrow">KEEP WATCHING</p><h1>Watch history</h1>
    {error && <p role="alert" className="form-error">{error === 'SIGN_IN_REQUIRED' ? 'Sign in through Account to save watch history.' : error}</p>}
    {loading && <p role="status">Loading watch history…</p>}
    {!loading && !error && items.length === 0 && <p>Your watch history is empty.</p>}
    {items.length > 0 && <button type="button" className="action-button" onClick={() => { void clearHistory(); }}>Clear watch history</button>}
    <div className="video-grid">{items.map((video) => <VideoCard key={video.id} video={video} onWatch={onWatch} saved={savedIds.includes(video.id)} onToggleSaved={onToggleSaved} />)}</div>
  </section>;
}
