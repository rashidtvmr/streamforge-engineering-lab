/** Seed IDs and published creator UUIDs share a public identifier contract. */
export const videoIdPattern = /^video-(?:[0-9]{3}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/;

export function isVideoId(input: unknown): input is string {
  return typeof input === 'string' && videoIdPattern.test(input);
}
