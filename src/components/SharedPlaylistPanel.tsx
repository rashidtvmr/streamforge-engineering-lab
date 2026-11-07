import { useEffect, useState } from 'react';
import { platformRequest } from '../platform/client.ts';
import type { CatalogClient } from '../api/catalogClient.ts';
import type { Video } from '../domain/types.ts';
import { VideoCard } from './VideoCard.tsx';
import type { Playlist } from './PlaylistPanel.tsx';

export function SharedPlaylistPanel({ playlistId, catalog, onWatch, savedIds, onToggleSaved }: {
  playlistId: string; catalog: CatalogClient; onWatch(video: Video): void; savedIds: readonly string[]; onToggleSaved(id: string): void;
}) {
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    platformRequest<{ playlist: Playlist; data: { videoId: string }[] }>(`/shared-playlists/${encodeURIComponent(playlistId)}`, { signal: controller.signal })
      .then(async ({ playlist: data, data: items }) => {
        const resolved = await catalog.getMany(items.map((entry) => entry.videoId), controller.signal);
        if (!controller.signal.aborted) { setPlaylist(data); setVideos(resolved); }
      }).catch((reason: unknown) => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Unavailable'); });
    return () => controller.abort();
  }, [playlistId, catalog]);
  return <section aria-label="Shared playlist" className="saved-library">
    <p className="eyebrow">SHARED COLLECTION</p><h1>{playlist?.name ?? 'Shared playlist'}</h1>
    {error && <p role="alert">This playlist is private or unavailable.</p>}
    <div className="video-grid">{videos.map((video) => <VideoCard key={video.id} video={video} onWatch={onWatch} saved={savedIds.includes(video.id)} onToggleSaved={onToggleSaved} />)}</div>
    {!error && playlist && videos.length === 0 && <p>No videos in this playlist yet.</p>}
  </section>;
}
