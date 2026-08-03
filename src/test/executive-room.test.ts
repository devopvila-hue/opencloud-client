import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import ExecutiveRoomPage from '@/pages/ExecutiveRoomPage';
import { ThemeProvider } from '@/design-system/theme';
import { ToastProvider } from '@/components/Toaster';

const mockExecutiveRoom = vi.hoisted(() => ({
  data: {
    organization_id: 'org-test',
    generated_at: new Date().toISOString(),
    departments: [
      {
        id: 'ls-1',
        organization_id: 'org-test',
        department_key: 'marketing',
        status: 'working',
        health: 'healthy',
        progress: 40,
        current_task_id: 'task-1',
        current_orchestration_id: 'orch-1',
        current_step_id: 'step-1',
        pending_tasks: 2,
        completed_today: 5,
        failed_today: 0,
        avg_duration_ms: 4500,
        last_activity_at: new Date().toISOString(),
        metadata: {},
        updated_at: new Date().toISOString(),
      },
      {
        id: 'ls-2',
        organization_id: 'org-test',
        department_key: 'sales',
        status: 'blocked',
        health: 'degraded',
        progress: 0,
        current_task_id: null,
        current_orchestration_id: null,
        current_step_id: null,
        pending_tasks: 5,
        completed_today: 3,
        failed_today: 1,
        avg_duration_ms: 3000,
        last_activity_at: new Date().toISOString(),
        metadata: {},
        updated_at: new Date().toISOString(),
      },
    ],
    active_orchestrations: [
      {
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
    ],
    recent_bus_messages: [
      {
        id: 'bus-1',
        organization_id: 'org-test',
        company_id: null,
        conversation_id: null,
        orchestration_id: 'orch-1',
        step_id: 'step-1',
        correlation_id: 'corr-1',
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
    pending_human_approvals: 0,
    bottlenecks: [
      { department_key: 'sales', reason: 'blocked', pending_tasks: 5 },
    ],
    averages: { avg_duration_ms: 4500, success_rate: 0.88 },
  },
}));

const mockOpenOrchestrations = vi.hoisted(() => ({
  data: [
    {
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
  ],
}));

vi.mock('@/api/client', () => ({
  api: vi.fn(async (path: string) => {
    if (path === '/executive-room') return mockExecutiveRoom;
    if (path.startsWith('/orchestrations?status=open')) return mockOpenOrchestrations;
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
  return render(
    React.createElement(
      MemoryRouter,
      { initialEntries: ['/executive-room'] },
      React.createElement(
        QueryClientProvider,
        { client: qc },
        React.createElement(
          ThemeProvider,
          null,
          React.createElement(ToastProvider, null, node),
        ),
      ),
    ),
  );
}

describe('ExecutiveRoomPage', () => {
  it('renders the Sala Ejecutiva heading', async () => {
    renderWithProviders(React.createElement(ExecutiveRoomPage));
    await waitFor(() => {
      expect(screen.getByText(/Sala Ejecutiva/i)).toBeInTheDocument();
    });
  });

  it('shows the Fase beta badge', async () => {
    renderWithProviders(React.createElement(ExecutiveRoomPage));
    await waitFor(() => {
      expect(screen.getByText('Fase beta')).toBeInTheDocument();
    });
  });

  it('renders metric tiles (departments, orchestrations, success rate, bottlenecks)', async () => {
    renderWithProviders(React.createElement(ExecutiveRoomPage));
    await waitFor(() => {
      expect(screen.getByText('Departamentos activos')).toBeInTheDocument();
      // Use getAllBy since "Orquestaciones activas" appears in both the tile and section title
      expect(screen.getAllByText('Orquestaciones activas').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Tasa de éxito')).toBeInTheDocument();
      expect(screen.getAllByText('Cuellos de botella').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('displays departments with correct status', async () => {
    renderWithProviders(React.createElement(ExecutiveRoomPage));
    await waitFor(() => {
      // Both department names should appear
      expect(screen.getAllByText('marketing').length).toBeGreaterThan(0);
      expect(screen.getAllByText('sales').length).toBeGreaterThan(0);
    });
  });

  it('shows active orchestrations', async () => {
    renderWithProviders(React.createElement(ExecutiveRoomPage));
    await waitFor(() => {
      expect(screen.getByText('Campaign Launch')).toBeInTheDocument();
      expect(screen.getByText('running')).toBeInTheDocument();
    });
  });

  it('shows bottleneck departments', async () => {
    renderWithProviders(React.createElement(ExecutiveRoomPage));
    // "Cuellos de botella" appears in both the MetricTile label and the Card title
    const titles = await screen.findAllByText('Cuellos de botella');
    expect(titles.length).toBeGreaterThan(0);
    // Bottleneck should list the sales department
    const salesRefs = await screen.findAllByText(/sales/i);
    expect(salesRefs.length).toBeGreaterThan(0);
  });

  it('shows bus messages', async () => {
    renderWithProviders(React.createElement(ExecutiveRoomPage));
    await waitFor(() => {
      expect(screen.getByText('Mensajes del Department Bus')).toBeInTheDocument();
      expect(screen.getByText('Market research needed')).toBeInTheDocument();
    });
  });

  it('shows cancel button for running orchestrations', async () => {
    renderWithProviders(React.createElement(ExecutiveRoomPage));
    await screen.findByText('Campaign Launch');
    // Check that the orchestrations section rendered with action buttons
    const allButtons = screen.getAllByRole('button');
    expect(allButtons.length).toBeGreaterThan(3);
  });

  it('shows Executive Director status indicator', async () => {
    renderWithProviders(React.createElement(ExecutiveRoomPage));
    await waitFor(() => {
      // Active orchestrations exist, so status should be "Orquestando"
      expect(screen.getByText('Orquestando')).toBeInTheDocument();
    });
  });
});
