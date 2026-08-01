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
    // While redirecting, protected content must NOT flash.
    expect(screen.queryByTestId('protected')).not.toBeInTheDocument();
  });

  it('redirects to /onboarding when company does not exist', async () => {
    companyState.mockReturnValue({ data: null, isLoading: false });
    renderGuard('/dashboard');
    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent('/onboarding'),
    );
  });

  it('does NOT redirect when already on /onboarding', () => {
    renderGuard('/onboarding');
    expect(screen.getByTestId('location')).toHaveTextContent('/onboarding');
    // Protected content is hidden (because needsOnboarding is true and
    // we're not the redirecting branch) but we don't navigate away.
    expect(screen.queryByTestId('protected')).not.toBeInTheDocument();
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