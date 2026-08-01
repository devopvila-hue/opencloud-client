import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ShellLayout } from '@/layout/ShellLayout';
import { RequireAuth } from '@/components/RequireAuth';
import DashboardPage from '@/pages/DashboardPage';
import ExecutiveOfficePage from '@/pages/ExecutiveOfficePage';
import ExecutiveRoomPage from '@/pages/ExecutiveRoomPage';
import TimelinePage from '@/pages/TimelinePage';
import OrchestrationDetailPage from '@/pages/OrchestrationDetailPage';
import ChatPage from '@/pages/ChatPage';
import DepartmentsPage from '@/pages/DepartmentsPage';
import DepartmentDetailPage from '@/pages/DepartmentDetailPage';
import AgentsPage from '@/pages/AgentsPage';
import TasksPage from '@/pages/TasksPage';
import TaskDetailPage from '@/pages/TaskDetailPage';
import ResultsPage from '@/pages/ResultsPage';
import DocumentsPage from '@/pages/DocumentsPage';
import CompanyPage from '@/pages/CompanyPage';
import MemoryFilePage from '@/pages/MemoryFilePage';
import AnalyticsPage from '@/pages/AnalyticsPage';
import IntegrationsPage from '@/pages/IntegrationsPage';
import SettingsPage from '@/pages/SettingsPage';
import MarketplacePage from '@/pages/MarketplacePage';
import MarketingOverviewPage from '@/pages/MarketingOverviewPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <RequireAuth>
        <ShellLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'executive-office', element: <ExecutiveOfficePage /> },
      { path: 'executive-room', element: <ExecutiveRoomPage /> },
      { path: 'timeline', element: <TimelinePage /> },
      { path: 'orchestrations/:id', element: <OrchestrationDetailPage /> },
      { path: 'marketing', element: <MarketingOverviewPage /> },
      { path: 'chat', element: <Navigate to="/chat/new" replace /> },
      { path: 'chat/:id', element: <ChatPage /> },
      { path: 'departments', element: <DepartmentsPage /> },
      { path: 'departments/:id', element: <DepartmentDetailPage /> },
      { path: 'marketplace', element: <MarketplacePage /> },
      { path: 'agents', element: <AgentsPage /> },
      { path: 'tasks', element: <TasksPage /> },
      { path: 'tasks/:id', element: <TaskDetailPage /> },
      { path: 'results', element: <ResultsPage /> },
      { path: 'documents', element: <DocumentsPage /> },
      { path: 'company', element: <CompanyPage /> },
      { path: 'company/memory/:key', element: <MemoryFilePage /> },
      { path: 'analytics', element: <AnalyticsPage /> },
      { path: 'integrations', element: <IntegrationsPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);
