/**
 * TanStack Query hooks. Single layer between components and endpoints.
 * Components never import `api` directly.
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import {
  authApi,
  companyApi,
  conversationsApi,
  departmentsApi,
  documentsApi,
  memoryApi,
  messagesApi,
  systemApi,
  tasksApi,
  type CreateTaskPayload,
} from './endpoints';
import type {
  Company,
  CompanyDocument,
  DepartmentCatalogEntry,
  DepartmentDefinition,
  InternalMessage,
  LoginInput,
  Me,
  SignupInput,
  SystemStatus,
  Task,
  CorporateMemoryMeta,
  CorporateMemory,
} from './schemas';
import type { ConversationSummary, ChatMessageRecord } from './endpoints';
import { orchestrationApi, orchestrationQueryKeys } from './orchestration';

// ----- Keys ----------------------------------------------------
export const queryKeys = {
  me: ['me'] as const,
  systemStatus: ['system', 'status'] as const,
  company: ['company', 'current'] as const,
  memoryList: ['memory', 'list'] as const,
  memoryFile: (key: string) => ['memory', 'file', key] as const,
  documents: ['documents'] as const,
  conversations: ['conversations'] as const,
  conversation: (id: string) => ['conversation', id] as const,
  messages: (conversationId: string) => ['messages', conversationId] as const,
  catalog: ['departments', 'catalog'] as const,
  department: (id: string) => ['departments', id] as const,
  tasks: (filters?: Record<string, unknown>) => ['tasks', filters ?? {}] as const,
  task: (id: string) => ['task', id] as const,
  internalMessages: (filters?: Record<string, unknown>) => ['internal-messages', filters ?? {}] as const,
};

// ----- Auth / Me ----------------------------------------------
export function useMe() {
  return useQuery<Me>({ queryKey: queryKeys.me, queryFn: authApi.me });
}

/**
 * POST /api/v1/auth/login — exchanges email+password for a session
 * cookie. On success we eagerly refresh `useMe` so the rest of the
 * app sees the new session without waiting for a refetch interval.
 *
 * The HttpOnly `opc_session` cookie is set by the middleware as a
 * `Set-Cookie` response header; browsers attach it automatically to
 * subsequent same-site requests. The LoginPage redirects the user
 * to the sanitized `next` destination once `useMe` resolves.
 */
export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: LoginInput) => authApi.login(input),
    onSuccess: () => {
      // Defense in depth (Product Debug #007): a previous user on
      // this browser could have left the query cache populated.
      // Wipe the whole thing so the freshly-signed-in user never
      // sees the previous user's company / tasks / me data.
      qc.clear();
      return qc.invalidateQueries({ queryKey: queryKeys.me });
    },
  });
}

/**
 * POST /api/v1/auth/signup — creates a new account and immediately
 * signs the user in (the middleware sets the same cookie as /login).
 */
export function useSignup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SignupInput) => authApi.signup(input),
    onSuccess: () => {
      // Same hardening as useLogin — sign-up is also a session
      // boundary. Wipe the cache so the freshly-created user
      // doesn't inherit any pre-existing query state.
      qc.clear();
      return qc.invalidateQueries({ queryKey: queryKeys.me });
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => qc.clear(),
  });
}

/**
 * POST /api/v1/auth/password-change — V1 BLOCKER 3.
 * Wires `authApi.passwordChange` to a mutation hook. On success the
 * session cookie remains valid; the user does not need to sign in
 * again with the new password. We intentionally do NOT clear the
 * query cache here (the data shown is still authoritative for the
 * current user — changing the password does not change identity).
 */
export function usePasswordChange() {
  return useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      authApi.passwordChange(currentPassword, newPassword),
  });
}

// ----- System --------------------------------------------------
export function useSystemStatus(options?: Partial<UseQueryOptions<SystemStatus>>) {
  return useQuery<SystemStatus>({
    queryKey: queryKeys.systemStatus,
    queryFn: systemApi.status,
    refetchInterval: 30_000,
    staleTime: 15_000,
    ...options,
  });
}

// ----- Company -------------------------------------------------
export function useCompany() {
  return useQuery<Company | null>({ queryKey: queryKeys.company, queryFn: companyApi.current });
}

/**
 * Hook variant that returns both the cached data AND an explicit
 * refetch handle. Used by OnboardingPage so the success path of
 * the create/patch mutation can wait for the refetch to settle
 * before navigating — without the OnboardingGuard bouncing the
 * user straight back to /onboarding with the stale `data: null`
 * (Product Debug #007).
 */
export function useCompanyWithRefetch() {
  const query = useQuery<Company | null>({
    queryKey: queryKeys.company,
    queryFn: companyApi.current,
  });
  return { data: query.data, isLoading: query.isLoading, refetch: query.refetch };
}

export function usePatchCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Company> }) => companyApi.patch(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.company });
    },
  });
}

/**
 * POST /api/v1/companies — creates the Company record for the
 * current organization. OnboardingPage uses this when the user
 * has no company yet (fresh signup / founder reset). Invalidates
 * `useCompany` on success so the OnboardingGuard immediately
 * sees the new record and lets the user through to the app.
 */
export function useCreateCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<Company> & { name: string }) => companyApi.create(patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.company });
    },
  });
}

export function useRegenerateMemory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: companyApi.regenerateMemory,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.memoryList });
    },
  });
}

// ----- Memory --------------------------------------------------
export function useMemoryList() {
  return useQuery<CorporateMemoryMeta[]>({ queryKey: queryKeys.memoryList, queryFn: memoryApi.list });
}

export function useMemoryFile(key: string | null) {
  return useQuery<CorporateMemory>({
    queryKey: key ? queryKeys.memoryFile(key) : ['memory', 'file', '__none__'],
    queryFn: () => memoryApi.read(key!),
    enabled: !!key,
  });
}

// ----- Documents -----------------------------------------------
export function useDocuments() {
  return useQuery<CompanyDocument[]>({ queryKey: queryKeys.documents, queryFn: documentsApi.list });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => documentsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.documents }),
  });
}

export function useUploadDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: documentsApi.upload,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.documents }),
  });
}

// ----- Conversations -------------------------------------------
export function useConversations() {
  return useQuery<ConversationSummary[]>({
    queryKey: queryKeys.conversations,
    queryFn: conversationsApi.list,
  });
}

export function useCreateConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ title, departmentKey }: { title?: string; departmentKey?: string }) =>
      conversationsApi.create(title, departmentKey),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.conversations }),
  });
}

export function useDeleteConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => conversationsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.conversations }),
  });
}

export function useMessages(conversationId: string | null) {
  return useQuery<ChatMessageRecord[]>({
    queryKey: conversationId ? queryKeys.messages(conversationId) : ['messages', '__none__'],
    queryFn: () => conversationsApi.messages(conversationId!),
    enabled: !!conversationId,
  });
}

// ----- Departments ---------------------------------------------
export function useDepartmentCatalog() {
  return useQuery<DepartmentCatalogEntry[]>({
    queryKey: queryKeys.catalog,
    queryFn: departmentsApi.catalog,
  });
}

export function useDepartment(id: string | null) {
  return useQuery<DepartmentDefinition>({
    queryKey: id ? queryKeys.department(id) : ['departments', '__none__'],
    queryFn: () => departmentsApi.get(id!),
    enabled: !!id,
  });
}

export function useActivateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body?: Parameters<typeof departmentsApi.activate>[1] }) =>
      departmentsApi.activate(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.catalog });
      qc.invalidateQueries({ queryKey: queryKeys.tasks() });
    },
  });
}

export function useDeactivateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      departmentsApi.deactivate(id, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.catalog }),
  });
}

export function useSuspendDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      departmentsApi.suspend(id, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.catalog }),
  });
}

export function useResumeDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      departmentsApi.resume(id, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.catalog }),
  });
}

export function useDepartmentHealthCheck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => departmentsApi.healthCheck(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.catalog }),
  });
}

export function useDepartmentConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, configuration }: { id: string; configuration: Record<string, unknown> }) =>
      departmentsApi.updateConfig(id, configuration),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.catalog }),
  });
}

export function useGrantLicense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body?: Parameters<typeof departmentsApi.grantLicense>[1] }) =>
      departmentsApi.grantLicense(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.catalog }),
  });
}

export function useRevokeLicense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      departmentsApi.revokeLicense(id, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.catalog }),
  });
}

// ----- Tasks --------------------------------------------------
export function useTasks(filters?: { departmentKey?: string; status?: string; limit?: number }) {
  return useQuery<Task[]>({
    queryKey: queryKeys.tasks(filters),
    queryFn: () => tasksApi.list(filters ?? {}),
    // The previous 10s polling caused 500s to repeat every interval
    // when the backend was unhealthy, flooding the console. We now
    // stop polling as soon as the query enters an error state
    // (TanStack Query's `refetchIntervalInBackground: false` plus
    // the conditional `refetchInterval` callback) so a single
    // transient 5xx doesn't snowball into a log-spam. The empty
    // array (no tasks yet) is the most common success case and
    // keeps polling — only errors pause it.
    refetchInterval: (query) => (query.state.error ? false : 10_000),
    refetchIntervalInBackground: false,
    retry: 1,
  });
}

export function useTask(id: string | null) {
  return useQuery<Task>({
    queryKey: id ? queryKeys.task(id) : ['task', '__none__'],
    queryFn: () => tasksApi.get(id!),
    enabled: !!id,
    refetchInterval: (q) => {
      const status = (q.state.data as Task | undefined)?.status;
      if (!status) return 5_000;
      return ['completed', 'failed', 'cancelled', 'expired'].includes(status) ? false : 3_000;
    },
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation<{ task: Task; routedToManager: string }, Error, CreateTaskPayload>({
    mutationFn: (body) => tasksApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useCancelTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      tasksApi.cancel(id, reason),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: queryKeys.task(vars.id) });
    },
  });
}

export function useRetryTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, resetAttempts }: { id: string; resetAttempts?: boolean }) =>
      tasksApi.retry(id, resetAttempts),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: queryKeys.task(vars.id) });
    },
  });
}

export function useApproveTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, approve, note }: { id: string; approve: boolean; note?: string }) =>
      tasksApi.approve(id, approve, note),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: queryKeys.task(vars.id) });
    },
  });
}

// ----- Internal messages --------------------------------------
export function useInternalMessages(filters?: {
  departmentKey?: string;
  taskId?: string;
  limit?: number;
}) {
  return useQuery<InternalMessage[]>({
    queryKey: queryKeys.internalMessages(filters),
    queryFn: () => messagesApi.list(filters ?? {}),
    refetchInterval: 8_000,
  });
}

// ============================================================
// Phase 6 — Orchestration queries
// ============================================================



export function useOrchestrations(status: 'open' | 'closed' | 'all' = 'open') {
  return useQuery({
    queryKey: orchestrationQueryKeys.list(status),
    queryFn: () => orchestrationApi.listOrchestrations(status),
    refetchInterval: 6_000,
  });
}

export function useOrchestration(id: string) {
  return useQuery({
    queryKey: orchestrationQueryKeys.detail(id),
    queryFn: () => orchestrationApi.getOrchestration(id),
    enabled: !!id,
    refetchInterval: 4_000,
  });
}

export function useOrchestrationSteps(id: string) {
  return useQuery({
    queryKey: orchestrationQueryKeys.steps(id),
    queryFn: () => orchestrationApi.getOrchestrationSteps(id),
    enabled: !!id,
    refetchInterval: 4_000,
  });
}

export function useExecutiveRoom() {
  return useQuery({
    queryKey: orchestrationQueryKeys.executiveRoom,
    queryFn: () => orchestrationApi.getExecutiveRoom(),
    refetchInterval: 6_000,
  });
}

export function useTimeline(opts: { orchestrationId?: string; conversationId?: string } = {}) {
  return useQuery({
    queryKey: orchestrationQueryKeys.timeline(opts),
    queryFn: () => orchestrationApi.getTimeline(opts),
    refetchInterval: 8_000,
  });
}

export function useCrossDepartmentStatus() {
  return useQuery({
    queryKey: orchestrationQueryKeys.crossDepartmentStatus,
    queryFn: () => orchestrationApi.getCrossDepartmentStatus(),
    refetchInterval: 8_000,
  });
}

export function useBusMessages(opts: {
  targetDepartment?: string;
  sourceDepartment?: string;
  orchestrationId?: string;
  correlationId?: string;
  limit?: number;
} = {}) {
  return useQuery({
    queryKey: orchestrationQueryKeys.bus(opts),
    queryFn: () => orchestrationApi.listBusMessages(opts),
    refetchInterval: 8_000,
  });
}

export function useWorkflows() {
  return useQuery({
    queryKey: orchestrationQueryKeys.workflows,
    queryFn: () => orchestrationApi.listWorkflows(),
  });
}

export function useCancelOrchestration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      orchestrationApi.cancelOrchestration(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orchestrations'] });
      qc.invalidateQueries({ queryKey: orchestrationQueryKeys.executiveRoom });
    },
  });
}

export function useEscalateOrchestration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      orchestrationApi.escalateOrchestration(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orchestrations'] });
      qc.invalidateQueries({ queryKey: orchestrationQueryKeys.executiveRoom });
    },
  });
}

export function useResumeOrchestration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) => orchestrationApi.resumeOrchestration(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orchestrations'] });
    },
  });
}

export function useRunWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      key,
      intent,
      title,
      priority,
    }: {
      key: string;
      intent: string;
      title?: string;
      priority?: number;
    }) => orchestrationApi.runWorkflow(key, { intent, title, priority }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orchestrations'] });
      qc.invalidateQueries({ queryKey: orchestrationQueryKeys.executiveRoom });
    },
  });
}
