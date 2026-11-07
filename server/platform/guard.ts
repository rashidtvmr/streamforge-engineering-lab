import { HttpError, type Context } from './http.ts';

/** Fixed-window limiter; an injectable clock makes boundary testing deterministic. */
export function createRateLimiter(limit: number, windowMs: number) {
  const buckets = new Map<string, { count: number; expires: number }>();
  return (key: string, now = Date.now()): boolean => {
    let bucket = buckets.get(key);
    if (!bucket || now >= bucket.expires) {
      if (buckets.size >= 1024) {
        for (const [name, previous] of buckets) if (now >= previous.expires) buckets.delete(name);
        if (buckets.size >= 1024) buckets.delete(buckets.keys().next().value!);
      }
      bucket = { count: 0, expires: now + windowMs };
      buckets.set(key, bucket);
    }
    bucket.count++;
    return bucket.count <= limit;
  };
}

const allowAuth = createRateLimiter(30, 60_000);
export function guardPlatformRequest(ctx: Context): void {
  const method = ctx.request.method ?? 'GET';
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) return;
  const origin = ctx.request.headers.origin;
  const host = ctx.request.headers.host;
  if (origin && (!host || (origin !== `http://${host}` && origin !== `https://${host}`))) {
    throw new HttpError(403, 'CROSS_ORIGIN_BLOCKED');
  }
  if (ctx.request.headers['sec-fetch-site'] === 'cross-site') throw new HttpError(403, 'CROSS_SITE_BLOCKED');
  if (method === 'POST' && (ctx.url.pathname === '/api/v1/accounts' || ctx.url.pathname === '/api/v1/session')) {
    const ip = ctx.request.socket.remoteAddress ?? 'unknown';
    if (!allowAuth(`${ip}:${ctx.url.pathname}`)) throw new HttpError(429, 'RATE_LIMITED');
  }
}
