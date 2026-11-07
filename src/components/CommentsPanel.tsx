import { useEffect, useState, type FormEvent } from 'react';
import { platformRequest, type SessionUser } from '../platform/client.ts';

export type Comment = { id: string; videoId: string; parentId: string | null; body: string; author: string; authorId: string; createdAt: string; editedAt: string | null };

export function CommentsPanel({ videoId }: { videoId: string }) {
  const [items, setItems] = useState<Comment[]>([]);
  const [body, setBody] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [revision, setRevision] = useState(0);
  const [myId, setMyId] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [message, setMessage] = useState('');
  useEffect(() => {
    platformRequest<{ user: SessionUser | null }>('/me')
      .then(({ user }) => setMyId(user?.id ?? '')).catch(() => {});
  }, []);
  async function mutateComment(id: string, method: 'PATCH' | 'DELETE' | 'POST', body?: object) {
    try {
      await platformRequest(`/comments/${id}${method === 'POST' ? '/reports' : ''}`, { method, body });
      setEditing(null); setEditText(''); setMessage(method === 'POST' ? 'Report submitted' : '');
      setRevision((value) => value + 1);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to update comment'); }
  }
  useEffect(() => {
    const controller = new AbortController();
    platformRequest<{ data: Comment[] }>(`/videos/${encodeURIComponent(videoId)}/comments`, { signal: controller.signal })
      .then(({ data }) => setItems(data))
      .catch((reason: unknown) => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Unable to load comments'); });
    return () => controller.abort();
  }, [videoId, revision]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true); setError('');
    try {
      await platformRequest(`/videos/${encodeURIComponent(videoId)}/comments`, { method: 'POST', body: { body, ...(replyTo ? { parentId: replyTo } : {}) } });
      setBody(''); setReplyTo(null); setRevision((value) => value + 1);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to post'); }
    finally { setSaving(false); }
  }
  return <section className="comments-panel" aria-label="Comments">
    <h2>Comments</h2>
    {message && <p role="status">{message}</p>}
    {error && <p role="alert">{error === 'SIGN_IN_REQUIRED' ? 'Sign in through Account to comment.' : error}</p>}
    <form className="comment-form" onSubmit={(event) => { void submit(event); }}>
      {replyTo && <p>Replying to a comment <button type="button" onClick={() => setReplyTo(null)}>Cancel reply</button></p>}
      <label>Your comment<textarea required maxLength={1000} value={body} onChange={(event) => setBody(event.target.value)} /></label>
      <button type="submit" disabled={saving || !body.trim()}>Post comment</button>
    </form>
    <ul className="comment-list">{items.map((comment) =>
      <li key={comment.id} className={comment.parentId ? 'comment-reply' : ''}>
        <strong>{comment.author}</strong><p>{comment.body}</p>
        <button type="button" onClick={() => setReplyTo(comment.id)}>Reply</button>
        {myId && comment.authorId === myId ? <>
          <button type="button" onClick={() => { setEditing(comment.id); setEditText(comment.body); }}>Edit comment</button>
          <button type="button" onClick={() => { void mutateComment(comment.id, 'DELETE'); }}>Delete comment</button>
          {editing === comment.id && <div className="edit-comment">
            <label>Edit your comment<textarea maxLength={1000} value={editText} onChange={(event) => setEditText(event.target.value)} /></label>
            <button type="button" onClick={() => { void mutateComment(comment.id, 'PATCH', { body: editText }); }}>Save edit</button>
          </div>}
        </> : myId && <button type="button" onClick={() => { void mutateComment(comment.id, 'POST', { reason: 'spam' }); }}>Report comment</button>}
      </li>)}</ul>
    {!error && items.length === 0 && <p>Be the first to comment.</p>}
  </section>;
}
