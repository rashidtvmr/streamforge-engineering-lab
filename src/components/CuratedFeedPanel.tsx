import { useEffect, useState } from 'react';
import { platformRequest } from '../platform/client.ts';
import type { Video } from '../domain/types.ts';
import { VideoCard } from './VideoCard.tsx';

export function CuratedFeedPanel({ kind, onWatch, savedIds, onToggleSaved }: {
  kind: 'trending' | 'for-you'; onWatch(video: Video): void; savedIds: readonly string[]; onToggleSaved(id: string): void;
}) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    platformRequest<{ data: Video[] }>(`/discover/${kind}`, { signal: controller.signal })
      .then((result) => setVideos(result.data))
      .catch((reason: unknown) => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Unable to load feed'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [kind]);
  return <section aria-label={kind === 'trending' ? 'Trending videos' : 'For you videos'} className="saved-library">
    <p className="eyebrow">EXPLORE YOUR NEXT FAVORITE</p>
    <h1>{kind === 'trending' ? 'Trending videos' : 'For you'}</h1>
    {loading && <p role="status">Loading recommendations…</p>}
    {error && <p role="alert">{error}</p>}
    <div className="video-grid">{videos.map((video) => <VideoCard key={video.id} video={video} onWatch={onWatch} saved={savedIds.includes(video.id)} onToggleSaved={onToggleSaved} />)}</div>
  </section>;
}
