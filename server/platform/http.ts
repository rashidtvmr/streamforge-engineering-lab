import type { IncomingMessage, ServerResponse } from 'node:http';
import type { DatabaseSync } from 'node:sqlite';

export type Context = {
  readonly db: DatabaseSync;
  readonly request: IncomingMessage;
  readonly response: ServerResponse;
  readonly url: URL;
};
export type Handler = (ctx: Context) => Promise<boolean> | boolean;

export class HttpError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(status: number, code: string) { super(code); this.status = status; this.code = code; }
}

export function respond(response: ServerResponse, status: number, body: unknown): void {
  response.statusCode = status;
  response.setHeader('content-type', 'application/json; charset=utf-8');
  response.setHeader('x-content-type-options', 'nosniff');
  response.setHeader('cache-control', 'no-store');
  response.end(JSON.stringify(body));
}

export async function readJson(request: IncomingMessage, maxBytes = 32768): Promise<Record<string, unknown>> {
  if (!(request.headers['content-type'] ?? '').startsWith('application/json')) {
    throw new HttpError(415, 'JSON_REQUIRED');
  }
  const parts: Buffer[] = [];
  let size = 0;
  for await (const piece of request) {
    const buffer = Buffer.isBuffer(piece) ? piece : Buffer.from(piece);
    size += buffer.length;
    if (size > maxBytes) throw new HttpError(413, 'BODY_TOO_LARGE');
    parts.push(buffer);
  }
  let value: unknown;
  try { value = JSON.parse(Buffer.concat(parts).toString('utf8')) as unknown; }
  catch { throw new HttpError(400, 'INVALID_JSON'); }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new HttpError(400, 'INVALID_JSON');
  }
  return value as Record<string, unknown>;
}

export function parseCookies(request: IncomingMessage): Map<string, string> {
  const cookies = new Map<string, string>();
  for (const cookie of (request.headers.cookie ?? '').split(';')) {
    const index = cookie.indexOf('=');
    if (index === -1) continue;
    cookies.set(cookie.slice(0, index).trim(), cookie.slice(index + 1).trim());
  }
  return cookies;
}

export function requireMethod(ctx: Context, method: string): boolean {
  if (ctx.request.method === method) return true;
  ctx.response.setHeader('allow', method);
  respond(ctx.response, 405, { error: 'METHOD_NOT_ALLOWED' });
  return false;
}
