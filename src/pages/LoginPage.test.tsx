import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// All vi.mock calls must live at the top of the file before any
// import. We stub the @/api/queries module so the LoginPage sees
// stable (no-session, pending-OK) mutations without touching the
// real network, and the Toaster so we can spy on toast.push().
const pushToast = vi.fn();

vi.mock('@/components/Toaster', () => ({
  useToast: () => ({ push: pushToast }),
}));

vi.mock('@/api/queries', () => {
  const mutateAsync = vi.fn().mockResolvedValue({
    data: { id: 'u1', email: '[email protected]', full_name: null, organization_id: 'org1' },
  });
  const mutationResult = {
    mutateAsync,
    mutate: mutateAsync,
    isPending: false,
    isError: false,
    isSuccess: false,
    reset: vi.fn(),
    data: undefined,
    error: null,
    status: 'idle',
    variables: undefined,
    context: undefined,
    failureCount: 0,
    failureReason: null,
  };
  return {
    useMe: () => ({ data: undefined, isLoading: false, isError: false }),
    useLogin: () => ({ ...mutationResult, mutateAsync }),
    useSignup: () => ({ ...mutationResult, mutateAsync }),
  };
});

// Import after the mocks so they hook into the module system.
import LoginPage from '@/pages/LoginPage';
import { I18nProvider } from '@/i18n/I18nProvider';

function renderLogin(initialPath: string) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <I18nProvider>
        <MemoryRouter initialEntries={[initialPath]}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<div>Home</div>} />
            <Route path="/dashboard" element={<div>Dashboard</div>} />
            <Route path="/departments/marketing" element={<div>Departments Marketing</div>} />
          </Routes>
        </MemoryRouter>
      </I18nProvider>
    </QueryClientProvider>,
  );
}

describe('LoginPage', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...originalLocation, origin: 'https://portal.example.com', assign: vi.fn() },
    });
    pushToast.mockClear();
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: originalLocation,
    });
  });

  it('renders the sign-in screen with email and password fields', () => {
    renderLogin('/login');
    expect(screen.getByText(/sign in to DEPARTIFY/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    // The submit button is inside the form — find it by its parent <form>.
    const form = document.querySelector('form');
    expect(form).not.toBeNull();
    const submit = form?.querySelector('button[type="submit"]');
    expect(submit).not.toBeNull();
  });

  it('shows the sanitized destination when next is a normal path', () => {
    renderLogin('/login?next=%2Fdashboard');
    expect(screen.getByText('/dashboard')).toBeInTheDocument();
  });

  it('detects the loop when next resolves to /login and warns the user', () => {
    renderLogin('/login?next=%2Flogin');
    expect(screen.getByText(/loop detected/i)).toBeInTheDocument();
  });

  it('detects the loop when next is a deeply encoded /login chain', () => {
    const encoded = encodeURIComponent(
      encodeURIComponent('/login?next=/login'),
    );
    renderLogin(`/login?next=${encoded}`);
    expect(screen.getByText(/loop detected/i)).toBeInTheDocument();
  });

  it('never exposes /login as the destination', () => {
    renderLogin('/login?next=%2Flogin');
    expect(screen.queryByText('/login')).not.toBeInTheDocument();
    expect(screen.getByText(/loop detected/i)).toBeInTheDocument();
  });

  it('shows a return-home link', () => {
    renderLogin('/login');
    expect(screen.getByRole('link', { name: /return home/i })).toHaveAttribute('href', '/');
  });

  it('submits the login form with email and password and triggers a toast', async () => {
    renderLogin('/login?next=%2Fdashboard');

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: '[email protected]' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'correcthorse' },
    });

    const form = document.querySelector('form');
    expect(form).not.toBeNull();
    const submit = form?.querySelector<HTMLButtonElement>('button[type="submit"]');
    expect(submit).not.toBeNull();
    fireEvent.click(submit!);

    await waitFor(() => {
      expect(pushToast).toHaveBeenCalled();
    });

    const [first] = pushToast.mock.calls[0] as [{ tone: string; title: string }];
    expect(first.tone).toBe('success');
    expect(first.title).toMatch(/signed in/i);
  });

  it('exposes a sign-up toggle that reveals the full-name field', () => {
    renderLogin('/login');
    // The "Full name" field only exists in signup mode.
    expect(screen.queryByLabelText(/full name/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^sign up$/i }));

    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByText(/create your DEPARTIFY account/i)).toBeInTheDocument();
  });
});