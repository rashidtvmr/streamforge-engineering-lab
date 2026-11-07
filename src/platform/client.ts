export interface SessionUser { id: string; name: string; email: string }
export async function platformRequest<T>(path: string, options: { method?: string; body?: unknown; signal?: AbortSignal } = {}): Promise<T> {
  const response = await fetch(`/api/v1${path}`, {
    method: options.method ?? 'GET',
    headers: options.body === undefined ? undefined : { 'content-type': 'application/json' },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    credentials: 'same-origin', signal: options.signal,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'REQUEST_FAILED' })) as { error?: string };
    throw new Error(error.error ?? `HTTP_${response.status}`);
  }
  return response.json() as Promise<T>;
}
