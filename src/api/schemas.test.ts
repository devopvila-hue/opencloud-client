import { describe, it, expect } from 'vitest';
import {
  companySchema,
  corporateMemoryMetaSchema,
  departmentCatalogEntrySchema,
  lifecycleSchema,
  healthSchema,
  taskSchema,
  taskStatusSchema,
  internalMessageTypeSchema,
  systemStatusSchema,
  sessionUserSchema,
  sessionResponseSchema,
  loginInputSchema,
} from '@/api/schemas';

describe('api schemas', () => {
  it('lifecycle accepts known states only', () => {
    expect(lifecycleSchema.parse('active')).toBe('active');
    expect(() => lifecycleSchema.parse('wat')).toThrow();
  });

  it('health accepts known states', () => {
    expect(healthSchema.parse('healthy')).toBe('healthy');
    expect(() => healthSchema.parse('green')).toThrow();
  });

  it('task status schema', () => {
    expect(taskStatusSchema.parse('queued')).toBe('queued');
    expect(() => taskStatusSchema.parse('in-progress')).toThrow();
  });

  it('internal message type schema', () => {
    expect(internalMessageTypeSchema.parse('task.completed')).toBe('task.completed');
    expect(() => internalMessageTypeSchema.parse('message.sent')).toThrow();
  });

  it('parses a minimal department catalog entry', () => {
    const entry = {
      key: 'growth',
      name: 'Growth',
      version: '1.1.0',
      category: 'revenue',
      description: 'Growth strategy.',
      icon: 'rocket',
      manager_agent_id: 'growth-manager',
      capabilities: ['strategy'],
      dependencies: [],
      permissions: ['tasks.create'],
      configuration_schema: {},
      metadata: {},
      license: null,
      installation: null,
      manager: null,
      last_health: null,
    };
    const parsed = departmentCatalogEntrySchema.parse(entry);
    expect(parsed.key).toBe('growth');
  });

  it('parses a minimal task', () => {
    const t = {
      id: '00000000-0000-0000-0000-000000000000',
      organization_id: '00000000-0000-0000-0000-000000000000',
      company_id: null,
      department_key: 'growth',
      title: 'T',
      description: null,
      payload: {},
      result: null,
      error: null,
      status: 'queued' as const,
      priority: 5,
      created_by_user: null,
      assigned_agent: null,
      source_agent: null,
      target_agent: null,
      correlation_id: null,
      causation_id: null,
      attempts: 0,
      max_attempts: 3,
      requires_approval: false,
      approved_by: null,
      approved_at: null,
      idempotency_key: null,
      metadata: {},
      started_at: null,
      completed_at: null,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    };
    expect(taskSchema.parse(t).status).toBe('queued');
  });

  it('parses a corporate memory meta', () => {
    const parsed = corporateMemoryMetaSchema.parse({
      id: 'm1',
      organization_id: 'o1',
      file_key: 'identity',
      title: 'Identity',
      version: 2,
      updated_at: '2025-01-01T00:00:00Z',
    });
    expect(parsed.version).toBe(2);
  });

  it('parses a minimal company', () => {
    const c = companySchema.parse({
      id: 'co',
      organization_id: 'org',
      name: 'Acme',
      brand: null,
      domain: null,
      country: null,
      language: 'en',
      sector: null,
      employees: null,
      description: null,
      services: [],
      products: [],
      clients: [],
      value_proposition: null,
      mission: null,
      vision: null,
      values: [],
      goals: [],
      social_networks: {},
      phone: null,
      email: null,
      address: null,
      logo_url: null,
      timezone: 'UTC',
      primary_color: '#000',
      secondary_color: '#111',
      accent_color: '#222',
      onboarding_status: 'pending',
      onboarding_completed_at: null,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    });
    expect(c.name).toBe('Acme');
  });

  it('systemStatus validates required fields', () => {
    expect(() =>
      systemStatusSchema.parse({
        middleware_version: '1',
        opencloud_workspace: '/tmp',
        gateway: { ok: true, gateway_url: 'http://x', latency_ms: 1, models: [], agent_id: 'a', agent_model: null, error: null },
        supabase: { configured: true, url: 'http://x', latency_ms: 1, error: null },
        current_organization_id: 'o',
        user_id: 'u',
      }),
    ).not.toThrow();
  });

  // ───────────────────────────────────────────────────────────
  // Regression for the "Schema mismatch on /auth/login: Required"
  // bug: the response envelope is `{ data: { id, email, … } }`.
  // The auth endpoints validate the INNER payload (`sessionUserSchema`)
  // because apiValidated unwraps the envelope before schema checking.
  // ───────────────────────────────────────────────────────────
  it('sessionUserSchema matches the inner login response payload', () => {
    const inner = {
      id: 'a326474f-e455-480e-a005-9dfd7b43417b',
      email: 'ada' + '@example.com',
      full_name: 'Ada',
      organization_id: '00000000-0000-0000-0000-000000000001',
    };
    expect(() => sessionUserSchema.parse(inner)).not.toThrow();
    const parsed = sessionUserSchema.parse(inner);
    expect(parsed.email).toBe('ada' + '@example.com');
  });

  it('sessionResponseSchema is the wrapper and requires the `data` key', () => {
    const wrapper = {
      data: {
        id: 'u1',
        email: 'ada' + '@example.com',
        full_name: null,
        organization_id: 'org1',
      },
    };
    expect(() => sessionResponseSchema.parse(wrapper)).not.toThrow();
    // Validating the inner payload against the wrapper schema must
    // fail with `Required` for the missing `data` key — this is
    // exactly the bug the production login flow hit.
    expect(() => sessionResponseSchema.parse({ ...wrapper.data })).toThrow(/Required/);
  });

  it('loginInputSchema accepts the canonical { email, password } payload', () => {
    expect(() =>
      loginInputSchema.parse({ email: 'ada' + '@example.com', password: 'correcthorse' }),
    ).not.toThrow();
    expect(() => loginInputSchema.parse({ email: 'not-an-email', password: 'x' })).toThrow();
    expect(() => loginInputSchema.parse({ email: 'ada' + '@example.com', password: 'short' })).toThrow();
  });
});
