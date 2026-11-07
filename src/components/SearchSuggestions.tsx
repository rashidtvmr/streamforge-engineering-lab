import { useEffect, useState } from 'react';
import { platformRequest } from '../platform/client.ts';

export function SearchSuggestions({ query, onSelect }: { query: string; onSelect(value: string): void }) {
  const [items, setItems] = useState<string[]>([]);
  useEffect(() => {
    if (query.trim().length < 2) { setItems([]); return; }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      platformRequest<{ data: string[] }>(`/search/suggest?q=${encodeURIComponent(query.slice(0, 80))}`, { signal: controller.signal })
        .then(({ data }) => { if (!controller.signal.aborted) setItems(data); })
        .catch(() => { if (!controller.signal.aborted) setItems([]); });
    }, 200);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [query]);
  return items.length > 0 ? <aside className="search-suggestions" aria-label="Search suggestions">
    <ul>{items.map((title) => <li key={title}><button type="button" onClick={() => { onSelect(title); setItems([]); }}>Suggested: {title}</button></li>)}</ul>
  </aside> : null;
}
