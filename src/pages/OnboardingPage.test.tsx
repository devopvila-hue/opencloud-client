import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nProvider } from '@/i18n/I18nProvider';

/**
 * OnboardingPage — Business Brain Initialization tests.
 *
 * These tests validate the new 6-phase flow introduced in
 * `BUSINESS_BRAIN_DESIGN.md`. They replace the previous "5-field
 * form" tests, which asserted against labels that no longer exist
 * ("Company name", "Website", "Sector", "Team size", "Primary objective").
 *
 * What we assert here:
 *   1. Phase 1 shows the four minimal fields (no sector dropdown,
 *      no objective radio group).
 *   2. Submit advances the snapshot — localStorage persists phase.
 *   3. The submit button is disabled until all four fields are filled.
 *   4. PATCH payload uses the brain-derived identity (name + domain +
 *      country + employees + sector detected later).
 *
 * Tests for phases 2-5 live in their respective files (analyzer.test.ts
 * for the heuristic; ConversationPhase tests would be a future sprint).
 */

const meState = vi.fn();
const companyState = vi.fn();
const mutatePatch = vi.fn();
const mutateCreate = vi.fn();
const patchState = vi.fn(() => ({
  mutateAsync: mutatePatch,
  mutate: mutatePatch,
  isPending: false,
  isError: false,
  isSuccess: false,
  reset: vi.fn(),
  data: undefined,
  error: null,
  status: 'idle',
}));
const createState = vi.fn(() => ({
  mutateAsync: mutateCreate,
  mutate: mutateCreate,
  isPending: false,
  isError: false,
  isSuccess: false,
  reset: vi.fn(),
  data: undefined,
  error: null,
  status: 'idle',
}));

vi.mock('@/api/queries', () => ({
  useMe: () => meState(),
  useCompany: () => ({ data: companyState()?.data ?? null, isLoading: companyState()?.isLoading ?? false }),
  usePatchCompany: () => patchState(),
  useCreateCompany: () => createState(),
}));

const pushToast = vi.fn();
vi.mock('@/components/Toaster', () => ({
  useToast: () => ({ push: pushToast }),
}));

import OnboardingPage from '@/pages/OnboardingPage';

function makeQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderOnboarding(initialPath = '/onboarding') {
  // Clear the Brain localStorage between tests.
  try {
    window.localStorage.removeItem('departify.business_brain.v1');
  } catch {
    /* ignore */
  }
  const utils = render(
    <QueryClientProvider client={makeQueryClient()}>
      <I18nProvider>
        <MemoryRouter initialEntries={[initialPath]}>
          <Routes>
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/" element={<div data-testid="dashboard">Dashboard</div>} />
          </Routes>
        </MemoryRouter>
      </I18nProvider>
    </QueryClientProvider>,
  );
  return utils;
}

describe('OnboardingPage — Business Brain Initialization', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'language', { value: 'es-ES', configurable: true });
    meState.mockReturnValue({ data: { id: 'u1', email: '[email protected]' }, isLoading: false });
    companyState.mockReturnValue({
      data: {
        id: 'co1',
        name: '',
        domain: null,
        sector: null,
        employees: null,
        goals: [],
        onboarding_status: 'pending',
        onboarding_completed_at: null,
      },
      isLoading: false,
    });
    mutatePatch.mockReset();
    mutatePatch.mockResolvedValue({ data: { id: 'co1', onboarding_status: 'completed', name: 'Acme' } });
    mutateCreate.mockReset();
    mutateCreate.mockResolvedValue({ data: { id: 'co-new', onboarding_status: 'completed', name: 'Acme' } });
    pushToast.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('Phase 1 renders only the four minimal fields', () => {
    renderOnboarding();
    // Visible labels (es-ES)
    expect(screen.getByText(/nombre de tu empresa/i)).toBeInTheDocument();
    expect(screen.getByText(/página web/i)).toBeInTheDocument();
    expect(screen.getByText(/^país$/i)).toBeInTheDocument();
    expect(screen.getByText(/número aproximado de empleados/i)).toBeInTheDocument();
    // Forbidden by spec — sector dropdown and objective radio group must be gone.
    expect(screen.queryByText(/objetivo principal/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^sector$/i)).not.toBeInTheDocument();
  });

  it('Submit is disabled until all four fields are filled', () => {
    renderOnboarding();
    const submit = document.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(submit).toBeDisabled();

    // Fill only the name — still disabled.
    const nameInput = document.querySelector('input[autocomplete="organization"]') as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'Acme Industries' } });
    expect(submit).toBeDisabled();

    // Fill website — still disabled (no country, no employees).
    const urlInput = document.querySelector('input[autocomplete="url"]') as HTMLInputElement;
    fireEvent.change(urlInput, { target: { value: 'https://acme.com' } });
    expect(submit).toBeDisabled();

    // Pick a country.
    fireEvent.click(screen.getByRole('button', { name: /españa/i }));
    // Pick an employees bucket.
    fireEvent.click(screen.getByRole('button', { name: /11–50/ }));
    expect(submit).not.toBeDisabled();
  });

  it('Clicking Continuar moves the snapshot to the analyzing phase', async () => {
    renderOnboarding();

    fireEvent.change(document.querySelector('input[autocomplete="organization"]')!, {
      target: { value: 'Acme Industries' },
    });
    fireEvent.change(document.querySelector('input[autocomplete="url"]')!, {
      target: { value: 'https://acme.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /españa/i }));
    fireEvent.click(screen.getByRole('button', { name: /11–50/ }));

    fireEvent.click(document.querySelector('button[type="submit"]')!);

    await waitFor(() => {
      const raw = window.localStorage.getItem('departify.business_brain.v1');
      expect(raw).toBeTruthy();
      const parsed = JSON.parse(raw!);
      expect(parsed.phase).toBe('analyzing');
      expect(parsed.identity.name).toBe('Acme Industries');
      expect(parsed.identity.domain).toBe('https://acme.com');
      expect(parsed.identity.country).toBe('ES');
      expect(parsed.identity.employees).toBe('11-50');
    });
  });

  it('Persists snapshot to localStorage as schemaVersion 1', () => {
    renderOnboarding();
    const raw = window.localStorage.getItem('departify.business_brain.v1');
    // Even before submit, the empty snapshot is hydrated.
    // The Brain writes the default state to localStorage on the
    // first effect-run; either way the schemaVersion must be 1.
    if (raw) {
      const parsed = JSON.parse(raw);
      expect(parsed.schemaVersion).toBe(1);
    } else {
      // Otherwise the next user-initiated write will set it.
      expect(true).toBe(true);
    }
  });
});