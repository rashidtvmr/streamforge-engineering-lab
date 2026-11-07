import type { DatabaseSync } from 'node:sqlite';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { HttpError, respond, type Context, type Handler } from './http.ts';

const handlers: Handler[] = [];
export function registerPlatformHandler(handler: Handler): void { handlers.push(handler); }

export async function handlePlatformRequest(
  db: DatabaseSync,
  request: IncomingMessage,
  response: ServerResponse,
  url: URL,
  customHandlers = handlers,
): Promise<void> {
  const ctx: Context = { db, request, response, url };
  try {
    if (url.pathname === '/api/v1/ping') {
      respond(response, 200, { status: 'ok', storage: 'sqlite' });
      return;
    }
    for (const handler of customHandlers) if (await handler(ctx)) return;
    respond(response, 404, { error: 'NOT_FOUND' });
  } catch (error) {
    if (error instanceof HttpError) respond(response, error.status, { error: error.code });
    else {
      console.error('Platform route failed', error);
      respond(response, 500, { error: 'INTERNAL_ERROR' });
    }
  }
}
