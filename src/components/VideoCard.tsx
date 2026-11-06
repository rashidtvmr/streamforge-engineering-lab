import type { Video } from '../domain/types.ts';

export function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function formatViews(views: number): string {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(views);
}

interface VideoCardProps {
  video: Video;
  onWatch(video: Video): void;
  saved: boolean;
  onToggleSaved(id: string): void;
}

export function VideoCard({ video, onWatch, saved, onToggleSaved }: VideoCardProps) {
  return (
    <article className="video-card">
      <button type="button" className="save-button" aria-pressed={saved} onClick={() => onToggleSaved(video.id)}
        aria-label={`${saved ? 'Remove' : 'Save'} ${video.title} ${saved ? 'from' : 'to'} watchlist`}>
        {saved ? '♥' : '♡'}
      </button>
      <button type="button" className="video-card-button" onClick={() => onWatch(video)} aria-label={`Watch ${video.title}`}>
        <span className={`video-poster category-${video.category}`} aria-hidden="true">
          <span className="poster-mark">{video.category.charAt(0).toUpperCase()}</span>
          <span className="poster-play">▶</span>
          <span className="duration">{formatDuration(video.durationSeconds)}</span>
        </span>
        <span className="video-card-info">
          <span className="creator-avatar" aria-hidden="true">{video.creator.charAt(0)}</span>
          <span className="video-card-copy">
            <span className="video-title">{video.title}</span>
            <span className="video-creator">{video.creator}</span>
            <span className="video-meta">{formatViews(video.views)} views · {video.category}</span>
          </span>
        </span>
      </button>
    </article>
  );
}
