/**
 * OPENCloud Client Portal — Orchestration API (Phase 6)
 * Typed wrappers for the orchestration endpoints on the Core.
 */

import { api } from './client';

export interface OrchestrationStepView {
  id: string;
  organization_id: string;
  orchestration_id: string;
  sequence: number;
  step_id: string;
  title: string;
  description: string | null;
  department_key: string;
  target_agent: string | null;
  source_agent: string;
  execution_mode: 'sequential' | 'parallel' | 'conditional';
  conditional_on: string | null;
  depends_on: string[] | null;
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  status:
    | 'queued'
    | 'planning'
    | 'delegated'
    | 'running'
    | 'waiting'
    | 'review'
    | 'completed'
    | 'cancelled'
    | 'failed'
    | 'escalated';
  attempts: number;
  max_attempts: number;
  timeout_ms: number | null;
  started_at: string | null;
  completed_at: string | null;
  duration_ms: number | null;
  error: string | null;
  correlation_id: string;
  causation_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface OrchestrationView {
  id: string;
  organization_id: string;
  company_id: string | null;
  conversation_id: string | null;
  user_id: string | null;
  title: string;
  description: string | null;
  intent: string;
  status: OrchestrationStepView['status'];
  priority: number;
  departments: string[];
  plan: Array<Record<string, unknown>>;
  result: Record<string, unknown> | null;
  error: string | null;
  correlation_id: string;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DepartmentBusView {
  id: string;
  organization_id: string;
  company_id: string | null;
  conversation_id: string | null;
  orchestration_id: string | null;
  step_id: string | null;
  correlation_id: string;
  causation_id: string | null;
  source_department: string;
  target_department: string;
  source_agent: string;
  target_agent: string | null;
  priority: number;
  subject: string;
  payload: Record<string, unknown>;
  attachments: Array<Record<string, unknown>>;
  deadline_at: string | null;
  status: 'pending' | 'delivered' | 'read' | 'replied' | 'failed' | 'archived';
  delivered_at: string | null;
  read_at: string | null;
  replied_at: string | null;
  reply_reference: string | null;
  retries: number;
  last_error: string | null;
  audit_trail: Array<Record<string, unknown>>;
  created_at: string;
  updated_at: string;
}

export interface DepartmentLiveStatusView {
  id: string;
  organization_id: string;
  department_key: string;
  status: 'idle' | 'working' | 'waiting' | 'blocked' | 'review' | 'offline';
  health: 'unknown' | 'healthy' | 'degraded' | 'unhealthy';
  progress: number;
  current_task_id: string | null;
  current_orchestration_id: string | null;
  current_step_id: string | null;
  pending_tasks: number;
  completed_today: number;
  failed_today: number;
  avg_duration_ms: number | null;
  last_activity_at: string | null;
  metadata: Record<string, unknown>;
  updated_at: string;
}

export interface TimelineEventView {
  at: string;
  source: string;
  source_department: string;
  target: string | null;
  target_department: string | null;
  type: string;
  subject?: string;
  detail?: string;
  orchestration_id?: string | null;
  step_id?: string | null;
  bus_id?: string | null;
}

export interface ExecutiveRoomView {
  organization_id: string;
  generated_at: string;
  departments: DepartmentLiveStatusView[];
  active_orchestrations: OrchestrationView[];
  recent_bus_messages: DepartmentBusView[];
  pending_human_approvals: number;
  bottlenecks: Array<{
    department_key: string;
    reason: string;
    pending_tasks: number;
  }>;
  averages: {
    avg_duration_ms: number | null;
    success_rate: number;
  };
}

export interface WorkflowDefinitionView {
  id: string;
  organization_id: string | null;
  key: string;
  name: string;
  description: string | null;
  version: string;
  triggers: string[];
  steps: Array<Record<string, unknown>>;
  metadata: Record<string, unknown>;
  is_template: boolean;
  created_at: string;
  updated_at: string;
}

export interface CrossDepartmentStatusView {
  live_status: DepartmentLiveStatusView[];
  health_snapshots: Array<{
    department_key: string;
    status: string;
    checked_at: string;
  }>;
}

export const orchestrationQueryKeys = {
  list: (status: string) => ['orchestrations', status] as const,
  detail: (id: string) => ['orchestration', id] as const,
  steps: (id: string) => ['orchestration', id, 'steps'] as const,
  executiveRoom: ['executive-room'] as const,
  timeline: (opts: { orchestrationId?: string; conversationId?: string }) =>
    ['timeline', opts] as const,
  crossDepartmentStatus: ['cross-department-status'] as const,
  bus: (opts: Record<string, unknown>) => ['department-bus', opts] as const,
  workflows: ['workflows'] as const,
};

export const orchestrationApi = {
  listOrchestrations: (status: 'open' | 'closed' | 'all' = 'open', limit = 50) =>
    api<OrchestrationView[]>(
      `/orchestrations?status=${status}&limit=${limit}`,
    ).then((r) => r.data),
  getOrchestration: (id: string) =>
    api<OrchestrationView>(`/orchestrations/${id}`).then((r) => r.data),
  getOrchestrationSteps: (id: string) =>
    api<OrchestrationStepView[]>(`/orchestrations/${id}/steps`).then((r) => r.data),
  cancelOrchestration: (id: string, reason?: string) =>
    api<OrchestrationView>(`/orchestrations/${id}/cancel`, {
      method: 'POST',
      body: { reason },
    }).then((r) => r.data),
  escalateOrchestration: (id: string, reason: string) =>
    api<OrchestrationView>(`/orchestrations/${id}/escalate`, {
      method: 'POST',
      body: { reason },
    }).then((r) => r.data),
  resumeOrchestration: (id: string) =>
    api<OrchestrationView>(`/orchestrations/${id}/resume`, { method: 'POST' }).then(
      (r) => r.data,
    ),
  getExecutiveRoom: (): Promise<ExecutiveRoomView> =>
    api<ExecutiveRoomView>('/executive-room').then((r) => r.data),
  getTimeline: (opts: { orchestrationId?: string; conversationId?: string; limit?: number } = {}) => {
    const qs = new URLSearchParams();
    if (opts.orchestrationId) qs.set('orchestrationId', opts.orchestrationId);
    if (opts.conversationId) qs.set('conversationId', opts.conversationId);
    if (opts.limit) qs.set('limit', String(opts.limit));
    const q = qs.toString();
    return api<TimelineEventView[]>(`/timeline${q ? `?${q}` : ''}`).then((r) => r.data);
  },
  getCrossDepartmentStatus: (): Promise<CrossDepartmentStatusView> =>
    api<CrossDepartmentStatusView>('/cross-department-status').then((r) => r.data),
  listBusMessages: (opts: {
    targetDepartment?: string;
    sourceDepartment?: string;
    orchestrationId?: string;
    correlationId?: string;
    limit?: number;
  } = {}) => {
    const qs = new URLSearchParams();
    if (opts.targetDepartment) qs.set('targetDepartment', opts.targetDepartment);
    if (opts.sourceDepartment) qs.set('sourceDepartment', opts.sourceDepartment);
    if (opts.orchestrationId) qs.set('orchestrationId', opts.orchestrationId);
    if (opts.correlationId) qs.set('correlationId', opts.correlationId);
    if (opts.limit) qs.set('limit', String(opts.limit));
    const q = qs.toString();
    return api<DepartmentBusView[]>(`/department-bus${q ? `?${q}` : ''}`).then(
      (r) => r.data,
    );
  },
  listWorkflows: (): Promise<WorkflowDefinitionView[]> =>
    api<WorkflowDefinitionView[]>('/workflows').then((r) => r.data),
  runWorkflow: (key: string, body: { intent: string; title?: string; priority?: number }) =>
    api<{ workflow: WorkflowDefinitionView; orchestration_id: string }>(
      `/workflows/${key}/run`,
      { method: 'POST', body },
    ).then((r) => r.data),
};
