import { useEffect, useState, type FormEvent } from 'react';
import { platformRequest } from '../platform/client.ts';
import { categories, type Category } from '../domain/types.ts';

export type StudioVideo = { id: string; title: string; description: string; category: Category; status: string; createdAt: string; updatedAt: string; mediaPath: string | null };

export function StudioPanel() {
  const [videos, setVideos] = useState<StudioVideo[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('engineering');
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [editing, setEditing] = useState<StudioVideo | null>(null);
  const [editTitle, setEditTitle] = useState('');
  async function upload(video: StudioVideo, file: File) {
    setError('');
    try {
      const response = await fetch(`/api/v1/studio/videos/${encodeURIComponent(video.id)}/media`, {
        method: 'PUT', headers: { 'content-type': 'video/mp4' }, body: file, credentials: 'same-origin',
      });
      if (!response.ok) {
        const body = await response.json() as { error?: string };
        throw new Error(body.error ?? `UPLOAD_HTTP_${response.status}`);
      }
      setRevision((value) => value + 1);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to upload media'); }
  }
  async function update(video: StudioVideo, changes: Partial<StudioVideo>) {
    try {
      await platformRequest(`/studio/videos/${video.id}`, { method: 'PATCH', body: changes });
      setEditing(null); setRevision((value) => value + 1); setError('');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not update video'); }
  }
  useEffect(() => {
    const controller = new AbortController();
    platformRequest<{ data: StudioVideo[] }>('/studio/videos', { signal: controller.signal })
      .then(({ data }) => setVideos(data))
      .catch((reason: unknown) => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Unable to load studio'); });
    return () => controller.abort();
  }, [revision]);
  async function create(event: FormEvent) {
    event.preventDefault(); setError('');
    try {
      await platformRequest('/studio/videos', { method: 'POST', body: { title, description, category } });
      setTitle(''); setDescription(''); setRevision((value) => value + 1);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to create draft'); }
  }
  return <section className="studio-panel" aria-label="Creator studio">
    <p className="eyebrow">CREATE • REVIEW • PUBLISH</p><h1>Creator Studio</h1>
    {error && <p role="alert">{error === 'SIGN_IN_REQUIRED' ? 'Sign in through Account to create videos.' : error}</p>}
    <form className="studio-form" onSubmit={(event) => { void create(event); }}>
      <h2>Create video draft</h2>
      <label>Video title<input required maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
      <label>Description<textarea maxLength={3000} value={description} onChange={(event) => setDescription(event.target.value)} /></label>
      <label>Category<select value={category} onChange={(event) => setCategory(event.target.value as Category)}>{categories.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
      <button type="submit">Create draft</button>
    </form>
    <h2>Your video drafts</h2>
    {videos.length === 0 && <p>No drafts yet. Create your first video above.</p>}
    <ul className="studio-video-list">{videos.map((video) => <li key={video.id}>
      <strong>{video.title}</strong><span>{video.category} · {video.status} · {video.mediaPath ? 'Media uploaded' : 'Demo playback'}</span>
      <label>Upload MP4 for {video.title} <input type="file" accept="video/mp4" aria-label={`Upload MP4 for ${video.title}`} onChange={(event) => {
        const file = event.target.files?.[0];
        if (file) void upload(video, file);
      }} /></label>
      <button type="button" onClick={() => { void update(video, { status: video.status === 'draft' ? 'published' : 'draft' }); }}>{video.status === 'draft' ? 'Publish video' : 'Unpublish video'}</button>
      <button type="button" onClick={() => { setEditing(video); setEditTitle(video.title); }}>Edit title</button>
      {editing?.id === video.id && <div className="studio-inline-edit">
        <label>Updated title<input maxLength={120} value={editTitle} onChange={(event) => setEditTitle(event.target.value)} /></label>
        <button type="button" onClick={() => { void update(video, { title: editTitle }); }}>Save title</button>
      </div>}
    </li>)}</ul>
  </section>;
}
