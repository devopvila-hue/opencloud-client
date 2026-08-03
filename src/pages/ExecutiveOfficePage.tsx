import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useI18n } from '@/i18n/I18nProvider';
import {
  Activity,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Crown,
  FileText,
  Globe,
  Heart,
  History,
  Layers,
  MessageSquare,
  Pause,
  Play,
  Plus,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { Card, CardHeader, CardSection } from '@/components/Card';
import { Button } from '@/components/Button';
import { Badge, Dot } from '@/components/Badge';
import { SectionHeader } from '@/components/SectionHeader';
import { EmptyState } from '@/components/EmptyState';
import { Skeleton } from '@/components/Skeleton';
import { ActivityFeed } from '@/components/ActivityFeed';
import { ProgressBar, Sparkline } from '@/components/Chart';
import { HealthCard } from '@/components/HealthCard';
import { formatRelativeTime, formatDuration, truncate, pluralize } from '@/utils/format';
import { cn } from '@/design-system/cn';
import { staggerChildren, staggerItem } from '@/design-system/motion';

import {
  useDepartment,
  useDepartmentCatalog,
  useInternalMessages,
  useMemoryList,
  useTasks,
  useExecutiveRoom,
  useSystemStatus,
  useTimeline,
} from '@/api/queries';
import { getDepartment, iconFromManifest } from '@/design-system/departments';

type Risk = {
  departmentKey: string;
  title: string;
  description: string;
};

type Opportunity = {
  departmentKey: string;
  title: string;
  description: string;
};

export default function ExecutiveOfficePage() {
  const { t } = useI18n();
  const def = useDepartment('executive-office');
  const catalog = useDepartmentCatalog();
  const tasks = useTasks({ limit: 50 });
  const messages = useInternalMessages({ limit: 50 });
  const memory = useMemoryList();
  const room = useExecutiveRoom();
  const timeline = useTimeline({});
  const system = useSystemStatus();

  const isLoading = def.isLoading || catalog.isLoading || tasks.isLoading;

  // Derive insights from the live data
  const departmentSummaries = catalog.data ?? [];
  const allTasks = tasks.data ?? [];
  const activeDepartments = departmentSummaries.filter((d) => d.installation?.lifecycle === 'active');
  const availableDepartments = departmentSummaries.filter((d) => !d.installation);

  // Business Health Score — composite of: gateway live, active depts, health, task success rate
  const gatewayLive = system.data?.gateway.ok ?? false;
  const healthyDepartments = activeDepartments.filter((d) => (d.installation?.health ?? 'unknown') === 'healthy');
  const healthRatio = activeDepartments.length > 0 ? healthyDepartments.length / activeDepartments.length : 0;

  const completedTasks = allTasks.filter((t) => t.status === 'completed');
  const failedTasks = allTasks.filter((t) => t.status === 'failed');
  const successRate = allTasks.length > 0 ? completedTasks.length / allTasks.length : 1;
  const healthScore = Math.round(
    (gatewayLive ? 25 : 0) +
      Math.round(healthRatio * 35) +
      Math.round(successRate * 40),
  );

  // Today's priorities — tasks created or updated today that need action
  const now = Date.now();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayTasks = allTasks.filter(
    (t) => new Date(t.created_at).getTime() > todayStart.getTime() || new Date(t.updated_at).getTime() > todayStart.getTime(),
  );
  const todaysPriorities = todayTasks
    .filter((t) => ['queued', 'assigned', 'running', 'waiting_approval'].includes(t.status))
    .slice(0, 5);

  // Pending decisions — waiting_approval tasks
  const pendingDecisions = allTasks.filter((t) => t.status === 'waiting_approval');

  // Risks — error departments, failed tasks, expired tasks
  const risks: Risk[] = [];
  for (const d of departmentSummaries) {
    if (d.installation?.health === 'unhealthy') {
      risks.push({
        departmentKey: d.key,
        title: t('office.unhealthy.title', { name: d.name }),
        description: d.installation?.last_error ? truncate(d.installation.last_error, 100) : t('office.risk.health_fail'),
      });
    } else if (d.installation?.lifecycle === 'error') {
      risks.push({
        departmentKey: d.key,
        title: t('office.unhealthy.title', { name: d.name }),
        description: d.installation?.last_error ? truncate(d.installation.last_error, 100) : t('office.risk.dept_error'),
      });
    }
  }
  for (const task of failedTasks.slice(0, 3)) {
    const pres = getDepartment(task.department_key);
    risks.push({
      departmentKey: task.department_key,
      title: t('office.unhealthy.task_failed', { title: truncate(task.title, 40) }),
      description: task.error ? truncate(task.error, 100) : t('office.risk.review_task'),
    });
    void pres;
  }

  // Opportunities — available departments not yet activated
  const opportunities: Opportunity[] = availableDepartments.slice(0, 3).map((d) => ({
    departmentKey: d.key,
    title: `Activate ${d.name}`,
    description: d.description ? truncate(d.description, 80) : d.name,
  }));

  // Executive Timeline — from orchestration timeline
  const timelineEvents = timeline.data ?? [];

  // KPI values
  const activeTaskCount = allTasks.filter((t) => ['running', 'assigned', 'queued'].includes(t.status)).length;
  const completedToday = completedTasks.filter(
    (t) => t.completed_at && now - new Date(t.completed_at).getTime() < 24 * 3600_000,
  ).length;
  const failedToday = failedTasks.filter(
    (t) => t.updated_at && now - new Date(t.updated_at).getTime() < 24 * 3600_000,
  ).length;
  const avgDuration = room.data?.averages.avg_duration_ms ?? null;

  // Department metrics summary
  const deptMetrics = room.data?.departments ?? [];
  const totalPending = deptMetrics.reduce((sum, d) => sum + d.pending_tasks, 0);
  const totalCompletedToday = deptMetrics.reduce((sum, d) => sum + d.completed_today, 0);

  return (
    <motion.div
      variants={staggerChildren}
      initial="initial"
      animate="animate"
      className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-6 lg:p-8"
    >
      {/* ── Header ─────────────────────────────────────────── */}
      <motion.header variants={staggerItem} className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-[var(--radius-lg)] text-white shadow-[var(--shadow-glow)]"
            style={{
              background: `linear-gradient(135deg, var(--color-dept-governance), color-mix(in oklab, var(--color-dept-governance) 60%, var(--accent)))`,
            }}
          >
            <Crown className="h-7 w-7" />
          </div>
          <div>
            <h1 className="font-display text-[1.4rem] tracking-[-0.01em] md:text-[1.75rem]">
              {t('office.header.title')}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-[color:var(--muted-foreground)] text-pretty">
              {t('office.header.subtitle')}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[color:var(--muted-foreground)]">
              <span>{t('office.last_updated', { when: formatRelativeTime(room.data?.generated_at ?? new Date().toISOString())})}</span>
              <span>·</span>
              <span>
                {activeDepartments.length} active · {availableDepartments.length} available
              </span>
            </div>
          </div>
        </div>
        <Button
          variant="primary"
          iconLeft={<MessageSquare className="h-4 w-4" />}
          onClick={() => (window.location.href = '/chat/new?department=executive-office')}
        >
          {t('office.cta.talk')}
        </Button>
      </motion.header>

      {/* ── Business Health Score ─────────────────────────── */}
      <motion.section variants={staggerItem}>
        <Card variant="elevated" className="overflow-hidden">
          <CardSection>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
              <div className="lg:col-span-2">
                <div className="flex items-center gap-3">
                  <div
                    className="relative flex h-20 w-20 items-center justify-center rounded-full border-4"
                    style={{
                      borderColor: 'color-mix(in oklab, var(--accent) 40%, transparent)',
                      background: `conic-gradient(
                        from 0deg,
                        var(--accent) 0% ${healthScore}%,
                        color-mix(in oklab, var(--muted) 30%, transparent) ${healthScore}%,
                        transparent 100%
                      )`,
                    }}
                  >
                    <span className="font-display text-[1.1rem] tracking-[-0.02em] text-[color:var(--foreground)]">
                      {healthScore}%
                    </span>
                  </div>
                  <div>
                    <h2 className="font-display text-[1.0625rem] tracking-[-0.01em] text-[color:var(--foreground)]">
                      {t('office.health.score')}
                    </h2>
                    <p className="mt-1 text-xs text-[color:var(--muted-foreground)]">
                      {t('office.health.score_help')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-3">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <HealthMetric
                    icon={<Layers className="h-4 w-4" />}
                    label={t('office.health.active_depts')}
                    value={activeDepartments.length}
                    hint={t('office.health.active_depts_hint', { total: departmentSummaries.length })}
                    color="var(--color-dept-governance)"
                  />
                  <HealthMetric
                    icon={<CheckCircle2 className="h-4 w-4" />}
                    label={t('office.health.success_rate')}
                    value={`${Math.round(successRate * 100)}%`}
                    hint={t('office.health.success_rate_hint', { count: failedTasks.length })}
                    color="var(--color-emerald)"
                  />
                  <HealthMetric
                    icon={<Heartbeat className="h-4 w-4" />}
                    label={t('office.health.healthy')}
                    value={`${healthyDepartments.length}/${activeDepartments.length}`}
                    hint={t('office.health.healthy_depts')}
                    color="var(--color-emerald)"
                  />
                  <HealthMetric
                    icon={<Clock className="h-4 w-4" />}
                    label={t('office.health.avg_duration')}
                    value={avgDuration ? formatDuration(avgDuration) : '—'}
                    hint={totalCompletedToday > 0 ? t('office.health.today', { count: totalCompletedToday }) : t('office.health.no_data')}
                    color="var(--color-dept-people)"
                  />
                </div>
              </div>
            </div>
          </CardSection>
        </Card>
      </motion.section>

      {/* ── KPI Cards ─────────────────────────────────────── */}
      <motion.section variants={staggerItem} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label={t('office.kpi.tasks_running')}
          value={activeTaskCount}
          hint={t('office.kpi.awaiting', { count: pendingDecisions.length })}
          icon={<Layers className="h-4 w-4" />}
          accent="--color-dept-operations"
        />
        <KpiCard
          label={t('office.kpi.completed_today')}
          value={completedToday}
          hint={allTasks.length === 1 ? t('office.kpi.total_tasks_one') : t('office.kpi.total_tasks_other', { count: allTasks.length })}
          icon={<CheckCircle2 className="h-4 w-4" />}
          accent="--color-emerald"
        />
        <KpiCard
          label={t('office.kpi.failed_today')}
          value={failedToday}
          hint={failedTasks.length > 0 ? t('office.kpi.requires_review') : t('office.kpi.all_clear')}
          icon={<AlertTriangle className="h-4 w-4" />}
          accent="--color-rose"
        />
        <KpiCard
          label={t('office.kpi.pending_tasks')}
          value={totalPending}
          hint={t('office.kpi.across_depts')}
          icon={<Clock className="h-4 w-4" />}
          accent="--color-dept-people"
        />
      </motion.section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ── Left (main) ────────────────────────────────── */}
        <div className="space-y-6 lg:col-span-2">
          {/* Today's Priorities */}
          <motion.section variants={staggerItem}>
            <Card>
              <CardHeader
                title="Today's priorities"
                subtitle="What the Executive Director plans to delegate next"
              />
              <CardSection>
                {todaysPriorities.length === 0 ? (
                  <EmptyState
                    icon={<Sparkles className="h-4 w-4" />}
                    title="Nothing scheduled for today"
                    description="New tasks will appear here as the Executive Director identifies work."
                    action={
                      <Button size="sm" iconLeft={<Plus className="h-3.5 w-3.5" />} onClick={() => (window.location.href = '/tasks')}>
                        {t('office.cta.view_tasks')}
                      </Button>
                    }
                  />
                ) : (
                  <ul className="space-y-2">
                    {todaysPriorities.map((t) => (
                      <TaskRow key={t.id} task={t} />
                    ))}
                  </ul>
                )}
              </CardSection>
            </Card>
          </motion.section>

          {/* Pending Decisions */}
          <motion.section variants={staggerItem}>
            <Card>
              <CardHeader
                title="Pending your decision"
                subtitle={pendingDecisions.length === 0 ? 'No approvals needed' : `${pendingDecisions.length} items need your sign-off`}
              />
              <CardSection>
                {pendingDecisions.length === 0 ? (
                  <EmptyState
                    icon={<CheckCircle2 className="h-4 w-4" />}
                    title="No pending decisions"
                    description="Approvals will surface here as departments submit results."
                  />
                ) : (
                  <ul className="space-y-2">
                    {pendingDecisions.slice(0, 4).map((t) => (
                      <TaskRow key={t.id} task={t} showApproveButtons />
                    ))}
                  </ul>
                )}
              </CardSection>
            </Card>
          </motion.section>

          {/* Risks */}
          <motion.section variants={staggerItem}>
            <Card>
              <CardHeader
                title="Risks & issues"
                subtitle={risks.length === 0 ? 'No risks detected' : `${risks.length} items need attention`}
              />
              <CardSection>
                {risks.length === 0 ? (
                  <EmptyState
                    icon={<AlertTriangle className="h-4 w-4" />}
                    title="All systems nominal"
                    description="No unhealthy departments or failed tasks detected."
                  />
                ) : (
                  <ul className="space-y-2">
                    {risks.map((r) => (
                      <RiskRow key={r.departmentKey + r.title} risk={r} />
                    ))}
                  </ul>
                )}
              </CardSection>
            </Card>
          </motion.section>

          {/* Opportunities */}
          <motion.section variants={staggerItem}>
            <Card>
              <CardHeader
                title="Opportunities"
                subtitle="Departments you could activate right now"
              />
              <CardSection>
                {opportunities.length === 0 ? (
                  <EmptyState
                    icon={<TrendingUp className="h-4 w-4" />}
                    title="All departments activated"
                    description="You're running the full Business Operating System."
                  />
                ) : (
                  <ul className="space-y-2">
                    {opportunities.map((o) => (
                      <OpportunityRow key={o.departmentKey} opportunity={o} />
                    ))}
                  </ul>
                )}
              </CardSection>
            </Card>
          </motion.section>

          {/* Executive Timeline */}
          <motion.section variants={staggerItem}>
            <Card>
              <CardHeader title="Executive timeline" subtitle="Recent company events across departments" />
              <CardSection>
                {timeline.isLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : timelineEvents.length === 0 ? (
                  <EmptyState
                    icon={<History className="h-4 w-4" />}
                    title="No timeline events yet"
                    description="Events from task completions, health checks and messages will appear here."
                  />
                ) : (
                  <div className="space-y-3">
                    {timelineEvents.map((event) => {
                      const pres = getDepartment(event.source_department);
                      return (
                        <TimelineRow key={event.type + event.at} event={event} presentation={pres} />
                      );
                    })}
                  </div>
                )}
              </CardSection>
            </Card>
          </motion.section>

          {/* Recent Activity */}
          <motion.section variants={staggerItem}>
            <Card>
              <CardHeader title="Recent activity" subtitle="Latest tasks and internal messages" />
              <CardSection>
                <ActivityFeed
                  tasks={allTasks}
                  messages={messages.data ?? []}
                  limit={15}
                />
              </CardSection>
            </Card>
          </motion.section>
        </div>

        {/* ── Right column ────────────────────────────────── */}
        <div className="space-y-6">
          {/* Executive Director */}
          <motion.section variants={staggerItem}>
            <Card>
              <CardHeader title="Executive Director" subtitle="Always-on strategic coordinator" />
              <CardSection>
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] text-white"
                    style={{
                      background: `linear-gradient(135deg, var(--color-dept-governance), color-mix(in oklab, var(--color-dept-governance) 60%, var(--accent)))`,
                    }}
                  >
                    <Crown className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[color:var(--foreground)]">{t('office.executive_director.id')}</span>
                      <Badge tone="emerald" size="xs" icon={<Dot tone="emerald" pulse />}>
                        {t('office.executive_director.active')}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-[color:var(--muted-foreground)]">
                      {t('office.executive_director.desc')}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        iconLeft={<MessageSquare className="h-3.5 w-3.5" />}
                        onClick={() => (window.location.href = '/chat/new?department=executive-office')}
                      >
                        {t('office.executive_director.cta1')}
                      </Button>
                      <Link to="/executive-room">
                        <Button size="sm" variant="ghost" iconLeft={<Activity className="h-3.5 w-3.5" />}>
                          {t('office.executive_director.cta2')}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </CardSection>
            </Card>
          </motion.section>

          {/* Department Summary */}
          <motion.section variants={staggerItem}>
            <Card>
              <CardHeader
                title="Department summary"
                subtitle="One-line status per department"
                action={
                  <Link to="/departments">
                    <Button variant="ghost" size="sm" iconRight={<ChevronRight className="h-4 w-4" />}>
                      {t('office.cta.all_teams')}
                    </Button>
                  </Link>
                }
              />
              <CardSection>
                <ul className="space-y-2">
                  {departmentSummaries.slice(0, 8).map((d) => {
                    const pres = getDepartment(d.key);
                    const Icon = iconFromManifest(d.icon);
                    const isActive = d.installation?.lifecycle === 'active';
                    return (
                      <li key={d.key} className="flex items-center gap-2 text-sm">
                        <div
                          className="flex h-6 w-6 items-center justify-center rounded-[var(--radius-sm)]"
                          style={{
                            backgroundColor: pres?.cssVar
                              ? `color-mix(in oklab, var(${pres.cssVar}) 20%, transparent)`
                              : 'var(--surface-soft)',
                          }}
                        >
                          <Icon className="h-3 w-3" style={pres?.cssVar ? { color: `var(${pres.cssVar})` } : undefined} />
                        </div>
                        <span className="truncate text-[color:var(--color-fg-2)]">{d.name}</span>
                        {isActive && (
                          <Badge
                            tone={d.installation?.health === 'healthy' ? 'emerald' : 'amber'}
                            size="xs"
                            icon={<Dot tone={d.installation?.health === 'healthy' ? 'emerald' : 'amber'} pulse={d.installation?.health === 'healthy'} />}
                          >
                            {d.installation?.health ?? 'unknown'}
                          </Badge>
                        )}
                        {!isActive && (
                          <Badge tone="neutral" size="xs" variant="outline">
                            {d.installation?.lifecycle ?? 'available'}
                          </Badge>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </CardSection>
            </Card>
          </motion.section>

          {/* Pulse (sparkline of message volume) */}
          <motion.section variants={staggerItem}>
            <Card>
              <CardHeader
                title={t('office.pulse.title')}
                subtitle={t('office.pulse.subtitle')}
                action={
                  <span className="inline-flex items-center gap-1 text-xs text-[color:var(--muted-foreground)]">
                    <Clock className="h-3 w-3" />
                    {t('office.pulse.window')}
                  </span>
                }
              />
              <CardSection>
                {messages.data && messages.data.length > 0 ? (
                  <div className="space-y-3">
                    <Sparkline
                      values={messages.data
                        .slice(0, 24)
                        .map((m) => (m.type === 'task.completed' ? 3 : m.type === 'task.failed' ? -2 : 1))}
                      width={240}
                      height={48}
                    />
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <Stat label={t('office.pulse.events')} value={messages.data.length} />
                      <Stat label={t('office.pulse.tasks')} value={allTasks.length} />
                      <Stat label={t('office.pulse.departments')} value={departmentSummaries.length} />
                    </div>
                  </div>
                ) : (
                  <EmptyState title={t('office.pulse.empty')} description={t('office.pulse.empty_desc')} />
                )}
              </CardSection>
            </Card>
          </motion.section>

          {/* Corporate Memory */}
          <motion.section variants={staggerItem}>
            <Card>
              <CardHeader
                title="Corporate memory"
                subtitle="Files the Executive Director maintains"
                action={
                  <Link to="/company">
                    <Button variant="ghost" size="sm" iconRight={<ChevronRight className="h-4 w-4" />}>
                      {t('office.cta.manage')}
                    </Button>
                  </Link>
                }
              />
              <CardSection>
                {(memory.data ?? []).length === 0 ? (
                  <EmptyState
                    icon={<FileText className="h-4 w-4" />}
                    title="No memory files yet"
                    description="The Executive Director will generate these as your company evolves."
                  />
                ) : (
                  <ul className="space-y-1">
                    {(memory.data ?? []).slice(0, 5).map((m) => (
                      <li key={m.id}>
                        <Link
                          to={`/company/memory/${m.file_key}`}
                          className="flex items-center gap-3 rounded-[var(--radius-md)] p-2 text-sm hover:bg-[color:var(--color-bg-3)]"
                        >
                          <FileText className="h-4 w-4 text-[color:var(--color-fg-3)]" />
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-medium text-[color:var(--color-fg-1)]">{m.title}</div>
                            <div className="text-xs text-[color:var(--color-fg-3)]">
                              v{m.version} · {formatRelativeTime(m.updated_at)}
                            </div>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </CardSection>
            </Card>
          </motion.section>

          {/* Company Health */}
          <motion.section variants={staggerItem}>
            <Card>
              <CardHeader title="Company health" subtitle="Integration status" />
              <CardSection>
                <ul className="space-y-2 text-sm">
                  <Row
                    label={t('office.company_health.gateway')}
                    value={system.data?.gateway.ok ? `${system.data.gateway.latency_ms} ms` : t('office.health.unreachable')}
                    ok={system.data?.gateway.ok ?? false}
                  />
                  <Row
                    label={t('office.company_health.supabase')}
                    value={system.data?.supabase.configured ? `${system.data.supabase.latency_ms} ms` : '—'}
                    ok={system.data?.supabase.configured ?? false}
                  />
                  <Row
                    label={t('office.company_health.active_depts')}
                    value={`${activeDepartments.length}/${departmentSummaries.length}`}
                    ok={activeDepartments.length > 0}
                  />
                  <Row
                    label={t('office.company_health.active_orchestrations')}
                    value={room.data?.active_orchestrations.length ?? 0}
                    ok={(room.data?.active_orchestrations.length ?? 0) < 5}
                  />
                </ul>
              </CardSection>
            </Card>
          </motion.section>
        </div>
      </div>
    </motion.div>
  );
}

// ── Helper components ──────────────────────────────────────────

function KpiCard({
  label,
  value,
  hint,
  icon,
  accent = '--accent',
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon: React.ReactNode;
  accent?: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 26 }}
      className="overflow-hidden rounded-[var(--radius-lg)] border border-[color:var(--border)] bg-[color:var(--surface)] p-4 shadow-[var(--shadow-soft)]"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] uppercase tracking-wider text-[color:var(--muted-foreground)]">
          {label}
        </span>
        <span
          className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)]"
          style={{
            backgroundColor: `color-mix(in oklab, var(${accent}) 18%, transparent)`,
            color: `var(${accent})`,
          }}
        >
          {icon}
        </span>
      </div>
      <div className="mt-3 text-2xl font-semibold text-[color:var(--foreground)]">{value}</div>
      {hint && (
        <div className="mt-1.5 text-xs text-[color:var(--muted-foreground)]">
          {hint}
        </div>
      )}
    </motion.div>
  );
}

function HealthMetric({
  icon,
  label,
  value,
  hint,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[color:var(--border)] bg-[color:var(--surface-soft)]/40 p-3">
      <span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)]" style={{ backgroundColor: `${color}20`, color }}>
        {icon}
      </span>
      <div>
        <div className="text-sm font-medium text-[color:var(--foreground)]">{value}</div>
        <div className="text-xs text-[color:var(--muted-foreground)]">{label}</div>
      </div>
      {hint && <span className="ml-auto text-xs text-[color:var(--muted-foreground)]">{hint}</span>}
    </div>
  );
}

function TaskRow({
  task,
  showApproveButtons = false,
}: {
  task: {
    id: string;
    title: string;
    description?: string | null;
    department_key: string;
    status: string;
    created_at: string;
    updated_at: string;
    completed_at?: string | null;
    error?: string | null;
  };
  showApproveButtons?: boolean;
}) {
  const { t } = useI18n();
  const pres = getDepartment(task.department_key);
  return (
    <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[color:var(--border)] bg-[color:var(--surface-soft)]/30 p-3">
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)]"
        style={{
          backgroundColor: pres?.cssVar ? `color-mix(in oklab, var(${pres.cssVar}) 20%, transparent)` : 'var(--background-elevated)',
          color: pres?.cssVar ? `var(${pres.cssVar})` : undefined,
        }}
      >
        {pres ? <pres.icon className="h-3.5 w-3.5" /> : <Layers className="h-3.5 w-3.5" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-[color:var(--foreground)]">
          {task.title}
        </div>
        <div className="truncate text-xs text-[color:var(--muted-foreground)]">
          {pres?.name ?? task.department_key} · {t(`task.status.${task.status}`, task.status.replace(/[._]/g, ' '))}
        </div>
      </div>
      <div className="text-right text-xs text-[color:var(--muted-foreground)]">
        {formatRelativeTime(task.updated_at)}
      </div>
      {showApproveButtons && (
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" iconLeft={<CheckCircle2 className="h-3 w-3" />}>
            {t('office.cta.approve')}
          </Button>
          <Button size="sm" variant="ghost" iconLeft={<Pause className="h-3 w-3" />}>
            {t('office.cta.reject')}
          </Button>
        </div>
      )}
    </div>
  );
}

function RiskRow({ risk }: { risk: Risk }) {
  const pres = getDepartment(risk.departmentKey);
  return (
    <div className="flex items-start gap-3 rounded-[var(--radius-md)] border border-[color:var(--rose)]/30 bg-[color:var(--rose-soft)] p-3">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--danger)]" />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-[color:var(--foreground)]">{risk.title}</div>
        <div className="text-xs text-[color:var(--muted-foreground)] text-pretty">
          {risk.description}
        </div>
      </div>
      {pres && (
        <Badge tone="rose" size="xs" variant="outline">
          {pres.shortName}
        </Badge>
      )}
    </div>
  );
}

function OpportunityRow({ opportunity }: { opportunity: Opportunity }) {
  const { t } = useI18n();
  const pres = getDepartment(opportunity.departmentKey);
  return (
    <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[color:var(--border)] bg-[color:var(--surface-soft)]/30 p-3 transition-colors hover:bg-[color:var(--surface-soft)]/60">
      <TrendingUp className="h-4 w-4 text-[color:var(--color-emerald)]" />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-[color:var(--foreground)]">{opportunity.title}</div>
        <div className="truncate text-xs text-[color:var(--muted-foreground)] text-pretty">
          {opportunity.description}
        </div>
      </div>
      <Button size="sm" variant="ghost" iconLeft={<Play className="h-3 w-3" />} onClick={() => (window.location.href = `/departments/${opportunity.departmentKey}`)}>
        {t('office.cta.activate')}
      </Button>
    </div>
  );
}

function TimelineRow({
  event,
  presentation,
}: {
  event: {
    at: string;
    source: string;
    source_department: string;
    target: string | null;
    target_department: string | null;
    type: string;
    subject?: string;
    detail?: string;
  };
  presentation?: {
    key: string;
    name: string;
    shortName: string;
    category: string;
    icon: React.ComponentType<{ className?: string }>;
    accentText: string;
    accentBg: string;
    accentSoft: string;
    cssVar: string;
    color: string;
    shortDescription: string;
  };
}) {
  const { t } = useI18n();
  const pres = presentation;
  return (
    <div className="flex items-start gap-3 rounded-[var(--radius-md)] border border-[color:var(--border)] bg-[color:var(--background-elevated)] p-3 text-xs">
      <div
        className="flex h-6 w-6 items-center justify-center rounded-[var(--radius-sm)]"
        style={{
          backgroundColor: pres?.cssVar ? `color-mix(in oklab, var(${pres.cssVar}) 20%, transparent)` : 'var(--surface-soft)',
        }}
      >
        <History className="h-3 w-3" style={pres?.cssVar ? { color: `var(${pres.cssVar})` } : undefined} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-[color:var(--foreground)]">{t(`event.type.${event.type}`, event.type.replace(/[._]/g, ' '))}</span>
          <span className="text-[color:var(--muted-foreground)]">·</span>
          <span className="text-[color:var(--muted-foreground)]">{event.source_department}</span>
        </div>
        {event.subject && (
          <div className="mt-0.5 truncate text-[color:var(--color-fg-2)]">{event.subject}</div>
        )}
      </div>
      <span className="text-[color:var(--muted-foreground)]">{formatRelativeTime(event.at)}</span>
    </div>
  );
}

function Row({ label, value, ok }: { label: string; value: React.ReactNode; ok?: boolean }) {
  return (
    <li className="flex items-center justify-between gap-2">
      <span className="text-[color:var(--muted-foreground)]">{label}</span>
      <span className="inline-flex items-center gap-1.5 text-[color:var(--foreground)]">
        {typeof ok === 'boolean' && <Dot tone={ok ? 'emerald' : 'rose'} pulse={ok === true} />}
        <span className="font-mono text-xs">{value}</span>
      </span>
    </li>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[var(--radius-md)] bg-[color:var(--color-bg-3)] px-2 py-1.5 text-center">
      <div className="text-base font-semibold text-[color:var(--foreground)]">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-[color:var(--muted-foreground)]">{label}</div>
    </div>
  );
}

// Heartbeat icon alias (lucide exports Activity, used for living status)
const Heartbeat = Activity;
