/**
 * Brain API client.
 *
 * Sprint P0 — Real Connection. Wraps the backend endpoints that
 * replace the previous mock analyzer:
 *
 *   GET    /api/v1/model-settings            → current setting (no key)
 *   PUT    /api/v1/model-settings            → upsert (api_key write-only)
 *   DELETE /api/v1/model-settings            → remove
 *   POST   /api/v1/model-settings/test       → test connection
 *   GET    /api/v1/model-settings/providers  → catalog
 *
 *   GET    /api/v1/business-brain            → snapshot
 *   PATCH  /api/v1/business-brain            → upsert
 *   POST   /api/v1/business-brain/analyze    → SSE (real analysis)
 *   POST   /api/v1/business-brain/next-question → SSE (real question)
 *   POST   /api/v1/business-brain/complete  → mark completed
 *
 * The portal localStorage cache is now a hint, NEVER a source of
 * truth. Reads always go to the backend first.
 */

import { api, ApiClientError, streamPost } from './client';

// ============================================================
// Model Settings
// ============================================================

export interface ProviderCatalogEntry {
  id: string;
  displayName: string;
  defaultModel: string;
  kind: 'gateway' | 'api_key' | 'local';
  isCustom?: boolean;
}

export interface ModelSettingPublic {
  id: string;
  organization_id: string;
  provider_id: string;
  display_name: string | null;
  model_id: string;
  base_url: string | null;
  api_key_fingerprint: string;
  last_tested_at: string | null;
  last_test_status: 'ok' | 'error' | null;
  last_test_error: string | null;
  created_at: string;
  updated_at: string;
  cipher_version: number;
}

export interface UpsertModelSettingBody {
  provider_id: string;
  display_name?: string | null;
  model_id?: string;
  base_url?: string | null;
  api_key?: string;
}

export async function getModelSetting(): Promise<ModelSettingPublic | null> {
  const res = await api<ModelSettingPublic | null>('/model-settings');
  return res.data;
}

export async function listModelProviders(): Promise<ProviderCatalogEntry[]> {
  const res = await api<ProviderCatalogEntry[]>('/model-settings/providers');
  return res.data;
}

export async function upsertModelSetting(
  body: UpsertModelSettingBody,
): Promise<ModelSettingPublic> {
  const res = await api<ModelSettingPublic>('/model-settings', {
    method: 'PUT',
    body,
  });
  return res.data;
}

export async function deleteModelSetting(): Promise<void> {
  await api('/model-settings', { method: 'DELETE' });
}

export async function testModelConnection(): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await api<{ ok: boolean; message: string }>('/model-settings/test', {
      method: 'POST',
    });
    return res.data;
  } catch (err) {
    if (err instanceof ApiClientError) {
      return { ok: false, message: err.message };
    }
    return { ok: false, message: 'No hemos podido conectar. Revisa la clave, el modelo o la URL.' };
  }
}

// ============================================================
// Business Brain
// ============================================================

export interface BrainMarket {
  sector: string | null;
  detectedAt: string | null;
  valueProposition: string | null;
  competitors: string[];
  digitalPresence: Array<{ platform: string; handle?: string }>;
  rawWebContent?: string | null;
  rawAnalysis?: string | null;
}

export interface BrainRecommendation {
  department: string;
  reason: string;
  priority?: 'primary' | 'secondary';
}

export interface BrainSnapshot {
  phase: 'welcome' | 'analyzing' | 'conversation' | 'integrations' | 'diagnosis' | 'completed';
  identity: {
    name?: string;
    domain?: string;
    country?: string;
    employees?: string;
  };
  market: BrainMarket;
  processes: Array<{
    description: string;
    category: string;
    signal: 'time-sink' | 'pain' | 'opportunity';
  }>;
  tools: { primary: string; connected: string[]; rejected: string[] } | null;
  objectives: { raw: string; reformulation: string; quarter: string | null } | null;
  priorities: { worriedAbout: string | null; successDefinition: string | null };
  recommendations: {
    primary: BrainRecommendation | null;
    secondary: BrainRecommendation | null;
    optional: Array<BrainRecommendation>;
    avoid: Array<BrainRecommendation>;
    rationale: string;
  };
  chosenDepartment: string | null;
  updatedAt: string;
  schemaVersion: 1;
}

export const EMPTY_BRAIN: BrainSnapshot = {
  phase: 'welcome',
  identity: {},
  market: {
    sector: null,
    detectedAt: null,
    valueProposition: null,
    competitors: [],
    digitalPresence: [],
  },
  processes: [],
  tools: null,
  objectives: null,
  priorities: { worriedAbout: null, successDefinition: null },
  recommendations: { primary: null, secondary: null, optional: [], avoid: [], rationale: '' },
  chosenDepartment: null,
  updatedAt: new Date().toISOString(),
  schemaVersion: 1,
};

export async function getBrain(): Promise<BrainSnapshot> {
  try {
    const res = await api<BrainSnapshot>('/business-brain');
    if (!res.data) return EMPTY_BRAIN;
    return res.data;
  } catch (err) {
    if (err instanceof ApiClientError && err.status === 404) return EMPTY_BRAIN;
    throw err;
  }
}

export async function patchBrain(patch: Partial<BrainSnapshot>): Promise<BrainSnapshot> {
  const res = await api<BrainSnapshot>('/business-brain', {
    method: 'PATCH',
    body: patch,
  });
  return res.data;
}

export async function completeBrain(chosenDepartment: string | null): Promise<BrainSnapshot> {
  const res = await api<BrainSnapshot>('/business-brain/complete', {
    method: 'POST',
    body: { chosenDepartment },
  });
  return res.data;
}

// ============================================================
// SSE streams
// ============================================================

export interface AnalyzeSseEvent {
  type: 'ready' | 'token' | 'done' | 'error' | 'cancelled';
  content?: string;
  ok?: boolean;
  error?: string | null;
}

export interface NextQuestionSseEvent {
  type: 'ready' | 'token' | 'done' | 'error' | 'cancelled';
  content?: string;
  ok?: boolean;
  error?: string | null;
}

/**
 * Start a real analysis stream. The handler is invoked for each
 * SSE event. Returns a Promise + a cancel() function. The caller
 * awaits the promise to know when the stream ended.
 */
export function streamAnalyzeWeb(
  identity: { name: string; domain: string; country: string; employees: string },
  handlers: {
    onReady?: () => void;
    onToken?: (token: string) => void;
    onDone?: (ok: boolean, error: string | null) => void;
    onError?: (err: Error) => void;
  },
  signal?: AbortSignal,
): { promise: Promise<void>; cancel: () => void } {
  let cancelled = false;
  const controller = new AbortController();
  const promise = streamPost(
    '/business-brain/analyze',
    { identity },
    {
      signal: controller.signal,
      onEvent: (evt) => {
        if (cancelled) return;
        const data = evt.data as Record<string, unknown> | null;
        const type = evt.event as AnalyzeSseEvent['type'];
        if (type === 'ready') {
          handlers.onReady?.();
        } else if (type === 'token') {
          handlers.onToken?.(typeof data?.content === 'string' ? data.content : '');
        } else if (type === 'done') {
          handlers.onDone?.(Boolean(data?.ok), typeof data?.error === 'string' ? data.error : null);
        } else if (type === 'error') {
          handlers.onError?.(new Error(typeof data?.error === 'string' ? data.error : 'unknown'));
        } else if (type === 'cancelled') {
          handlers.onDone?.(false, 'cancelled');
        }
      },
    },
  ).then(() => {
    if (!cancelled) return;
  });
  return {
    promise,
    cancel: () => {
      cancelled = true;
      controller.abort();
    },
  };
}

export function streamNextQuestion(
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  handlers: {
    onReady?: () => void;
    onToken?: (token: string) => void;
    onDone?: (content: string, ok: boolean, error: string | null) => void;
    onError?: (err: Error) => void;
  },
  signal?: AbortSignal,
): { promise: Promise<void>; cancel: () => void } {
  let cancelled = false;
  const controller = new AbortController();
  const promise = streamPost(
    '/business-brain/next-question',
    { history },
    {
      signal: controller.signal,
      onEvent: (evt) => {
        if (cancelled) return;
        const data = evt.data as Record<string, unknown> | null;
        const type = evt.event as NextQuestionSseEvent['type'];
        if (type === 'ready') {
          handlers.onReady?.();
        } else if (type === 'token') {
          handlers.onToken?.(typeof data?.content === 'string' ? data.content : '');
        } else if (type === 'done') {
          const content = typeof data?.content === 'string' ? data.content : '';
          handlers.onDone?.(content, Boolean(data?.ok), typeof data?.error === 'string' ? data.error : null);
        } else if (type === 'error') {
          handlers.onError?.(new Error(typeof data?.error === 'string' ? data.error : 'unknown'));
        } else if (type === 'cancelled') {
          handlers.onDone?.('', false, 'cancelled');
        }
      },
    },
  ).then(() => undefined);
  return {
    promise,
    cancel: () => {
      cancelled = true;
      controller.abort();
    },
  };
}