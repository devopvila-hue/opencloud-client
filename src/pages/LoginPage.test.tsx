import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Stub useMe so the LoginPage sees a stable (no-session) state
// without touching the real API.
vi.mock('@/api/queries', () => ({
  useMe: () => ({ data: undefined, isLoading: false, isError: false }),
}));

import LoginPage from '@/pages/LoginPage';

function renderLogin(initialPath: string) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<div>Home</div>} />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </MemoryRouter>
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
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: originalLocation,
    });
  });

  it('renders the sign-in screen', () => {
    renderLogin('/login');
    expect(screen.getByText(/sign in to opencloud/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue to sign in/i })).toBeInTheDocument();
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
    // The "Loop detected" panel should be visible instead.
    expect(screen.getByText(/loop detected/i)).toBeInTheDocument();
  });

  it('shows a return-home link', () => {
    renderLogin('/login');
    expect(screen.getByRole('link', { name: /return home/i })).toHaveAttribute('href', '/');
  });
});