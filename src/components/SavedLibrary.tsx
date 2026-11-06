import type { Video } from '../domain/types.ts';
import { VideoCard } from './VideoCard.tsx';

interface SavedLibraryProps {
  videos: readonly Video[];
  hasSaved: boolean;
  loading: boolean;
  error: string;
  onWatch(video: Video): void;
  onRemove(id: string): void;
  onRetry(): void;
}

export function SavedLibrary({ videos, hasSaved, loading, error, onWatch, onRemove, onRetry }: SavedLibraryProps) {
  return (
    <section className="saved-library" aria-label="My library">
      <p className="eyebrow">PERSONAL COLLECTION</p>
      <h1>Saved videos</h1>
      <p className="saved-description">Keep track of videos you want to revisit. Your selection stays in this browser.</p>
      {loading && <p role="status">Loading your saved videos…</p>}
      {error && <div role="alert" className="error-panel"><p>Could not load your saved videos: {error}</p><button type="button" onClick={onRetry}>Retry saved videos</button></div>}
      {!loading && !error && videos.length === 0 && (
        <div className="empty-state"><h2>{hasSaved ? 'Some saved videos are unavailable' : 'Your watchlist is empty'}</h2><p>Save videos from Discover to build your collection.</p></div>
      )}
      <section className="video-grid" aria-label="Saved video results">
        {videos.map((video) => <VideoCard key={video.id} video={video} saved={true} onWatch={onWatch} onToggleSaved={onRemove} />)}
      </section>
    </section>
  );
}
