import type { Video } from '../domain/types.ts';
import { formatViews } from './VideoCard.tsx';
import { ReactionBar } from './ReactionBar.tsx';

interface WatchPanelProps {
  video: Video;
  onBack(): void;
  saved: boolean;
  onToggleSaved(): void;
}

// CC0 demo footage from MDN; synthetic catalog metadata is educational and unrelated to the footage.
const demoVideoUrl = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';

export function WatchPanel({ video, onBack, saved, onToggleSaved }: WatchPanelProps) {
  return (
    <section className="watch-layout" aria-label="Video details">
      <button type="button" className="back-button" onClick={onBack}>← Back to discovery</button>
      <div className="watch-grid">
        <div>
          <div className="player-shell">
            <video controls preload="metadata" src={demoVideoUrl} aria-label={`Video player: ${video.title}`} />
          </div>
          <h1 className="watch-title">{video.title}</h1>
          <button type="button" className="watch-save-button" aria-pressed={saved} onClick={onToggleSaved}>
            {saved ? '♥ Remove from watchlist' : '♡ Save video'}
          </button>
          <ReactionBar key={video.id} videoId={video.id} />
          <p className="watch-meta">{formatViews(video.views)} views · {video.creator} · {video.category}</p>
          <p className="watch-description">{video.description}</p>
        </div>
        <aside className="watch-aside">
          <p className="eyebrow">DEMO CONTENT</p>
          <h2>About this experience</h2>
          <p>Catalog information is synthetic and the player uses one shared CC0 demonstration video. The learning focus is component behavior, HTTP contracts and reliable test coverage.</p>
        </aside>
      </div>
    </section>
  );
}
