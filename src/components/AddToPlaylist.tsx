import { useEffect, useState } from 'react';
import { platformRequest } from '../platform/client.ts';
import type { Playlist } from './PlaylistPanel.tsx';

export function AddToPlaylist({ videoId }: { videoId: string }) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selected, setSelected] = useState('');
  const [message, setMessage] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    platformRequest<{ data: Playlist[] }>('/playlists', { signal: controller.signal })
      .then(({ data }) => setPlaylists(data))
      .catch(() => {});
    return () => controller.abort();
  }, []);
  async function add() {
    try {
      await platformRequest(`/playlists/${selected}/items`, { method: 'POST', body: { videoId } });
      setMessage('Added to playlist');
    } catch (reason) { setMessage(reason instanceof Error ? reason.message : 'Unable to add video'); }
  }
  return <div className="add-playlist">
    <label>Add to playlist
      <select aria-label="Choose playlist" value={selected} onChange={(event) => setSelected(event.target.value)}>
        <option value="">Choose a playlist</option>{playlists.map((playlist) => <option key={playlist.id} value={playlist.id}>{playlist.name}</option>)}
      </select>
    </label>
    <button type="button" disabled={!selected} onClick={() => { void add(); }}>Add video</button>
    {message && <span role="status">{message}</span>}
  </div>;
}
