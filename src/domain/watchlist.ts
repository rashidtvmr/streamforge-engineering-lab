export const MAX_SAVED_VIDEOS = 24;
import { isVideoId } from './videoId.ts';

export function sanitizeSavedIds(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const values = input.filter((id): id is string => isVideoId(id));
  return [...new Set(values)].slice(0, MAX_SAVED_VIDEOS);
}

export function toggleSaved(ids: readonly string[], id: string): string[] {
  const safe = sanitizeSavedIds(ids);
  if (!isVideoId(id)) return safe;
  if (safe.includes(id)) return safe.filter((existing) => existing !== id);
  if (safe.length >= MAX_SAVED_VIDEOS) return safe;
  return [...safe, id];
}
