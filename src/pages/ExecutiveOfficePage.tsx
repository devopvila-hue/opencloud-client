import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Brain,
  Calendar,
  ChevronRight,
  Compass,
  Crown,
  FileText,
  MessageSquare,
  Network,
  ScrollText,
  Sparkles,
  Target,
} from 'lucide-react';
import { Card, CardHeader } from '@/components/Card';
import { Button } from '@/components/Button';
import { Badge, Dot } from '@/components/Badge';
import { ActivityFeed } from '@/components/ActivityFeed';
import { EmptyState } from '@/components/EmptyState';
import { useDepartment, useDepartmentCatalog, useInternalMessages, useMemoryList, useTasks } from '@/api/queries';
import { formatRelativeTime, truncate } from '@/utils/format';
import { getDepartment, iconFromManifest } from '@/design-system/departments';

export default function ExecutiveOfficePage() {
  const def = useDepartment('executive-office');
  const catalog = useDepartmentCatalog();
  const tasks = useTasks({ limit: 30 });
  const messages = useInternalMessages({ limit: 30 });
  const memory = useMemoryList();

  const managedDepartments = (catalog.data ?? []).filter(
    (d) => d.installation?.lifecycle === 'active' && d.key !== 'executive-office' && d.key !== 'platform-assistant',
  );

  const upcomingActions = (tasks.data ?? [])
    .filter((t) => ['queued', 'assigned', 'running', 'waiting_approval'].includes(t.status))
    .slice(0, 6);

  const recentReports = (memory.data ?? []).slice(0, 5);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-6 lg:p-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-[color:var(--color-dept-governance)] text-white">
            <Crown className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Executive Office</h1>
            <p className="mt-1 text-sm text-[color:var(--color-fg-3)]">
              Strategic coordination, inter-department memory and corporate direction.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="primary"
            iconLeft={<MessageSquare className="h-4 w-4" />}
            onClick={() => (window.location.href = '/chat/new?department=executive-office')}
          >
            Talk to Executive Director
          </Button>
        </div>
      </header>

      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32 }}
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        <Stat
          icon={<Target className="h-4 w-4" />}
          label="Status"
          value={def.data?.installation?.lifecycle ?? 'available'}
          accent="--color-dept-governance"
        />
        <Stat
          icon={<Network className="h-4 w-4" />}
          label="Departments coordinated"
          value={managedDepartments.length}
          accent="--color-cyan"
        />
        <Stat
          icon={<Calendar className="h-4 w-4" />}
          label="Active tasks"
          value={(tasks.data ?? []).filter((t) => ['running', 'assigned', 'queued'].includes(t.status)).length}
          accent="--color-amber"
        />
        <Stat
          icon={<Brain className="h-4 w-4" />}
          label="Memory files"
          value={(memory.data ?? []).length}
          accent="--color-violet"
        />
      </motion.section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Coordinated departments */}
          <Card>
            <CardHeader
              title="Departments coordinated"
              subtitle="Live status of every department the Executive Director can delegate to"
              action={
                <Button variant="ghost" size="sm" iconRight={<ArrowRight className="h-4 w-4" />} onClick={() => (window.location.href = '/departments')}>
                  All departments
                </Button>
              }
            />
            {managedDepartments.length === 0 ? (
              <EmptyState
                icon={<Sparkles className="h-5 w-5" />}
                title="No departments activated yet"
                description="Activate a department to start delegating tasks through the Executive Director."
                action={<Button onClick={() => (window.location.href = '/departments')}>Open catalog</Button>}
              />
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {managedDepartments.map((d) => {
                  const Icon = iconFromManifest(d.icon);
                  return (
                    <Link
                      key={d.key}
                      to={`/departments/${d.key}`}
                      className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[color:var(--color-line)] p-3 hover:border-[color:var(--color-line-strong)] hover:bg-[color:var(--color-bg-3)]"
                    >
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)]"
                        style={{
                          backgroundColor: `color-mix(in oklab, var(--color-dept-revenue) 18%, transparent)`,
                          color: `var(--color-dept-revenue)`,
                        }}
                      >
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-medium text-[color:var(--color-fg-1)]">{d.name}</span>
                          <Badge tone={d.installation?.health === 'healthy' ? 'emerald' : 'amber'} size="xs">
                            {d.installation?.health ?? 'unknown'}
                          </Badge>
                        </div>
                        <div className="text-xs text-[color:var(--color-fg-3)]">
                          {truncate(d.description, 80)}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-[color:var(--color-fg-3)]" />
                    </Link>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Upcoming actions */}
          <Card>
            <CardHeader
              title="Upcoming actions"
              subtitle="What the Executive Office is planning to delegate next"
            />
            {upcomingActions.length === 0 ? (
              <EmptyState icon={<Compass className="h-5 w-5" />} title="No upcoming actions" />
            ) : (
              <ul className="divide-y divide-[color:var(--color-line)]">
                {upcomingActions.map((t) => {
                  const pres = getDepartment(t.department_key);
                  return (
                    <li key={t.id} className="flex items-center gap-3 py-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-[color:var(--color-bg-3)]">
                        <Compass className="h-4 w-4 text-[color:var(--color-fg-2)]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-[color:var(--color-fg-1)]">{t.title}</div>
                        <div className="text-xs text-[color:var(--color-fg-3)]">
                          {pres?.name ?? t.department_key} · {t.status.replace('_', ' ')}
                        </div>
                      </div>
                      <Badge tone="cyan" size="xs">
                        {formatRelativeTime(t.created_at)}
                      </Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          {/* Activity feed */}
          <Card>
            <CardHeader title="Recent office activity" subtitle="Conversations, delegations and approvals" />
            <ActivityFeed tasks={tasks.data ?? []} messages={messages.data ?? []} limit={15} />
          </Card>
        </div>

        <div className="space-y-6">
          {/* Director card */}
          <Card>
            <CardHeader title="Executive Director" subtitle="Always-on strategic coordinator" />
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[color:var(--color-dept-governance)] text-white">
                <Crown className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[color:var(--color-fg-1)]">executive-director</span>
                  <Badge tone="emerald" size="xs" icon={<Dot tone="emerald" pulse />}>
                    active
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-[color:var(--color-fg-3)]">
                  Coordinates departments, maintains corporate memory, and proposes next steps.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" iconLeft={<MessageSquare className="h-4 w-4" />} onClick={() => (window.location.href = '/chat/new?department=executive-office')}>
                    Start chat
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Memory */}
          <Card>
            <CardHeader
              title="Corporate memory"
              subtitle="Files the office maintains about your company"
              action={
                <Button variant="ghost" size="sm" iconRight={<ArrowRight className="h-4 w-4" />} onClick={() => (window.location.href = '/company')}>
                  Manage
                </Button>
              }
            />
            {recentReports.length === 0 ? (
              <EmptyState icon={<ScrollText className="h-5 w-5" />} title="No memory files yet" />
            ) : (
              <ul className="space-y-1">
                {recentReports.map((m) => (
                  <li key={m.id}>
                    <Link
                      to={`/company/memory/${m.file_key}`}
                      className="flex items-center gap-3 rounded-[var(--radius-md)] p-2 hover:bg-[color:var(--color-bg-3)]"
                    >
                      <FileText className="h-4 w-4 text-[color:var(--color-fg-3)]" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-[color:var(--color-fg-1)]">{m.title}</div>
                        <div className="text-xs text-[color:var(--color-fg-3)]">v{m.version} · {formatRelativeTime(m.updated_at)}</div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[color:var(--color-line)] bg-[color:var(--color-bg-2)] p-4 shadow-[var(--shadow-soft)]">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs uppercase tracking-wider text-[color:var(--color-fg-3)]">{label}</span>
        <span
          className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)]"
          style={{ backgroundColor: `color-mix(in oklab, var(${accent}) 18%, transparent)`, color: `var(${accent})` }}
        >
          {icon}
        </span>
      </div>
      <div className="mt-3 text-2xl font-semibold text-[color:var(--color-fg-1)] capitalize">{value}</div>
    </div>
  );
}