import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import MarketingOverviewPage from '@/pages/MarketingOverviewPage';
import { ToastProvider } from '@/components/Toaster';
import { ThemeProvider } from '@/design-system/theme';

function renderWithProviders(node: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    React.createElement(
      MemoryRouter,
      null,
      React.createElement(QueryClientProvider, { client: qc },
        React.createElement(ThemeProvider, null,
          React.createElement(ToastProvider, null, node))),
    ),
  );
}

describe('MarketingOverviewPage', () => {
  it('renders the marketing heading', () => {
    renderWithProviders(React.createElement(MarketingOverviewPage));
    expect(screen.getAllByText(/Marketing/i).length).toBeGreaterThan(0);
  });

  it('shows the team section', () => {
    renderWithProviders(React.createElement(MarketingOverviewPage));
    expect(screen.getAllByText(/brand-manager/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/copywriter/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/email-marketing/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/social-media/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/campaign-manager/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/marketing-analytics/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/market-research/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/content-strategist/i).length).toBeGreaterThan(0);
  });

  it('shows the workflows section', () => {
    renderWithProviders(React.createElement(MarketingOverviewPage));
    expect(screen.getByText(/Workflows/i)).toBeInTheDocument();
    expect(screen.getByText(/Investigación/i)).toBeInTheDocument();
    expect(screen.getByText(/Estrategia/i)).toBeInTheDocument();
    expect(screen.getByText(/Plan editorial/i)).toBeInTheDocument();
    expect(screen.getByText(/Producción/i)).toBeInTheDocument();
    expect(screen.getByText(/Revisión/i)).toBeInTheDocument();
    expect(screen.getByText(/Optimización/i)).toBeInTheDocument();
    expect(screen.getByText(/Informe/i)).toBeInTheDocument();
  });

  it('mentions the canonical output scheme', () => {
    renderWithProviders(React.createElement(MarketingOverviewPage));
    expect(screen.getByText(/Esquema canónico/i)).toBeInTheDocument();
  });
});