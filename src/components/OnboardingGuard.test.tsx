import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the queries module so we can drive both me.data and company.data.
const meState = vi.fn();
const companyState = vi.fn();

vi.mock('@/api/queries', () => ({
  useMe: () => meState(),
  useCompany: () => companyState(),
}));

import { OnboardingGuard } from '@/components/OnboardingGuard';

function makeQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function LocationProbe() {
  const loc = useLocation();
  return <div data-testid="location">{loc.pathname}</div>;
}

function renderGuard(initialPath: string) {
  return render(
    <QueryClientProvider client={makeQueryClient()}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route
            path="/onboarding"
            element={
              <>
                <OnboardingGuard>
                  <div data-testid="protected">protected content</div>
                </OnboardingGuard>
                <LocationProbe />
              </>
            }
          />
          <Route
            path="/"
            element={
              <>
                <OnboardingGuard>
                  <div data-testid="protected">protected content</div>
                </OnboardingGuard>
                <LocationProbe />
              </>
            }
          />
          <Route
            path="/dashboard"
            element={
              <>
                <OnboardingGuard>
                  <div data-testid="protected">protected content</div>
                </OnboardingGuard>
                <LocationProbe />
              </>
            }
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('OnboardingGuard', () => {
  beforeEach(() => {
    meState.mockReturnValue({ data: { id: 'u1', email: '[email protected]' }, isLoading: false });
    companyState.mockReturnValue({
      data: {
        id: 'co1',
        onboarding_status: 'pending',
        onboarding_completed_at: null,
      },
      isLoading: false,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders protected children when onboarding is completed', () => {
    companyState.mockReturnValue({
      data: { id: 'co1', onboarding_status: 'completed', onboarding_completed_at: '2025-01-01T00:00:00Z' },
      isLoading: false,
    });
    renderGuard('/dashboard');
    expect(screen.getByTestId('protected')).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('/dashboard');
  });

  it('redirects to /onboarding when status is pending', async () => {
    renderGuard('/dashboard');
    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent('/onboarding'),
    );
    // Once the redirect lands on /onboarding, the children (the
    // OnboardingPage in production) render normally — the guard
    // must NOT block them. We verify the landing page is the
    // /onboarding one, where the test fixture's children are now
    // expected to be visible.
    expect(screen.getByTestId('location')).toHaveTextContent('/onboarding');
    expect(screen.getByTestId('protected')).toBeInTheDocument();
  });

  it('redirects to /onboarding when company does not exist', async () => {
    companyState.mockReturnValue({ data: null, isLoading: false });
    renderGuard('/dashboard');
    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent('/onboarding'),
    );
    // Same as above: the redirect lands on /onboarding where the
    // children (the OnboardingPage in production) become visible.
    expect(screen.getByTestId('protected')).toBeInTheDocument();
  });

  it('does NOT redirect when already on /onboarding', () => {
    renderGuard('/onboarding');
    expect(screen.getByTestId('location')).toHaveTextContent('/onboarding');
    // When the user is already on /onboarding, the guard renders
    // children instead of null — the children ARE the OnboardingPage
    // (matched by the /onboarding route) and must be visible.
    // Returning null here would leave the user staring at an empty
    // main area (sidebar + topbar only) — the bug we just fixed.
    expect(screen.getByTestId('protected')).toBeInTheDocument();
  });

  it('renders a spinner while me or company is loading', () => {
    meState.mockReturnValue({ data: undefined, isLoading: true });
    companyState.mockReturnValue({ data: undefined, isLoading: false });
    const { container } = renderGuard('/dashboard');
    // Loader2 renders an svg with animate-spin — we just confirm we
    // didn't render the protected content.
    expect(screen.queryByTestId('protected')).not.toBeInTheDocument();
    expect(container.querySelector('.animate-spin')).toBeTruthy();
  });

  it('treats "skipped" the same as "completed" (allow access)', () => {
    companyState.mockReturnValue({
      data: { id: 'co1', onboarding_status: 'skipped', onboarding_completed_at: null },
      isLoading: false,
    });
    renderGuard('/dashboard');
    expect(screen.getByTestId('protected')).toBeInTheDocument();
  });
});