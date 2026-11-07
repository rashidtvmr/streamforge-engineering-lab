import { useEffect, useState } from 'react';
import { platformRequest } from '../platform/client.ts';

export function SubscriptionsPanel({ explore }: { explore(creator: string): void }) {
  const [creators, setCreators] = useState<string[]>([]);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    platformRequest<{ data: { creator: string }[] }>('/subscriptions', { signal: controller.signal })
      .then((response) => setCreators(response.data.map((row) => row.creator)))
      .catch((reason: unknown) => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Unable to load subscriptions'); });
    return () => controller.abort();
  }, []);
  return <section className="saved-library" aria-label="Your subscriptions">
    <p className="eyebrow">YOUR CHANNELS</p><h1>Subscriptions</h1>
    {error && <p role="alert">{error === 'SIGN_IN_REQUIRED' ? 'Sign in through Account to view subscriptions.' : error}</p>}
    {!error && creators.length === 0 && <p>Follow a creator while watching a video to see them here.</p>}
    <ul className="subscriptions-list">{creators.map((creator) =>
      <li key={creator}><span className="creator-avatar">{creator.charAt(0)}</span><strong>{creator}</strong><button type="button" onClick={() => explore(creator)}>View videos</button></li>)}</ul>
  </section>;
}
