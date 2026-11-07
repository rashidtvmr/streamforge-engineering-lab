import { useEffect, useState } from 'react';
import { platformRequest } from '../platform/client.ts';
export function RecentSearchesPanel({ onSearch }: { onSearch(value: string): void }) {
  const [items, setItems] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    platformRequest<{ data: string[] }>('/search/recent', { signal: controller.signal })
      .then(({ data }) => setItems(data))
      .catch((reason: unknown) => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Could not load searches'); });
    return () => controller.abort();
  }, [revision]);
  return <section className="saved-library" aria-label="Recent searches">
    <p className="eyebrow">YOUR PRIVATE SEARCH HISTORY</p><h1>Recent searches</h1>
    {error && <p role="alert">{error === 'SIGN_IN_REQUIRED' ? 'Sign in to see your recent searches.' : error}</p>}
    <ul className="subscriptions-list">{items.map((item) =>
      <li key={item}><button type="button" onClick={() => onSearch(item)}>{item}</button></li>)}</ul>
    {items.length > 0 && <button type="button" className="action-button" onClick={() => {
      void platformRequest('/search/recent', { method: 'DELETE' }).then(() => setRevision((value) => value + 1)).catch(() => setError('Could not clear recent searches'));
    }}>Clear searches</button>}
  </section>;
}
