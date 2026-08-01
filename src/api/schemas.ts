/**
 * Schemas + types for the OPENCloud middleware API.
 *
 * Single source of truth. Every page imports from here.
 * Names mirror the REST contract in `docs/API.md`.
 */

import { z } from 'zod';

// ----- Auth / Me ------------------------------------------------
export const meSchema = z.object({
  id: z.string(),
  email: z.string(),
  full_name: z.string().nullable(),
  default_organization_id: z.string(),
  created_at: z.string().optional(),
});
export type Me = z.infer<typeof meSchema>;

// ----- System ---------------------------------------------------
export const gatewayInfoSchema = z.object({
  ok: z.boolean(),
  gateway_url: z.string(),
  latency_ms: z.number(),
  models: z.array(z.string()),
  agent_id: z.string(),
  agent_model: z.string().nullable(),
  error: z.string().nullable(),
});
export type GatewayInfo = z.infer<typeof gatewayInfoSchema>;

export const systemStatusSchema = z.object({
  middleware_version: z.string(),
  opencloud_workspace: z.string(),
  gateway: gatewayInfoSchema,
  supabase: z.object({
    configured: z.boolean(),
    url: z.string(),
    latency_ms: z.number(),
    error: z.string().nullable(),
  }),
  current_organization_id: z.string(),
  user_id: z.string(),
});
export type SystemStatus = z.infer<typeof systemStatusSchema>;

// ----- Company --------------------------------------------------
export const companySchema = z.object({
  id: z.string(),
  organization_id: z.string(),
  name: z.string(),
  brand: z.string().nullable(),
  domain: z.string().nullable(),
  country: z.string().nullable(),
  language: z.string(),
  sector: z.string().nullable(),
  employees: z.string().nullable(),
  description: z.string().nullable(),
  services: z.array(z.string()),
  products: z.array(z.string()),
  clients: z.array(z.string()),
  value_proposition: z.string().nullable(),
  mission: z.string().nullable(),
  vision: z.string().nullable(),
  values: z.array(z.string()),
  goals: z.array(z.string()),
  social_networks: z.record(z.string(), z.string()),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  address: z.string().nullable(),
  logo_url: z.string().nullable(),
  timezone: z.string(),
  primary_color: z.string(),
  secondary_color: z.string(),
  accent_color: z.string(),
  onboarding_status: z.enum(['pending', 'in_progress', 'completed', 'skipped']),
  onboarding_completed_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Company = z.infer<typeof companySchema>;

// ----- Corporate memory -----------------------------------------
export const corporateMemoryMetaSchema = z.object({
  id: z.string(),
  organization_id: z.string(),
  file_key: z.string(),
  title: z.string(),
  version: z.number(),
  updated_at: z.string(),
});
export type CorporateMemoryMeta = z.infer<typeof corporateMemoryMetaSchema>;

export const corporateMemorySchema = corporateMemoryMetaSchema.extend({
  content: z.string(),
  source_session_id: z.string().nullable(),
  created_at: z.string(),
});
export type CorporateMemory = z.infer<typeof corporateMemorySchema>;

// ----- Conversations --------------------------------------------
export const conversationSchema = z.object({
  id: z.string(),
  title: z.string(),
  department_key: z.string(),
  status: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Conversation = z.infer<typeof conversationSchema>;

export const messageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  status: z.string(),
  created_at: z.string(),
});
export type Message = z.infer<typeof messageSchema>;

// ----- Department Core (orchestration phase) --------------------
export const lifecycleSchema = z.enum([
  'installed',
  'available',
  'licensed',
  'activating',
  'active',
  'suspended',
  'error',
  'deactivating',
  'inactive',
]);
export type Lifecycle = z.infer<typeof lifecycleSchema>;

export const healthSchema = z.enum(['unknown', 'healthy', 'degraded', 'unhealthy']);
export type Health = z.infer<typeof healthSchema>;
export type DepartmentHealthApi = Health;

export const licenseSchema = z.object({
  id: z.string(),
  organization_id: z.string(),
  department_key: z.string(),
  plan: z.string(),
  status: z.enum(['trial', 'active', 'expired', 'revoked', 'suspended']),
  starts_at: z.string(),
  expires_at: z.string().nullable(),
  limits: z.record(z.string(), z.unknown()),
});
export type License = z.infer<typeof licenseSchema>;

export const companyDepartmentViewSchema = z.object({
  id: z.string(),
  organization_id: z.string(),
  department_key: z.string(),
  lifecycle: lifecycleSchema,
  health: healthSchema,
  configuration: z.record(z.string(), z.unknown()),
  activated_at: z.string().nullable(),
  deactivated_at: z.string().nullable(),
  last_error: z.string().nullable(),
  workspace_path: z.string().nullable(),
  installed_version: z.string().nullable(),
  activated_version: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type CompanyDepartmentView = z.infer<typeof companyDepartmentViewSchema>;

export const departmentCatalogEntrySchema = z.object({
  key: z.string(),
  name: z.string(),
  version: z.string(),
  category: z.string(),
  description: z.string(),
  icon: z.string(),
  manager_agent_id: z.string(),
  capabilities: z.array(z.string()),
  dependencies: z.array(z.string()),
  permissions: z.array(z.string()),
  configuration_schema: z.record(z.string(), z.unknown()),
  metadata: z.record(z.string(), z.unknown()),
  license: licenseSchema.nullable(),
  installation: companyDepartmentViewSchema.nullable(),
  manager: z
    .object({
      agent_id: z.string(),
      status: z.string(),
      last_seen_at: z.string(),
    })
    .nullable(),
  last_health: z
    .object({
      status: healthSchema,
      checked_at: z.string(),
      duration_ms: z.number().nullable(),
    })
    .nullable(),
});
export type DepartmentCatalogEntry = z.infer<typeof departmentCatalogEntrySchema>;

export const departmentDefinitionSchema = z.object({
  manifest: z.object({
    id: z.string(),
    key: z.string(),
    name: z.string(),
    version: z.string(),
    category: z.string(),
    description: z.string(),
    icon: z.string(),
    manager_agent_id: z.string(),
    capabilities: z.array(z.string()),
    dependencies: z.array(z.string()),
    permissions: z.array(z.string()),
    configuration_schema: z.record(z.string(), z.unknown()),
    compatibility_min: z.string(),
    healthcheck_enabled: z.boolean(),
    metadata: z.record(z.string(), z.unknown()),
  }),
  license: licenseSchema.nullable(),
  installation: companyDepartmentViewSchema.nullable(),
  manager: z
    .object({
      id: z.string(),
      agent_id: z.string(),
      role: z.string(),
      status: z.string(),
      last_seen_at: z.string(),
    })
    .nullable(),
  lastHealth: z
    .object({
      id: z.string(),
      status: healthSchema,
      checks: z.record(z.string(), z.unknown()),
      error: z.string().nullable(),
      checked_at: z.string(),
      duration_ms: z.number().nullable(),
    })
    .nullable(),
});
export type DepartmentDefinition = z.infer<typeof departmentDefinitionSchema>;

export const healthCheckResultSchema = z.object({
  organization_id: z.string(),
  department_key: z.string(),
  status: healthSchema,
  checks: z.array(
    z.object({
      name: z.string(),
      ok: z.boolean(),
      message: z.string(),
      duration_ms: z.number(),
    }),
  ),
  error: z.string().nullable(),
  duration_ms: z.number(),
  checked_at: z.string(),
});
export type HealthCheckResult = z.infer<typeof healthCheckResultSchema>;

// ----- Tasks ---------------------------------------------------
export const taskStatusSchema = z.enum([
  'queued',
  'assigned',
  'running',
  'waiting_approval',
  'completed',
  'failed',
  'cancelled',
  'expired',
]);
export type TaskStatus = z.infer<typeof taskStatusSchema>;

export const taskSchema = z.object({
  id: z.string(),
  organization_id: z.string(),
  company_id: z.string().nullable(),
  department_key: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  payload: z.record(z.string(), z.unknown()),
  result: z.record(z.string(), z.unknown()).nullable(),
  error: z.string().nullable(),
  status: taskStatusSchema,
  priority: z.number(),
  created_by_user: z.string().nullable(),
  assigned_agent: z.string().nullable(),
  source_agent: z.string().nullable(),
  target_agent: z.string().nullable(),
  correlation_id: z.string().nullable(),
  causation_id: z.string().nullable(),
  attempts: z.number(),
  max_attempts: z.number(),
  requires_approval: z.boolean(),
  approved_by: z.string().nullable(),
  approved_at: z.string().nullable(),
  idempotency_key: z.string().nullable(),
  metadata: z.record(z.string(), z.unknown()),
  started_at: z.string().nullable(),
  completed_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Task = z.infer<typeof taskSchema>;

// ----- Internal messages ---------------------------------------
export const internalMessageTypeSchema = z.enum([
  'task.requested',
  'task.accepted',
  'task.started',
  'task.progress',
  'task.completed',
  'task.failed',
  'task.cancelled',
  'task.approval_required',
  'task.approved',
  'task.rejected',
]);
export type InternalMessageType = z.infer<typeof internalMessageTypeSchema>;

export const internalMessageSchema = z.object({
  id: z.string(),
  organization_id: z.string(),
  type: internalMessageTypeSchema,
  source_agent: z.string(),
  target_agent: z.string(),
  department_key: z.string(),
  task_id: z.string().nullable(),
  payload: z.record(z.string(), z.unknown()),
  correlation_id: z.string().nullable(),
  causation_id: z.string().nullable(),
  created_at: z.string(),
});
export type InternalMessage = z.infer<typeof internalMessageSchema>;

// ----- Documents -----------------------------------------------
export const companyDocumentSchema = z.object({
  id: z.string(),
  organization_id: z.string(),
  uploaded_by: z.string(),
  filename: z.string(),
  mime_type: z.string(),
  file_size: z.number(),
  storage_path: z.string(),
  sha256: z.string(),
  status: z.enum(['uploaded', 'processing', 'indexed', 'failed']),
  metadata: z.record(z.string(), z.unknown()),
  uploaded_at: z.string(),
});
export type CompanyDocument = z.infer<typeof companyDocumentSchema>;

// ----- Aggregated Activity Feed --------------------------------
export interface ActivityFeedItem {
  id: string;
  at: string;
  kind: 'task' | 'message' | 'document' | 'system';
  title: string;
  subtitle?: string;
  departmentKey?: string;
  status?: string;
}
