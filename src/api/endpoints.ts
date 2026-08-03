/**
 * Typed endpoint wrappers. The ONLY place we hit the network.
 * Every page consumes these through TanStack Query hooks.
 */

import { api, apiValidated, streamPost, type ApiSuccess, type SseEvent } from './client';
import {
  companySchema,
  corporateMemoryMetaSchema,
  corporateMemorySchema,
  departmentCatalogEntrySchema,
  departmentDefinitionSchema,
  companyDepartmentViewSchema,
  healthCheckResultSchema,
  internalMessageSchema,
  loginInputSchema,
  meSchema,
  sessionUserSchema,
  signupInputSchema,
  systemStatusSchema,
  taskSchema,
  type Company,
  type CompanyDepartmentView,
  type CorporateMemory,
  type CorporateMemoryMeta,
  type DepartmentCatalogEntry,
  type DepartmentDefinition,
  type HealthCheckResult,
  type InternalMessage,
  type LoginInput,
  type Me,
  type SessionUser,
  type SignupInput,
  type SystemStatus,
  type Task,
} from './schemas';
import { z } from 'zod';

// ----- Auth / Me -----------------------------------------------
export const authApi = {
  /**
   * POST /api/v1/auth/login — exchanges email+password for an
   * `opc_session` cookie. The cookie is HttpOnly so JS never sees
   * it; we only learn that the session is valid via the 200
   * response. After this returns we invalidate `useMe` to fetch the
   * fresh user record.
   *
   * Validation is performed by the middleware (loginSchema). The
   * client-side schema is best-effort — the middleware response is
   * the source of truth.
   *
   * IMPORTANT: the schema passed to apiValidated must match the
   * INNER payload ({ id, email, … }), not the wrapper. apiValidated
   * internally does `schema.safeParse(res.data)` where `res.data`
   * is the value returned by `api()` after stripping the envelope
   * (`{ data: T, meta?: … }`). Validating against the wrapper
   * schema (`{ data: SessionUser }`) here would always fail with
   * `Schema mismatch: Required` because the input has no `data`
   * property.
   */
  login: (input: LoginInput): Promise<SessionUser> => {
    // Re-validate locally to fail fast on obviously bad input.
    const body = loginInputSchema.parse(input);
    return apiValidated('/auth/login', sessionUserSchema, {
      method: 'POST',
      body,
    });
  },

  /**
   * POST /api/v1/auth/signup — creates a new account and immediately
   * signs the user in (sets the same `opc_session` cookie).
   *
   * Same schema choice as login(): validate the inner payload, not
   * the wrapper.
   */
  signup: (input: SignupInput): Promise<SessionUser> => {
    const body = signupInputSchema.parse(input);
    return apiValidated('/auth/signup', sessionUserSchema, {
      method: 'POST',
      body,
    });
  },

  me: (): Promise<Me> => apiValidated('/me', meSchema),
  logout: () => api<{ ok: true }>('/auth/logout', { method: 'POST' }),

  /**
   * POST /api/v1/auth/google/start — initiates the Google OAuth
   * flow. The middleware (Supabase Auth under the hood) returns
   * the consent URL the Portal must redirect the user to. After
   * the handshake, the middleware redirects back to the Portal
   * with a fresh `opc_session` cookie.
   */
  googleStart: async (input: { next: string }): Promise<{ url: string }> => {
    const r = await api<{ url: string }>('/auth/google/start', {
      method: 'POST',
      body: input,
    });
    return r.data;
  },

  /**
   * POST /api/v1/auth/password-reset/request — starts a password
   * recovery flow. The backend emails the user a one-time link.
   * The endpoint is intentionally fire-and-forget: the user is
   * always shown the same confirmation regardless of whether the
   * address exists (no email enumeration).
   */
  passwordResetRequest: async (input: { email: string }): Promise<{ ok: true }> => {
    const r = await api<{ ok: true }>('/auth/password-reset/request', {
      method: 'POST',
      body: input,
    });
    return r.data;
  },

  /**
   * POST /api/v1/auth/password-change — V1 BLOCKER 3.
   * Verifies the current password against Supabase Auth (via the
   * middleware's ANON client) and then updates the user record via
   * `auth.admin.updateUserById`. The new password is committed
   * immediately; the existing session cookie remains valid.
   *
   * Returns `{ ok: true }` on success. On failure surfaces the
   * server-provided error via `ApiClientError`.
   */
  passwordChange: (
    currentPassword: string,
    newPassword: string,
  ): Promise<ApiSuccess<{ ok: true }>> =>
    api<{ ok: true }>('/auth/password-change', {
      method: 'POST',
      body: { currentPassword, newPassword },
    }),
};

// ----- System -------------------------------------------------
export const systemApi = {
  status: (): Promise<SystemStatus> => apiValidated('/system/status', systemStatusSchema),
  health: () => api<{ status: string; service: string; version: string; time: string }>('/health'),
};

// ----- Company ------------------------------------------------
export const companyApi = {
  current: (): Promise<Company | null> =>
    api<Company | null>('/companies/current').then((r) => r.data),
  /**
   * POST /api/v1/companies — first-time provisioning of the
   * Company record bound 1:1 to the current organization. Used
   * by OnboardingPage to break the "no company → can't patch"
   * deadlock for fresh signups. The middleware guarantees
   * `name` is required; everything else is optional and gets
   * persisted verbatim.
   */
  create: (patch: Partial<Company> & { name: string }): Promise<Company> =>
    api<Company>('/companies', { method: 'POST', body: patch }).then((r) => r.data),
  patch: (id: string, patch: Partial<Company>): Promise<Company> =>
    api<Company>(`/companies/${id}`, { method: 'PATCH', body: patch }).then((r) => r.data),
  regenerateMemory: () =>
    api<{ generated: number; skipped: number; files: CorporateMemoryMeta[] }>(
      '/companies/current/corporate-memory/regenerate',
      { method: 'POST' },
    ).then((r) => r.data),
};

// ----- Corporate memory ---------------------------------------
export const memoryApi = {
  list: (): Promise<CorporateMemoryMeta[]> =>
    apiValidated('/companies/current/corporate-memory', z.array(corporateMemoryMetaSchema)),
  read: (key: string): Promise<CorporateMemory> =>
    apiValidated(`/companies/current/corporate-memory/${key}`, corporateMemorySchema),
};

// ----- Documents ----------------------------------------------
export const documentsApi = {
  list: () =>
    api<
      Array<{
        id: string;
        organization_id: string;
        uploaded_by: string;
        filename: string;
        mime_type: string;
        file_size: number;
        storage_path: string;
        sha256: string;
        status: 'uploaded' | 'processing' | 'indexed' | 'failed';
        metadata: Record<string, unknown>;
        uploaded_at: string;
      }>
    >('/companies/current/documents').then((r) => r.data),
  delete: (id: string) =>
    api<{ ok: true }>(`/companies/current/documents/${id}`, { method: 'DELETE' }).then((r) => r.data),
  upload: (params: { filename: string; mimeType: string; contentBase64: string }) =>
    api<{
      document: {
        id: string;
        uploaded_at: string;
        filename: string;
        mime_type: string;
        file_size: number;
        sha256: string;
        status: string;
        metadata: Record<string, unknown>;
        organization_id: string;
        uploaded_by: string;
        storage_path: string;
      };
      sha256: string;
      storage_path: string;
    }>('/companies/current/documents', { method: 'POST', body: params }).then((r) => r.data),
};

// ----- Conversations (chat) ------------------------------------
export interface ConversationSummary {
  id: string;
  title: string;
  department_key: string;
  status: string;
  created_at: string;
  updated_at: string;
}
export interface ConversationCreated {
  id: string;
  title: string;
  department_key: string;
  openclaw_session_reference: string | null;
}
export interface ChatMessageRecord {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  status: string;
  created_at: string;
}
export const conversationsApi = {
  list: (): Promise<ConversationSummary[]> =>
    api<ConversationSummary[]>('/conversations').then((r) => r.data),
  create: (title?: string, departmentKey?: string): Promise<ConversationCreated> =>
    api<ConversationCreated>('/conversations', {
      method: 'POST',
      body: { title, department_key: departmentKey },
    }).then((r) => r.data),
  get: (id: string): Promise<ConversationSummary> =>
    api<ConversationSummary>(`/conversations/${id}`).then((r) => r.data),
  delete: (id: string) =>
    api<{ ok: true }>(`/conversations/${id}`, { method: 'DELETE' }).then((r) => r.data),
  messages: (id: string): Promise<ChatMessageRecord[]> =>
    api<ChatMessageRecord[]>(`/conversations/${id}/messages`).then((r) => r.data),
  stream: (
    id: string,
    content: string,
    handlers: { onEvent: (e: SseEvent) => void; signal?: AbortSignal },
  ) => streamPost(`/conversations/${id}/messages`, { content }, handlers),
  stop: (id: string) =>
    api<{ ok: true }>(`/conversations/${id}/stop`, { method: 'POST' }).then((r) => r.data),
};

// ----- Departments core ----------------------------------------
export const departmentsApi = {
  catalog: (): Promise<DepartmentCatalogEntry[]> =>
    apiValidated('/departments-core/catalog', z.array(departmentCatalogEntrySchema)),
  get: (id: string): Promise<DepartmentDefinition> =>
    apiValidated(`/departments-core/${id}`, departmentDefinitionSchema),
  activate: (
    id: string,
    body: { configuration?: Record<string, unknown>; idempotencyKey?: string } = {},
  ): Promise<CompanyDepartmentView> =>
    apiValidated(`/departments-core/${id}/activate`, companyDepartmentViewSchema, {
      method: 'POST',
      body,
    }),
  deactivate: (id: string, reason?: string): Promise<CompanyDepartmentView> =>
    apiValidated(`/departments-core/${id}/deactivate`, companyDepartmentViewSchema, {
      method: 'POST',
      body: { reason },
    }),
  suspend: (id: string, reason?: string): Promise<CompanyDepartmentView> =>
    apiValidated(`/departments-core/${id}/suspend`, companyDepartmentViewSchema, {
      method: 'POST',
      body: { reason },
    }),
  resume: (id: string, reason?: string): Promise<CompanyDepartmentView> =>
    apiValidated(`/departments-core/${id}/resume`, companyDepartmentViewSchema, {
      method: 'POST',
      body: { reason },
    }),
  healthCheck: (id: string): Promise<HealthCheckResult> =>
    apiValidated(`/departments-core/${id}/health-check`, healthCheckResultSchema, {
      method: 'POST',
      body: { forceCheckGateway: true },
    }),
  updateConfig: (id: string, configuration: Record<string, unknown>): Promise<CompanyDepartmentView> =>
    apiValidated(`/departments-core/${id}/config`, companyDepartmentViewSchema, {
      method: 'PATCH',
      body: { configuration },
    }),
  grantLicense: (id: string, body: { plan?: string; idempotencyKey?: string } = {}) =>
    api<{ ok: true }>(`/departments-core/${id}/license`, { method: 'POST', body }).then((r) => r.data),
  revokeLicense: (id: string, reason?: string) =>
    api<{ ok: true }>(`/departments-core/${id}/license`, {
      method: 'DELETE',
      body: { reason },
    }).then((r) => r.data),
};

// ----- Tasks --------------------------------------------------
export interface CreateTaskPayload {
  departmentKey: string;
  title: string;
  description?: string;
  payload?: Record<string, unknown>;
  priority?: number;
  requiresApproval?: boolean;
  idempotencyKey?: string;
}
export const tasksApi = {
  list: (filters: { departmentKey?: string; status?: string; limit?: number } = {}): Promise<Task[]> => {
    const qs = new URLSearchParams();
    if (filters.departmentKey) qs.set('departmentKey', filters.departmentKey);
    if (filters.status) qs.set('status', filters.status);
    if (filters.limit) qs.set('limit', String(filters.limit));
    const q = qs.toString();
    return apiValidated(`/tasks${q ? `?${q}` : ''}`, z.array(taskSchema));
  },
  get: (id: string): Promise<Task> => apiValidated(`/tasks/${id}`, taskSchema),
  create: (body: CreateTaskPayload): Promise<{ task: Task; routedToManager: string }> =>
    api<{ task: Task; routedToManager: string }>('/tasks', { method: 'POST', body }).then((r) => r.data),
  cancel: (id: string, reason?: string): Promise<Task> =>
    apiValidated(`/tasks/${id}/cancel`, taskSchema, { method: 'POST', body: { reason } }),
  retry: (id: string, resetAttempts = false): Promise<Task> =>
    apiValidated(`/tasks/${id}/retry`, taskSchema, { method: 'POST', body: { resetAttempts } }),
  approve: (id: string, approve: boolean, note?: string): Promise<Task> =>
    apiValidated(`/tasks/${id}/approve`, taskSchema, { method: 'POST', body: { approve, note } }),
};

// ----- Internal messages --------------------------------------
export const messagesApi = {
  list: (filters: { departmentKey?: string; taskId?: string; limit?: number } = {}): Promise<InternalMessage[]> => {
    const qs = new URLSearchParams();
    if (filters.departmentKey) qs.set('departmentKey', filters.departmentKey);
    if (filters.taskId) qs.set('taskId', filters.taskId);
    if (filters.limit) qs.set('limit', String(filters.limit));
    const q = qs.toString();
    return apiValidated(`/internal-messages${q ? `?${q}` : ''}`, z.array(internalMessageSchema));
  },
};

// ----- Orchestration (Phase 6) ---------------------------------
export { orchestrationApi, type OrchestrationView, type DepartmentBusView } from './orchestration';
