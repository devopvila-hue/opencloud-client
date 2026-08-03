import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import TimelinePage from '@/pages/TimelinePage';
import { ThemeProvider } from '@/design-system/theme';
import { ToastProvider } from '@/components/Toaster';
import { I18nProvider } from '@/i18n/I18nProvider';

const mockTimeline = vi.hoisted(() => ({
  data: [
    {
      at: new Date().toISOString(),
      source: 'executive-director',
      source_department: 'executive-office',
      target: 'marketing-manager',
      target_department: 'marketing',
      type: 'bus.message',
      subject: 'Market research needed',
      detail: '{"intent":"research"}',
      orchestration_id: 'orch-1',
      step_id: 'step-1',
      bus_id: 'bus-1',
    },
    {
      at: new Date().toISOString(),
      source: 'executive-director',
      source_department: 'executive-office',
      target: null,
      target_department: null,
      type: 'orchestration.created',
      subject: 'Campaign Launch',
      detail: 'Launch campaign for product X',
      orchestration_id: 'orch-1',
    },
    {
      at: new Date().toISOString(),
      source: 'marketing-manager',
      source_department: 'marketing',
      target: 'executive-director',
      target_department: 'executive-office',
      type: 'step.completed',
      subject: 'Market research',
      orchestration_id: 'orch-1',
      step_id: 'step-1',
    },
  ],
}));

vi.mock('@/api/client', () => ({
  api: vi.fn(async (path: string) => {
    if (path.startsWith('/timeline')) return mockTimeline;
    return { data: [] };
  }),
  apiValidated: vi.fn(async () => ({})),
  streamPost: vi.fn(),
  ApiClientError: class extends Error {
    constructor(
      message: string,
      public code: string,
      public status: number,
    ) {
      super(message);
    }
  },
}));

function renderWithProviders(node: React.ReactNode) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 } },
  });
  // Force English locale so the existing English assertions keep
  // matching after Sprint 2. detectBrowserLocale reads navigator.
  Object.defineProperty(navigator, 'language', { value: 'en-US', configurable: true });
  // Also clear any persisted locale from earlier tests.
  try { localStorage.removeItem('opencloud.locale'); } catch {}
  return render(
    React.createElement(
      MemoryRouter,
      { initialEntries: ['/timeline'] },
      React.createElement(
        QueryClientProvider,
        { client: qc },
        React.createElement(
          I18nProvider,
          null,
          React.createElement(
            ThemeProvider,
            null,
            React.createElement(ToastProvider, null, node),
          ),
        ),
      ),
    ),
  );
}

describe('TimelinePage', () => {
  it('renders the Timeline heading', async () => {
    renderWithProviders(React.createElement(TimelinePage));
    await waitFor(() => {
      expect(screen.getByText('Timeline')).toBeInTheDocument();
    });
  });

  it('shows Phase 6 badge', async () => {
    renderWithProviders(React.createElement(TimelinePage));
    await waitFor(() => {
      expect(screen.getByText('Phase 6')).toBeInTheDocument();
    });
  });

  it('renders timeline events when data exists', async () => {
    renderWithProviders(React.createElement(TimelinePage));
    await waitFor(() => {
      expect(screen.getByText('Market research needed')).toBeInTheDocument();
      expect(screen.getByText('Campaign Launch')).toBeInTheDocument();
      expect(screen.getByText('Market research')).toBeInTheDocument();
    });
  });

  it('renders event types as badges', async () => {
    renderWithProviders(React.createElement(TimelinePage));
    await waitFor(() => {
      expect(screen.getByText('bus.message')).toBeInTheDocument();
      expect(screen.getByText('orchestration.created')).toBeInTheDocument();
      expect(screen.getByText('step.completed')).toBeInTheDocument();
    });
  });

  it('shows source and target departments for bus messages', async () => {
    renderWithProviders(React.createElement(TimelinePage));
    await waitFor(() => {
      expect(screen.getAllByText('executive-office').length).toBeGreaterThan(0);
      expect(screen.getAllByText('marketing').length).toBeGreaterThan(0);
    });
  });

  it('renders links to orchestration details', async () => {
    renderWithProviders(React.createElement(TimelinePage));
    await waitFor(() => {
      expect(screen.getAllByText('Ver orquestación').length).toBeGreaterThan(0);
    });
  });
});
