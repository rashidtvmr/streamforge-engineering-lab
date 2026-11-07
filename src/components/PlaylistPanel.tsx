import { useEffect, useState, type FormEvent } from 'react';
import { platformRequest } from '../platform/client.ts';
import type { CatalogClient } from '../api/catalogClient.ts';
import type { Video } from '../domain/types.ts';
import { VideoCard } from './VideoCard.tsx';

export type Playlist = { id: string; name: string; visibility: string; createdAt: string };

export function PlaylistPanel({ catalog, onWatch, savedIds, onToggleSaved }: {
  catalog: CatalogClient; onWatch(video: Video): void; savedIds: readonly string[]; onToggleSaved(id: string): void;
}) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selected, setSelected] = useState<Playlist | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    platformRequest<{ data: Playlist[] }>('/playlists', { signal: controller.signal }).then(({ data }) => setPlaylists(data))
      .catch((reason: unknown) => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Unable to load playlists'); });
    return () => controller.abort();
  }, [revision]);
  useEffect(() => {
    if (!selected) { setVideos([]); return; }
    const controller = new AbortController();
    platformRequest<{ data: { videoId: string }[] }>(`/playlists/${selected.id}`, { signal: controller.signal })
      .then(({ data }) => catalog.getMany(data.map((entry) => entry.videoId), controller.signal))
      .then(setVideos)
      .catch((reason: unknown) => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Unable to load playlist'); });
    return () => controller.abort();
  }, [selected, catalog, revision]);
  async function create(event: FormEvent) {
    event.preventDefault();
    try {
      const result = await platformRequest<{ playlist: Playlist }>('/playlists', { method: 'POST', body: { name } });
      setName(''); setSelected(result.playlist); setRevision((value) => value + 1); setError('');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to create playlist'); }
  }
  async function setVisibility(visibility: 'private' | 'unlisted') {
    if (!selected) return;
    try {
      const response = await platformRequest<{ playlist: Playlist }>(`/playlists/${selected.id}`, { method: 'PATCH', body: { visibility } });
      setSelected(response.playlist); setRevision((value) => value + 1);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to share playlist'); }
  }
  async function move(index: number, distance: number) {
    if (!selected) return;
    const ids = videos.map((video) => video.id);
    const to = index + distance;
    if (to < 0 || to >= ids.length) return;
    [ids[index], ids[to]] = [ids[to]!, ids[index]!];
    try {
      await platformRequest(`/playlists/${selected.id}/order`, { method: 'PUT', body: { ids } });
      setRevision((value) => value + 1);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to reorder playlist'); }
  }
  async function removePlaylist() {
    if (!selected) return;
    await platformRequest(`/playlists/${selected.id}`, { method: 'DELETE' });
    setSelected(null); setRevision((value) => value + 1);
  }
  return <section className="saved-library" aria-label="Your playlists">
    <p className="eyebrow">ORGANIZE YOUR VIDEOS</p><h1>Playlists</h1>
    {error && <p role="alert">{error === 'SIGN_IN_REQUIRED' ? 'Sign in through Account to manage playlists.' : error}</p>}
    <form className="playlist-create" onSubmit={(event) => { void create(event); }}>
      <label>New playlist name <input value={name} onChange={(event) => setName(event.target.value)} required maxLength={80} /></label>
      <button type="submit">Create playlist</button>
    </form>
    <div className="playlist-layout">
      <nav aria-label="Playlist selection" className="playlist-list">{playlists.map((item) =>
        <button type="button" aria-pressed={selected?.id === item.id} key={item.id} onClick={() => setSelected(item)}>{item.name}</button>)}</nav>
      <div>{selected ? <><h2>{selected.name}</h2>
        <label className="share-toggle">Visibility
          <select aria-label="Playlist visibility" value={selected.visibility} onChange={(event) => { void setVisibility(event.target.value as 'private' | 'unlisted'); }}>
            <option value="private">Private</option><option value="unlisted">Unlisted (anyone with link)</option>
          </select>
        </label>
        {selected.visibility === 'unlisted' && <a href={`/?playlist=${selected.id}`}>Open shareable playlist link</a>}
        <button className="action-button" type="button" onClick={() => { void removePlaylist(); }}>Delete playlist</button>
        <div className="video-grid">{videos.map((video, index) => <div key={video.id}>
          <VideoCard video={video} saved={savedIds.includes(video.id)} onWatch={onWatch} onToggleSaved={onToggleSaved} />
          <div className="order-buttons"><button type="button" aria-label={`Move ${video.title} up`} disabled={index === 0} onClick={() => { void move(index, -1); }}>↑</button>
          <button type="button" aria-label={`Move ${video.title} down`} disabled={index === videos.length - 1} onClick={() => { void move(index, 1); }}>↓</button></div>
        </div>)}</div>
        {videos.length === 0 && <p>Open a video and add it to this playlist.</p>}</> : <p>Select a playlist to see its videos.</p>}</div>
    </div>
  </section>;
}
