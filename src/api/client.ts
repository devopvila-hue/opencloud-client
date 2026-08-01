/**
 * REST + SSE client for the OPENCloud middleware (/api/v1).
 *
 * This is the ONLY place the portal talks to the Core.
 * Components consume this through TanStack Query hooks (see `queries.ts`).
 *
 * Conventions:
 *  - Same-origin cookies carry the session (opc_session HttpOnly).
 *  - All errors normalize into ApiClientError with code + status.
 *  - Streaming endpoints return an async iterator of SSE events.
 */

import { z } from 'zod';

export interface ApiSuccess<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    request_id?: string;
    details?: Record<string, unknown>;
  };
}

export type ApiResult<T> = ApiSuccess<T> | ApiErrorBody;

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

const BASE = '/api/v1';

interface FetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  /** When true the request body is sent as raw string (SSE). */
  rawBody?: string;
}

export async function api<T>(
  path: string,
  opts: FetchOptions = {},
): Promise<ApiSuccess<T>> {
  const { body, rawBody, headers, ...rest } = opts;
  const finalHeaders: Record<string, string> = {
    accept: 'application/json',
    ...(headers as Record<string, string> | undefined),
  };
  let payload: BodyInit | undefined;
  if (rawBody !== undefined) {
    payload = rawBody;
  } else if (body !== undefined) {
    payload = JSON.stringify(body);
    finalHeaders['content-type'] = finalHeaders['content-type'] ?? 'application/json';
  }

  const res = await fetch(`${BASE}${path}`, {
    credentials: 'same-origin',
    headers: finalHeaders,
    ...rest,
    body: payload,
  });

  const ct = res.headers.get('content-type') ?? '';
  let parsed: ApiResult<T>;
  if (ct.includes('application/json')) {
    parsed = (await res.json()) as ApiResult<T>;
  } else {
    parsed = {
      error: {
        code: 'BAD_FORMAT',
        message: `Unexpected content-type ${ct}`,
      },
    };
  }

  if (!res.ok || 'error' in parsed) {
    const e = parsed as ApiErrorBody;
    throw new ApiClientError(
      e.error?.message ?? `HTTP ${res.status}`,
      e.error?.code ?? 'UNKNOWN',
      res.status,
      e,
    );
  }
  return parsed as ApiSuccess<T>;
}

// ----------------------------------------------------------------
// SSE — same protocol the Core uses. We parse events line-by-line.
// ----------------------------------------------------------------

export type SseEvent<D = unknown> = { event: string; data: D };

interface StreamHandlers {
  onEvent: (evt: SseEvent) => void;
  onError?: (err: unknown) => void;
  signal?: AbortSignal;
}

export async function streamPost(
  path: string,
  body: unknown,
  handlers: StreamHandlers,
): Promise<void> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'content-type': 'application/json',
      accept: 'text/event-stream',
    },
    body: JSON.stringify(body),
    signal: handlers.signal,
  });

  if (!res.ok || !res.body) {
    handlers.onEvent({
      event: 'error',
      data: { error: `HTTP ${res.status}`, content: '' },
    });
    handlers.onError?.(new ApiClientError(`HTTP ${res.status}`, 'HTTP_ERROR', res.status));
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const chunks = buffer.split('\n\n');
      buffer = chunks.pop() ?? '';
      for (const raw of chunks) {
        const lines = raw.split('\n').filter(Boolean);
        let event = 'message';
        let data: string | null = null;
        for (const line of lines) {
          if (line.startsWith('event:')) event = line.slice(6).trim();
          else if (line.startsWith('data:')) data = line.slice(5).trim();
        }
        if (data === null) continue;
        try {
          handlers.onEvent({ event, data: JSON.parse(data) });
        } catch {
          handlers.onEvent({ event, data: { raw: data } });
        }
      }
    }
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') {
      handlers.onEvent({ event: 'cancelled', data: { content: '' } });
      return;
    }
    handlers.onError?.(err);
  }
}

// ----------------------------------------------------------------
// Validation helpers — Zod-aware so we fail loud when the Core drifts.
// ----------------------------------------------------------------

export async function apiValidated<T>(
  path: string,
  schema: z.ZodType<T>,
  opts?: FetchOptions,
): Promise<T> {
  const res = await api<unknown>(path, opts);
  const parsed = schema.safeParse(res.data);
  if (!parsed.success) {
    throw new ApiClientError(
      `Schema mismatch on ${path}: ${parsed.error.issues[0]?.message ?? 'invalid'}`,
      'SCHEMA_MISMATCH',
      200,
      parsed.error.issues,
    );
  }
  return parsed.data;
}
