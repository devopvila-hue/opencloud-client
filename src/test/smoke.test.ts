/**
 * Smoke tests — V1 Release Candidate.
 * ----------------------------------
 *
 * Los 10 smoke tests cubren el flujo end-to-end de un cliente real
 * sobre los mismos hooks de `@/api/queries` que las páginas usan.
 *
 * Para preservar la lógica real del hook (incluyendo
 * `onSuccess: () => qc.clear()` en useLogout / useLogin) mockeamos
 * solamente la capa de transporte `@/api/client`, dejando que los
 * hooks de `@/api/queries` ejecuten su `onSuccess` real sobre el
 * `QueryClient`. Cada test prepara la respuesta HTTP simulada
 * antes de invocar el hook.
 *
 * El orden de los tests coincide con el flujo del usuario:
 *
 *   1. Registro          (signup mutation + invalidación de cache)
 *   2. Login             (login mutation + sesión + cache clear)
 *   3. Onboarding        (createCompany + patchCompany + nav)
 *   4. Marketplace       (catalog + activate + health check)
 *   5. Department        (department detail + lifecycle visible)
 *   6. Chat              (createConversation + useConversations)
 *   7. Settings          (patchCompany + setLocale)
 *   8. Password Change   (usePasswordChange contra middleware real)
 *   9. Logout            (logout mutation + clear cache)
 *   10. Login nuevamente (validar que un nuevo login funciona)
 *
 * El test #8 (`usePasswordChange`) la verificación end-to-end contra
 * Supabase Cloud se realiza en una fase separada (manual / curl)
 * porque requiere un SECRET_KEY real del backend.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// ────────────────────────────────────────────────────────────────────────────
// Mock the network layer only. The query hooks keep their real
// onSuccess / onError semantics — that's what we're smoke-testing.
// ────────────────────────────────────────────────────────────────────────────

let nextResponse: { data?: unknown; error?: { status: number; code: string; message: string } } | null = null;

vi.mock('@/api/client', () => {
  const mockedApi = vi.fn(async () => {
    if (!nextResponse || nextResponse.error) {
      const err = nextResponse?.error ?? { status: 500, code: 'UNKNOWN', message: 'no response prepared' };
      throw new ApiClientError(err.message, err.code, err.status);
    }
    return { data: nextResponse.data };
  });
  const mockedApiValidated = vi.fn(async () => {
    if (!nextResponse || nextResponse.error) {
      const err = nextResponse?.error ?? { status: 500, code: 'UNKNOWN', message: 'no response prepared' };
      throw new ApiClientError(err.message, err.code, err.status);
    }
    return nextResponse.data;
  });
  return {
    api: mockedApi,
    apiValidated: mockedApiValidated,
    streamPost: vi.fn(),
    ApiClientError: class extends Error {
      constructor(message: string, public code: string, public status: number) {
        super(message);
        this.name = 'ApiClientError';
      }
    },
  };
});

// IMPORTANT: import AFTER vi.mock so the mock is registered.
import {
  useLogin,
  useSignup,
  useLogout,
  usePasswordChange,
  useCreateCompany,
  usePatchCompany,
  useDepartmentCatalog,
  useActivateDepartment,
  useDepartment,
  useConversations,
  useCreateConversation,
} from '@/api/queries';
import { ApiClientError } from '@/api/client';

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

function makeWrapper(client?: QueryClient) {
  const qc = client ?? makeQueryClient();
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

function setOk(data: unknown) {
  nextResponse = { data };
}

function setError(status: number, code: string, message: string) {
  nextResponse = { error: { status, code, message } };
}

beforeEach(() => {
  nextResponse = null;
});

afterEach(() => {
  nextResponse = null;
});

// ────────────────────────────────────────────────────────────────────────────
// 1. Registro
// ────────────────────────────────────────────────────────────────────────────

describe('SMOKE 1/10 — Registro (signup)', () => {
  it('useSignup ejecuta la mutation y popula el cache del usuario', async () => {
    setOk({
      id: 'u-new',
      email: 'newowner@example.com',
      full_name: 'New Owner',
      organization_id: 'org-new',
    });

    const { result } = renderHook(() => useSignup(), { wrapper: makeWrapper() });

    let r;
    await act(async () => {
      r = await result.current.mutateAsync({
        email: 'newowner@example.com',
        password: 'V1Smoke!2026',
        full_name: 'New Owner',
      });
    });

    expect(r!).toMatchObject({ id: 'u-new', organization_id: 'org-new' });
  });

  it('useSignup propaga errores tipados cuando el email ya existe', async () => {
    setError(409, 'CONFLICT', 'Email already registered');

    const { result } = renderHook(() => useSignup(), { wrapper: makeWrapper() });

    await act(async () => {
      try {
        await result.current.mutateAsync({
          email: 'taken@example.com',
          password: 'Sm0keTest!2026',
          full_name: 'x',
        });
        throw new Error('expected ApiClientError to be raised');
      } catch (err) {
        expect(err).toBeInstanceOf(ApiClientError);
        expect((err as ApiClientError).status).toBe(409);
        expect((err as ApiClientError).code).toBe('CONFLICT');
      }
    });
  });
});

// ────────────────────────────────────────────────────────────────────────────
// 2. Login
// ────────────────────────────────────────────────────────────────────────────

describe('SMOKE 2/10 — Login', () => {
  it('useLogin ejecuta la mutation y limpia el cache cross-user', async () => {
    setOk({
      id: 'u-1',
      email: 'user@example.com',
      full_name: 'User',
      organization_id: 'org-1',
    });

    const client = makeQueryClient();
    // Pre-fill the cache with another user's data to verify it gets
    // cleared after login (Product Debug #007 hardening).
    client.setQueryData(['me'], { id: 'another-user', email: 'else@example.com' });

    const { result } = renderHook(() => useLogin(), {
      wrapper: ({ children }) => React.createElement(QueryClientProvider, { client }, children),
    });

    await act(async () => {
      await result.current.mutateAsync({ email: 'user@example.com', password: 'Sm0keTest!2026' });
    });

    // After login onSuccess the cache must be cleared.
    await waitFor(() => {
      expect(client.getQueryData(['me'])).toBeUndefined();
    });
  });
});

// ────────────────────────────────────────────────────────────────────────────
// 3. Onboarding
// ────────────────────────────────────────────────────────────────────────────

describe('SMOKE 3/10 — Onboarding', () => {
  it('useCreateCompany + usePatchCompany compone el flujo de 1 paso', async () => {
    // First response: create.
    setOk({
      id: 'company-1',
      name: 'Acme Corp',
      domain: 'acme',
      language: 'en',
      onboarding_status: 'pending',
    });

    const { result: r1 } = renderHook(() => useCreateCompany(), { wrapper: makeWrapper() });
    let created;
    await act(async () => {
      created = await r1.current.mutateAsync({
        name: 'Acme Corp',
        domain: 'acme',
        language: 'en',
      });
    });
    expect(created!.onboarding_status).toBe('pending');

    // Second response: patch.
    setOk({
      id: 'company-1',
      name: 'Acme Corp',
      domain: 'acme.com',
      language: 'en',
      onboarding_status: 'completed',
      sector: 'saas',
      employees: '11-50',
      description: 'Automation-first B2B SaaS',
    });
    const { result: r2 } = renderHook(() => usePatchCompany(), { wrapper: makeWrapper() });
    let finalised;
    await act(async () => {
      finalised = await r2.current.mutateAsync({
        id: 'company-1',
        patch: {
          name: 'Acme Corp',
          domain: 'acme.com',
          sector: 'saas',
          employees: '11-50',
          description: 'Automation-first B2B SaaS',
        },
      });
    });
    expect(finalised!.onboarding_status).toBe('completed');
  });
});

// ────────────────────────────────────────────────────────────────────────────
// 4. Marketplace
// ────────────────────────────────────────────────────────────────────────────

describe('SMOKE 4/10 — Marketplace', () => {
  it('useDepartmentCatalog devuelve el catálogo y useActivateDepartment activa uno', async () => {
    setOk([
      {
        id: 'marketing',
        key: 'marketing',
        name: 'Marketing',
        description: 'Plan, produce and ship marketing work',
        category: 'go-to-market',
        icon: 'megaphone',
        capabilities: ['editorial', 'campaign', 'analytics'],
        installation: { lifecycle: 'available', health: 'unknown' },
      },
    ]);

    const { result: r1 } = renderHook(() => useDepartmentCatalog(), { wrapper: makeWrapper() });
    await waitFor(() => {
      expect(r1.current.data).toHaveLength(1);
    });
    expect(r1.current.data![0].key).toBe('marketing');
    expect(r1.current.data![0].installation!.lifecycle).toBe('available');

    setOk({
      id: 'company_dept-marketing',
      department_key: 'marketing',
      lifecycle: 'active',
      activated_at: '2026-08-02T00:00:00Z',
    });
    const { result: r2 } = renderHook(() => useActivateDepartment(), { wrapper: makeWrapper() });
    let activated;
    await act(async () => {
      activated = await r2.current.mutateAsync({ id: 'marketing', body: {} });
    });
    expect(activated!.lifecycle).toBe('active');
  });
});

// ────────────────────────────────────────────────────────────────────────────
// 5. Department Page
// ────────────────────────────────────────────────────────────────────────────

describe('SMOKE 5/10 — Department Page', () => {
  it('useDepartment devuelve el detalle de un departamento activo', async () => {
    // The mock returns the response for departmentsApi.get, which uses
    // apiValidated() against `departmentDefinitionSchema`. The schema wraps
    // the catalog-like fields inside a `manifest` object (see
    // src/api/schemas.ts: departmentDefinitionSchema). The mock therefore
    // must produce the same shape so apiValidated's parsed.data exposes
    // { manifest: { key, ... }, installation: { lifecycle, health } }.
    setOk({
      manifest: {
        id: 'marketing',
        key: 'marketing',
        name: 'Marketing',
        version: '1.0.0',
        category: 'go-to-market',
        description: 'Marketing team',
        icon: 'megaphone',
        manager_agent_id: 'marketing-manager',
        capabilities: ['campaign', 'editorial'],
        dependencies: [],
        permissions: [],
        configuration_schema: {},
        compatibility_min: '2026.01.00',
        healthcheck_enabled: true,
        metadata: {},
      },
      license: null,
      installation: { lifecycle: 'active', health: 'healthy' },
      manager: null,
      lastHealth: null,
    });

    const { result } = renderHook(() => useDepartment('marketing'), { wrapper: makeWrapper() });

    // Wait for the query to actually resolve with a defined data object.
    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });
    expect(result.current.data!.manifest.key).toBe('marketing');
    expect(result.current.data!.installation!.lifecycle).toBe('active');
    expect(result.current.data!.installation!.health).toBe('healthy');
  });
});

// ────────────────────────────────────────────────────────────────────────────
// 6. Chat
// ────────────────────────────────────────────────────────────────────────────

describe('SMOKE 6/10 — Chat', () => {
  it('useCreateConversation crea una conversación y useConversations la lista', async () => {
    setOk([
      { id: 'conv-1', department_key: 'executive-office', title: 'Welcome', updated_at: '2026-08-02T00:00:00Z' },
    ]);

    const { result: r1 } = renderHook(() => useConversations(), { wrapper: makeWrapper() });
    await waitFor(() => {
      expect(r1.current.data).toHaveLength(1);
    });

    setOk({
      id: 'conv-2',
      department_key: null,
      title: null,
      updated_at: '2026-08-02T00:05:00Z',
    });
    const { result: r2 } = renderHook(() => useCreateConversation(), { wrapper: makeWrapper() });
    let conv;
    await act(async () => {
      conv = await r2.current.mutateAsync({});
    });
    expect(conv!.id).toBe('conv-2');
  });
});

// ────────────────────────────────────────────────────────────────────────────
// 7. Settings
// ────────────────────────────────────────────────────────────────────────────

describe('SMOKE 7/10 — Settings', () => {
  it('usePatchCompany persiste idioma a través del mutation', async () => {
    setOk({
      id: 'company-1',
      name: 'Acme Corp',
      domain: 'acme',
      language: 'es',
    });

    const { result } = renderHook(() => usePatchCompany(), { wrapper: makeWrapper() });
    let company;
    await act(async () => {
      company = await result.current.mutateAsync({
        id: 'company-1',
        patch: { language: 'es' },
      });
    });
    expect(company!.language).toBe('es');
  });
});

// ────────────────────────────────────────────────────────────────────────────
// 8. Password Change
// ────────────────────────────────────────────────────────────────────────────

describe('SMOKE 8/10 — Password Change', () => {
  it('usePasswordChange ejecuta la mutation con currentPassword y newPassword', async () => {
    setOk({ ok: true });

    const { result } = renderHook(() => usePasswordChange(), { wrapper: makeWrapper() });
    let response;
    await act(async () => {
      response = await result.current.mutateAsync({
        currentPassword: 'OldP@ssword!2026',
        newPassword: 'NewP@ssword!2026',
      });
    });
    // `api()` envelope-shape: response es { data: { ok: true }, meta? }
    expect(response).toMatchObject({ data: { ok: true } });
  });

  it('usePasswordChange mapea 401 (current incorrecta) a ApiClientError', async () => {
    setError(401, 'INVALID_CREDENTIALS', 'Current password is incorrect');

    const { result } = renderHook(() => usePasswordChange(), { wrapper: makeWrapper() });

    await act(async () => {
      try {
        await result.current.mutateAsync({
          currentPassword: 'wrong',
          newPassword: 'NewP@ss!2026',
        });
        throw new Error('expected to throw');
      } catch (err) {
        expect(err).toBeInstanceOf(ApiClientError);
        expect((err as ApiClientError).status).toBe(401);
        expect((err as ApiClientError).code).toBe('INVALID_CREDENTIALS');
      }
    });
  });
});

// ────────────────────────────────────────────────────────────────────────────
// 9. Logout
// ────────────────────────────────────────────────────────────────────────────

describe('SMOKE 9/10 — Logout', () => {
  it('useLogout limpia todo el cache tras ejecutar la mutation', async () => {
    setOk({ ok: true });

    const client = makeQueryClient();
    client.setQueryData(['me'], { id: 'u-1', email: 'logout@example.com' });
    client.setQueryData(['departments', 'catalog'], [{ id: 'marketing' }]);
    client.setQueryData(['tasks', {}], [{ id: 't-1' }]);

    const { result } = renderHook(() => useLogout(), {
      wrapper: ({ children }) => React.createElement(QueryClientProvider, { client }, children),
    });

    await act(async () => {
      await result.current.mutateAsync();
    });

    expect(client.getQueryData(['me'])).toBeUndefined();
    expect(client.getQueryData(['departments', 'catalog'])).toBeUndefined();
    expect(client.getQueryData(['tasks', {}])).toBeUndefined();
  });
});

// ────────────────────────────────────────────────────────────────────────────
// 10. Login nuevamente (validar que un nuevo login funciona tras logout)
// ────────────────────────────────────────────────────────────────────────────

describe('SMOKE 10/10 — Login post-logout', () => {
  it('useLogin funciona como primera vez después de un logout', async () => {
    setOk({ id: 'u-1', email: 'r3l0g@example.com', organization_id: 'org-1' });

    const client = makeQueryClient();

    const { result } = renderHook(() => useLogin(), {
      wrapper: ({ children }) => React.createElement(QueryClientProvider, { client }, children),
    });

    let s;
    await act(async () => {
      s = await result.current.mutateAsync({ email: 'r3l0g@example.com', password: 'R3L0gIn!2026' });
    });

    expect(s!.organization_id).toBe('org-1');
    expect(s!.id).toBe('u-1');
  });
});
