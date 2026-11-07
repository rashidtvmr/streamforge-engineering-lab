import { useEffect, useState } from 'react';
import { platformRequest } from '../platform/client.ts';

type Counts = { likes: number; dislikes: number; mine: 'like' | 'dislike' | null };
export function ReactionBar({ videoId }: { videoId: string }) {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    platformRequest<Counts>(`/videos/${encodeURIComponent(videoId)}/reactions`, { signal: controller.signal })
      .then(setCounts)
      .catch((reason: unknown) => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Unable to load reactions'); });
    return () => controller.abort();
  }, [videoId, revision]);
  async function toggle(kind: 'like' | 'dislike') {
    setPending(true); setError('');
    try {
      await platformRequest(`/videos/${encodeURIComponent(videoId)}/reactions`, {
        method: counts?.mine === kind ? 'DELETE' : 'PUT',
        body: counts?.mine === kind ? undefined : { kind },
      });
      setRevision((value) => value + 1);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to react'); }
    finally { setPending(false); }
  }
  return <div className="reaction-bar" aria-label="Video reactions">
    <button type="button" disabled={pending} aria-pressed={counts?.mine === 'like'} onClick={() => { void toggle('like'); }}>Like · {counts?.likes ?? 0}</button>
    <button type="button" disabled={pending} aria-pressed={counts?.mine === 'dislike'} onClick={() => { void toggle('dislike'); }}>Dislike · {counts?.dislikes ?? 0}</button>
    {error && <span role="alert">{error === 'SIGN_IN_REQUIRED' ? 'Sign in through Account to react.' : error}</span>}
  </div>;
}
