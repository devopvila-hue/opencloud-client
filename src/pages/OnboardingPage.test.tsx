import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the queries module so we can drive me.data / company.data
// and spy on usePatchCompany / useCreateCompany.
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
  useCompany: () => companyState(),
  usePatchCompany: () => patchState(),
  useCreateCompany: () => createState(),
}));

// Toaster — stub toast.push so we can spy.
const pushToast = vi.fn();
vi.mock('@/components/Toaster', () => ({
  useToast: () => ({ push: pushToast }),
}));

import OnboardingPage from '@/pages/OnboardingPage';

function makeQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderOnboarding(initialPath = '/onboarding') {
  // Stub window.location.assign + .replace so we don't actually navigate.
  const originalLocation = window.location;
  Object.defineProperty(window, 'location', {
    writable: true,
    value: {
      ...originalLocation,
      assign: vi.fn(),
      replace: vi.fn(),
    },
  });

  const utils = render(
    <QueryClientProvider client={makeQueryClient()}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/" element={<div data-testid="dashboard">Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );

  return {
    ...utils,
    restore: () => {
      Object.defineProperty(window, 'location', { writable: true, value: originalLocation });
    },
  };
}

describe('OnboardingPage', () => {
  beforeEach(() => {
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
    mutatePatch.mockResolvedValue({
      data: { id: 'co1', onboarding_status: 'completed', name: 'Acme' },
    });
    mutateCreate.mockReset();
    mutateCreate.mockResolvedValue({
      data: { id: 'co-new', onboarding_status: 'completed', name: 'Acme' },
    });
    pushToast.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders the 5 required fields', () => {
    renderOnboarding();
    expect(screen.getByLabelText(/company name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/website/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/sector/i)).toBeInTheDocument();
    // The "Team size" and "Primary objective" sections use custom
    // <label> blocks (not the Field component) — query by text.
    expect(screen.getByText(/team size/i)).toBeInTheDocument();
    expect(screen.getByText(/primary objective/i)).toBeInTheDocument();
  });

  it('renders all 6 primary-objective options', () => {
    renderOnboarding();
    expect(screen.getByRole('button', { name: /Lead generation and sales pipeline/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Brand awareness and campaigns/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Organic search traffic and rankings/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Internal workflows and tooling/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Custom apps for the team/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Something else entirely/i })).toBeInTheDocument();
  });

  it('disables submit until all required fields are filled', () => {
    renderOnboarding();
    const submit = document.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(submit).toBeDisabled();
  });

  it('submits the canonical payload to usePatchCompany', async () => {
    const restore = renderOnboarding().restore;

    fireEvent.change(screen.getByLabelText(/company name/i), {
      target: { value: 'Acme Industries' },
    });
    fireEvent.change(screen.getByLabelText(/website/i), {
      target: { value: 'acme.example.com' },
    });
    fireEvent.change(screen.getByLabelText(/sector/i), {
      target: { value: 'Technology' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^11–50$/ }));
    fireEvent.click(screen.getByRole('button', { name: /Lead generation and sales pipeline/i }));

    const submit = document.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(submit).not.toBeDisabled();
    fireEvent.click(submit);

    await waitFor(() => expect(mutatePatch).toHaveBeenCalled());

    const [arg] = mutatePatch.mock.calls[0] as [{ id: string; patch: Record<string, unknown> }];
    expect(arg.id).toBe('co1');
    expect(arg.patch).toMatchObject({
      name: 'Acme Industries',
      // 'acme.example.com' should be normalised to https://acme.example.com
      domain: 'https://acme.example.com',
      sector: 'Technology',
      employees: '11-50',
      goals: ['customers'],
      onboarding_status: 'completed',
    });
    expect(typeof arg.patch.onboarding_completed_at).toBe('string');

    // Successful submit triggers toast + redirect.
    expect(pushToast).toHaveBeenCalled();
    expect(window.location.assign).toHaveBeenCalledWith('/');

    restore();
  });

  it('does NOT hydrate from existing company data (re-edit goes through /company, not /onboarding)', () => {
    // The OnboardingPage is for fresh users only. If the user
    // already has a company record, the OnboardingGuard sees
    // onboarding_status='completed' and redirects to '/'. If the
    // record exists with status='pending', the user is intentionally
    // redoing onboarding from scratch — not restoring the previous
    // values, which would leak data across users if a stale cache
    // ever made it through (Product Debug #007).
    companyState.mockReturnValue({
      data: {
        id: 'co1',
        name: 'Existing Co',
        domain: 'existing.example.com',
        sector: 'Retail / E-commerce',
        employees: '2-10',
        goals: ['seo'],
        onboarding_status: 'pending',   // <-- the only state where OnboardingPage is shown with data
        onboarding_completed_at: null,
      },
      isLoading: false,
    });
    renderOnboarding();
    // Form starts EMPTY — the user must re-enter everything.
    expect((screen.getByLabelText(/company name/i) as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText(/website/i) as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText(/sector/i) as HTMLInputElement).value).toBe('');
  });

  it('POSTs to /companies when the user has no company yet (first-time onboarding)', async () => {
    // No company record exists — exactly the state right after
    // signup or a founder reset. Onboarding IS the provisioning
    // step; we must call useCreateCompany, not usePatchCompany.
    companyState.mockReturnValue({ data: null, isLoading: false });
    const restore = renderOnboarding().restore;

    fireEvent.change(screen.getByLabelText(/company name/i), {
      target: { value: 'Brand New Co' },
    });
    fireEvent.change(screen.getByLabelText(/website/i), {
      target: { value: 'new.example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /just me/i }));
    fireEvent.click(screen.getByRole('button', { name: /Custom apps for the team/i }));

    fireEvent.click(document.querySelector('button[type="submit"]') as HTMLButtonElement);

    await waitFor(() => expect(mutateCreate).toHaveBeenCalled());
    // We must NOT have tried to PATCH (that path would 404 with
    // no id) — the new flow goes straight to POST.
    expect(mutatePatch).not.toHaveBeenCalled();

    const [arg] = mutateCreate.mock.calls[0] as [Record<string, unknown>];
    expect(arg).toMatchObject({
      name: 'Brand New Co',
      domain: 'https://new.example.com',
      employees: '1',
      goals: ['software'],
      onboarding_status: 'completed',
    });
    expect(typeof arg.onboarding_completed_at).toBe('string');

    // No "workspace is not yet provisioned" copy anywhere.
    expect(screen.queryByText(/not yet provisioned/i)).not.toBeInTheDocument();

    expect(pushToast).toHaveBeenCalled();
    expect(window.location.assign).toHaveBeenCalledWith('/');

    restore();
  });

  it('renders an error block when usePatchCompany fails', async () => {
    const restore = renderOnboarding().restore;
    mutatePatch.mockRejectedValueOnce(new Error('Boom'));

    fireEvent.change(screen.getByLabelText(/company name/i), { target: { value: 'Acme' } });
    fireEvent.change(screen.getByLabelText(/website/i), { target: { value: 'https://acme.test' } });
    fireEvent.click(screen.getByRole('button', { name: /^11–50$/ }));
    fireEvent.click(screen.getByRole('button', { name: /Organic search traffic and rankings/i }));

    fireEvent.click(document.querySelector('button[type="submit"]') as HTMLButtonElement);

    await waitFor(() => {
      expect(screen.getByText(/couldn't save your profile/i)).toBeInTheDocument();
    });

    restore();
  });
});