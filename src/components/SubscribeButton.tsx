import { useEffect, useState } from 'react';
import { platformRequest } from '../platform/client.ts';

export function SubscribeButton({ creator }: { creator: string }) {
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const path = `/creators/${encodeURIComponent(creator)}/subscription`;
  useEffect(() => {
    const controller = new AbortController();
    platformRequest<{ subscribed: boolean }>(path, { signal: controller.signal })
      .then((response) => setSubscribed(response.subscribed))
      .catch(() => {});
    return () => controller.abort();
  }, [path]);
  async function toggle() {
    setBusy(true); setError('');
    try {
      const result = await platformRequest<{ subscribed: boolean }>(path, { method: subscribed ? 'DELETE' : 'PUT' });
      setSubscribed(result.subscribed);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Subscription failed'); }
    finally { setBusy(false); }
  }
  return <div className="subscribe-controls">
    <button type="button" disabled={busy} aria-pressed={subscribed} onClick={() => { void toggle(); }}>{subscribed ? 'Subscribed ✓' : 'Subscribe to creator'}</button>
    {error && <span role="alert">{error === 'SIGN_IN_REQUIRED' ? 'Sign in to subscribe.' : error}</span>}
  </div>;
}
