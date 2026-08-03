import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ShellLayout } from '@/layout/ShellLayout';
import { RequireAuth } from '@/components/RequireAuth';
import { lazyPage } from '@/utils/lazyPage';

// Eagerly loaded (high-priority / dashboard pages)
import DashboardPage from '@/pages/DashboardPage';
import ExecutiveOfficePage from '@/pages/ExecutiveOfficePage';
import ExecutiveRoomPage from '@/pages/ExecutiveRoomPage';
import TimelinePage from '@/pages/TimelinePage';
import OnboardingPage from '@/pages/OnboardingPage';
import LoginPage from '@/pages/LoginPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';

// Lazily loaded (lower-priority / heavy pages)
const OrchestrationDetailPage = lazyPage(() => import('@/pages/OrchestrationDetailPage'));
const ChatPage = lazyPage(() => import('@/pages/ChatPage'));
const DepartmentsPage = lazyPage(() => import('@/pages/DepartmentsPage'));
const DepartmentDetailPage = lazyPage(() => import('@/pages/DepartmentDetailPage'));
const AgentsPage = lazyPage(() => import('@/pages/AgentsPage'));
const TasksPage = lazyPage(() => import('@/pages/TasksPage'));
const TaskDetailPage = lazyPage(() => import('@/pages/TaskDetailPage'));
const ResultsPage = lazyPage(() => import('@/pages/ResultsPage'));
const DocumentsPage = lazyPage(() => import('@/pages/DocumentsPage'));
const CompanyPage = lazyPage(() => import('@/pages/CompanyPage'));
const MemoryFilePage = lazyPage(() => import('@/pages/MemoryFilePage'));
const AnalyticsPage = lazyPage(() => import('@/pages/AnalyticsPage'));
const IntegrationsPage = lazyPage(() => import('@/pages/IntegrationsPage'));
const SettingsPage = lazyPage(() => import('@/pages/SettingsPage'));
const MarketplacePage = lazyPage(() => import('@/pages/MarketplacePage'));
const MarketingOverviewPage = lazyPage(() => import('@/pages/MarketingOverviewPage'));

export const router = createBrowserRouter([
  // /login is mounted OUTSIDE the RequireAuth guard. RequireAuth
  // bounces unauthenticated users to /login?next=<target>; if that
  // route were itself wrapped by RequireAuth the guard would
  // re-trigger and create a /login?next=/login?next=… loop.
  { path: '/login', element: <LoginPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },

  // /register is the canonical CTA coming from departify.app
  // ("Crear cuenta" → https://app.departify.app/register).
  // LoginPage reads ?mode=signup to pre-select the signup flow.
  { path: '/register', element: <Navigate to="/login?mode=signup" replace /> },

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
      { path: 'onboarding', element: <OnboardingPage /> },
      { path: 'orchestrations/:id', element: <OrchestrationDetailPage /> },
      { path: 'marketing', element: <MarketingOverviewPage /> },
      { path: 'chat', element: <Navigate to="/chat/new" replace /> },
      { path: 'chat/new', element: <ChatPage /> },
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