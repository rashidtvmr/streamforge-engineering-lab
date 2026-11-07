import { useEffect, useState } from 'react';
import { platformRequest } from '../platform/client.ts';
type Notice = { id: string; kind: string; message: string; videoId: string; createdAt: string; readAt: string | null };
export function NotificationsPanel() {
  const [items, setItems] = useState<Notice[]>([]); const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    platformRequest<{ data: Notice[] }>('/notifications', { signal: controller.signal })
      .then(({ data }) => setItems(data))
      .catch((reason: unknown) => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Unable to load notifications'); });
    return () => controller.abort();
  }, [revision]);
  async function markRead(id: string) {
    try { await platformRequest(`/notifications/${id}`, { method: 'PATCH' }); setRevision((value) => value + 1); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not mark read'); }
  }
  async function clearAll() {
    try { await platformRequest('/notifications', { method: 'DELETE' }); setRevision((value) => value + 1); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not clear notifications'); }
  }
  return <section className="saved-library" aria-label="Notifications">
    <p className="eyebrow">YOUR ACTIVITY CENTER</p><h1>Notifications</h1>
    {error && <p role="alert">{error === 'SIGN_IN_REQUIRED' ? 'Sign in to see notifications.' : error}</p>}
    {items.length === 0 && !error && <p>No notifications yet. Subscribe to creators to hear about new videos.</p>}
    {items.length > 0 && <button type="button" className="action-button" onClick={() => { void clearAll(); }}>Clear all notifications</button>}
    <ul className="notification-list">{items.map((item) => <li key={item.id} className={item.readAt ? 'read' : ''}>
      <div><strong>{item.kind === 'published' ? 'New video' : 'New reply'}</strong><p>{item.message}</p></div>
      {!item.readAt && <button type="button" onClick={() => { void markRead(item.id); }}>Mark read</button>}
    </li>)}</ul>
  </section>;
}
