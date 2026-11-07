import type { DatabaseSync } from 'node:sqlite';

/** Public projection; never leak drafts into anonymous video browsing. */
export type PublishedVideo = {
  id: string; title: string; creator: string; description: string;
  category: 'engineering' | 'design' | 'product' | 'science';
  durationSeconds: number; views: number; publishedAt: string; mediaUrl?: string;
};
export function publicStudioVideos(db: DatabaseSync): PublishedVideo[] {
  const rows = db.prepare(`SELECT v.id,v.title,a.display_name AS creator,v.description,v.category,
    v.updated_at AS publishedAt,CASE WHEN v.media_blob IS NULL THEN NULL ELSE '/api/v1/media/'||v.id END AS mediaUrl FROM studio_videos v JOIN accounts a ON a.id=v.owner_id
    WHERE v.status='published' ORDER BY v.updated_at DESC,v.id LIMIT 500`).all() as PublishedVideo[];
  return rows.map((row) => ({ ...row, mediaUrl: row.mediaUrl ?? undefined, durationSeconds: 120, views: 0 }));
}
