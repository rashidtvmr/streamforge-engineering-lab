export type Candidate = { id: string; creator: string; views: number; publishedAt: string; category: string };
export function rankTrending<T extends Candidate>(videos: readonly T[], now = Date.now()): T[] {
  return [...videos].sort((a, b) => {
    const ageDays = (video: T) => Math.max(1, Math.max(0, now - Date.parse(video.publishedAt)) / 86400000);
    const score = (video: T) => video.views / Math.sqrt(ageDays(video) + 1);
    return score(b) - score(a) || a.id.localeCompare(b.id);
  });
}
export function rankForYou<T extends Candidate>(videos: readonly T[], subscriptions: readonly string[], watched: readonly string[]): T[] {
  const follows = new Set(subscriptions), seen = new Set(watched);
  const score = (video: T) => (follows.has(video.creator) ? 1000000 : 0) + (seen.has(video.id) ? -300000 : 300000) + Math.min(video.views, 100000);
  return [...videos].sort((a, b) => score(b) - score(a) || a.id.localeCompare(b.id));
}
