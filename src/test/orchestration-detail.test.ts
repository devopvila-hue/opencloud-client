import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import OrchestrationDetailPage from '@/pages/OrchestrationDetailPage';
import { ThemeProvider } from '@/design-system/theme';
import { ToastProvider } from '@/components/Toaster';

const mockOrchestration = vi.hoisted(() => ({
  data: {
    id: 'orch-1',
    organization_id: 'org-test',
    company_id: null,
    conversation_id: null,
    user_id: 'user-1',
    title: 'Campaign Launch',
    description: 'test',
    intent: 'Launch campaign for product X',
    status: 'running',
    priority: 5,
    departments: ['marketing', 'sales'],
    plan: [],
    result: null,
    error: null,
    correlation_id: 'corr-1',
    started_at: new Date().toISOString(),
    completed_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
}));

const mockSteps = vi.hoisted(() => ({
  data: [
    {
      id: 'step-1',
      organization_id: 'org-test',
      orchestration_id: 'orch-1',
      sequence: 1,
      step_id: 'market-research',
      title: 'Market Research',
      description: 'research market',
      department_key: 'marketing',
      target_agent: 'marketing-manager',
      source_agent: 'executive-director',
      execution_mode: 'sequential',
      conditional_on: null,
      depends_on: null,
      input: { objective: 'research' },
      output: { summary: 'done' },
      status: 'completed',
      attempts: 0,
      max_attempts: 3,
      timeout_ms: 60000,
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      duration_ms: 5000,
      error: null,
      correlation_id: 'corr-s1',
      causation_id: null,
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'step-2',
      organization_id: 'org-test',
      orchestration_id: 'orch-1',
      sequence: 2,
      step_id: 'sales-outreach',
      title: 'Sales Outreach',
      description: 'contact prospects',
      department_key: 'sales',
      target_agent: 'sales-manager',
      source_agent: 'executive-director',
      execution_mode: 'sequential',
      conditional_on: null,
      depends_on: ['market-research'],
      input: {},
      output: null,
      status: 'running',
      attempts: 0,
      max_attempts: 3,
      timeout_ms: 30000,
      started_at: new Date().toISOString(),
      completed_at: null,
      duration_ms: null,
      error: null,
      correlation_id: 'corr-s2',
      causation_id: null,
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
}));

const mockBusMessages = vi.hoisted(() => ({
  data: [
    {
      id: 'bus-1',
      organization_id: 'org-test',
      company_id: null,
      conversation_id: null,
      orchestration_id: 'orch-1',
      step_id: 'step-1',
      correlation_id: 'corr-s1',
      causation_id: null,
      source_department: 'executive-office',
      target_department: 'marketing',
      source_agent: 'executive-director',
      target_agent: 'marketing-manager',
      priority: 5,
      subject: 'Market research needed',
      payload: { intent: 'research' },
      attachments: [],
      deadline_at: null,
      status: 'replied',
      delivered_at: new Date().toISOString(),
      read_at: new Date().toISOString(),
      replied_at: new Date().toISOString(),
      reply_reference: 'bus-2',
      retries: 0,
      last_error: null,
      audit_trail: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
}));

vi.mock('@/api/client', () => ({
  api: vi.fn(async (path: string) => {
    if (path === '/orchestrations/orch-1') return mockOrchestration;
    if (path === '/orchestrations/orch-1/steps') return mockSteps;
    if (path.startsWith('/department-bus')) return mockBusMessages;
    if (path.startsWith('/orchestrations?status=open')) return { data: [mockOrchestration.data] };
    return { data: null };
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
  return render(
    React.createElement(
      QueryClientProvider,
      { client: qc },
      React.createElement(
        ThemeProvider,
        null,
        React.createElement(
          ToastProvider,
          null,
          React.createElement(
            MemoryRouter,
            { initialEntries: ['/orchestrations/orch-1'] },
            React.createElement(
              Routes,
              null,
              React.createElement(Route, {
                path: '/orchestrations/:id',
                element: node,
              }),
            ),
          ),
        ),
      ),
    ),
  );
}

describe('OrchestrationDetailPage', () => {
  it('renders the orchestration title and intent', async () => {
    renderWithProviders(React.createElement(OrchestrationDetailPage));
    await waitFor(() => {
      expect(screen.getByText('Campaign Launch')).toBeInTheDocument();
    });
  });

  it('shows the orchestration status badge', async () => {
    renderWithProviders(React.createElement(OrchestrationDetailPage));
    const statuses = await screen.findAllByText(/running/i);
    expect(statuses.length).toBeGreaterThan(0);
  });

  it('renders step list with titles and statuses', async () => {
    renderWithProviders(React.createElement(OrchestrationDetailPage));
    expect(await screen.findByText(/Market Research/)).toBeInTheDocument();
    expect(await screen.findByText(/Sales Outreach/)).toBeInTheDocument();
  });

  it('shows step progress', async () => {
    renderWithProviders(React.createElement(OrchestrationDetailPage));
    await waitFor(() => {
      expect(screen.getByText(/pasos completados/)).toBeInTheDocument();
    });
  });

  it('renders department bus messages', async () => {
    renderWithProviders(React.createElement(OrchestrationDetailPage));
    await waitFor(() => {
      expect(screen.getByText(/Department Bus|Bus de departamentos/)).toBeInTheDocument();
      expect(screen.getByText('Market research needed')).toBeInTheDocument();
    });
  });

  it('shows cancel and escalate buttons for running orchestration', async () => {
    renderWithProviders(React.createElement(OrchestrationDetailPage));
    await waitFor(() => {
      expect(screen.getByText('Cancelar')).toBeInTheDocument();
      expect(screen.getByText('Escalar')).toBeInTheDocument();
    });
  });
});
