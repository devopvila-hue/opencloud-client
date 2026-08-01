import { Link } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Crown,
  Layers,
  Loader2,
  Megaphone,
  MessageSquare,
  Plug,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Card, CardHeader } from '@/components/Card';
import { Badge, Dot } from '@/components/Badge';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { HealthCard } from '@/components/HealthCard';
import { MetricTile } from '@/components/MetricTile';
import { ProgressBar, Sparkline } from '@/components/Chart';
import { ActivityFeed } from '@/components/ActivityFeed';
import { TaskCard } from '@/components/TaskCard';
import {
  useConversations,
  useDepartmentCatalog,
  useInternalMessages,
  useSystemStatus,
  useTasks,
} from '@/api/queries';
import { formatDuration, formatRelativeTime, pluralize } from '@/utils/format';
import { getDepartment, iconFromManifest } from '@/design-system/departments';
import { cn } from '@/design-system/cn';

const stagger: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.02 },
  },
};
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.16, 1, 0.3, 1] } },
};

export default function DashboardPage() {
  const system = useSystemStatus();
  const catalog = useDepartmentCatalog();
  const tasks = useTasks({ limit: 30 });
  const messages = useInternalMessages({ limit: 30 });
  const conversations = useConversations();

  const activeDepartments = (catalog.data ?? []).filter((d) => d.installation?.lifecycle === 'active');
  const attentionTasks = (tasks.data ?? []).filter((t) =>
    ['waiting_approval', 'failed', 'expired'].includes(t.status),
  );
  const runningTasks = (tasks.data ?? []).filter((t) => ['running', 'assigned', 'queued'].includes(t.status));
  const completedToday = (tasks.data ?? []).filter((t) => {
    if (t.status !== 'completed' || !t.completed_at) return false;
    const diff = Date.now() - new Date(t.completed_at).getTime();
    return diff < 24 * 3600_000;
  });

  const isGatewayLive = system.data?.gateway.ok ?? false;
  const recentMessages = (messages.data ?? []).slice(0, 8);
  const sparkValues = (messages.data ?? [])
    .slice(0, 24)
    .map((m) => (m.type === 'task.completed' ? 3 : m.type === 'task.failed' ? -2 : 1));

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-6 lg:p-8">
      <motion.header variants={fadeUp} className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Welcome back</h1>
          <p className="mt-1 text-sm text-[color:var(--color-fg-3)]">
            {system.data?.gateway.ok ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="live-dot" /> Gateway connected · {system.data.gateway.models.length} models available
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[color:var(--color-rose)]">
                <AlertTriangle className="h-3.5 w-3.5" /> Gateway unreachable
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button iconLeft={<MessageSquare className="h-4 w-4" />} onClick={() => (window.location.href = '/chat/new')}>
            New conversation
          </Button>
          <Button
            variant="primary"
            iconLeft={<Zap className="h-4 w-4" />}
            onClick={() => (window.location.href = '/departments')}
          >
            Browse departments
          </Button>
        </div>
      </motion.header>

      {/* ── KPIs ───────────────────────────────────────────── */}
      <motion.section variants={fadeUp} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile
          label="Active departments"
          value={activeDepartments.length}
          hint={`of ${catalog.data?.length ?? 0} available`}
          icon={<Layers className="h-4 w-4" />}
          accent="--color-dept-governance"
        />
        <MetricTile
          label="Tasks running"
          value={runningTasks.length}
          hint={`${attentionTasks.length} need attention`}
          icon={<Loader2 className={cn('h-4 w-4', runningTasks.length > 0 && 'animate-spin')} />}
          accent="--color-cyan"
        />
        <MetricTile
          label="Completed today"
          value={completedToday.length}
          hint={pluralize((tasks.data ?? []).length, 'total task')}
          icon={<CheckCircle2 className="h-4 w-4" />}
          accent="--color-emerald"
        />
        <MetricTile
          label="Gateway latency"
          value={system.data ? `${system.data.gateway.latency_ms} ms` : '—'}
          hint={system.data ? `Supabase ${system.data.supabase.latency_ms} ms` : 'measuring…'}
          icon={<Activity className="h-4 w-4" />}
          accent="--color-accent"
        />
      </motion.section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ── Left column (2 cols) ──────────────────────────── */}
        <div className="space-y-6 lg:col-span-2">
          {/* Tasks needing attention */}
          <motion.section variants={fadeUp}>
            <Card>
              <CardHeader
                title="What needs your attention"
                subtitle={attentionTasks.length === 0 ? 'Nothing urgent. Nice work.' : `${attentionTasks.length} items need action`}
                action={
                  <Button variant="ghost" size="sm" iconRight={<ArrowRight className="h-4 w-4" />} onClick={() => (window.location.href = '/tasks')}>
                    Open queue
                  </Button>
                }
              />
              {attentionTasks.length === 0 ? (
                <EmptyState
                  icon={<Sparkles className="h-5 w-5" />}
                  title="Nothing needs your attention"
                  description="Approvals, failures and expirations will surface here in real time."
                />
              ) : (
                <div className="space-y-2">
                  {attentionTasks.slice(0, 4).map((t) => (
                    <TaskCard key={t.id} task={t} onClick={() => (window.location.href = `/tasks/${t.id}`)} />
                  ))}
                </div>
              )}
            </Card>
          </motion.section>

          {/* Recent activity */}
          <motion.section variants={fadeUp}>
            <Card>
              <CardHeader
                title="Recent activity"
                subtitle="Tasks and internal messages across every department"
              />
              <ActivityFeed tasks={tasks.data ?? []} messages={messages.data ?? []} limit={10} />
            </Card>
          </motion.section>

          {/* Department health */}
          <motion.section variants={fadeUp}>
            <Card>
              <CardHeader
                title="Department health"
                subtitle="Live status from each active department"
                action={
                  <Button variant="ghost" size="sm" iconRight={<ArrowRight className="h-4 w-4" />} onClick={() => (window.location.href = '/departments')}>
                    All departments
                  </Button>
                }
              />
              {activeDepartments.length === 0 ? (
                <EmptyState
                  icon={<Crown className="h-5 w-5" />}
                  title="No departments activated yet"
                  description="Activate a department from the catalog to see live health here."
                  action={<Button onClick={() => (window.location.href = '/departments')}>Open catalog</Button>}
                />
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {activeDepartments.slice(0, 4).map((d) => {
                    const Icon = iconFromManifest(d.icon);
                    return (
                      <Link key={d.key} to={`/departments/${d.key}`} className="block">
                        <HealthCard
                          title={d.name}
                          subtitle={`${d.name} manager`}
                          status={d.installation?.health ?? 'unknown'}
                          checkedAt={d.last_health?.checked_at}
                          durationMs={d.last_health?.duration_ms}
                        />
                      </Link>
                    );
                  })}
                </div>
              )}
            </Card>
          </motion.section>
        </div>

        {/* ── Right column ──────────────────────────────────── */}
        <div className="space-y-6">
          {/* Executive Director */}
          <motion.section variants={fadeUp}>
            <Card>
              <CardHeader title="Executive Director" subtitle="Always-on strategic coordinator" />
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[color:var(--color-accent-soft)] text-[color:var(--color-accent)]">
                  <Crown className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-[color:var(--color-fg-2)]">
                    Talk to your Executive Director about any goal, report or department.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge tone="emerald" size="xs" icon={<Dot tone="emerald" pulse />}>active</Badge>
                    <Badge tone="violet" size="xs" variant="outline">
                      manager
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Button
                      size="sm"
                      iconLeft={<MessageSquare className="h-4 w-4" />}
                      onClick={() => (window.location.href = '/executive-office')}
                    >
                      Open office
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </motion.section>

          {/* Throughput chart */}
          <motion.section variants={fadeUp}>
            <Card>
              <CardHeader
                title="Pulse"
                subtitle="Last 24 internal messages"
                action={
                  <span className="inline-flex items-center gap-1 text-xs text-[color:var(--color-fg-3)]">
                    <Clock className="h-3 w-3" /> 24h
                  </span>
                }
              />
              {sparkValues.length > 0 ? (
                <div className="space-y-3">
                  <Sparkline values={sparkValues} width={260} height={48} />
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <Stat label="events" value={recentMessages.length} />
                    <Stat label="tasks" value={(tasks.data ?? []).length} />
                    <Stat label="convos" value={(conversations.data ?? []).length} />
                  </div>
                </div>
              ) : (
                <EmptyState title="No activity yet" description="Once departments start working you'll see real-time pulse here." />
              )}
            </Card>
          </motion.section>

          {/* Marketing widget (Phase 5) */}
          <motion.section variants={fadeUp}>
            <MarketingWidget
              tasks={tasks.data ?? []}
              conversations={conversations.data ?? []}
            />
          </motion.section>

          {/* Quick stats */}
          <motion.section variants={fadeUp}>
            <Card>
              <CardHeader title="Workspace" subtitle="Capacity & integration status" />
              <ul className="space-y-3 text-sm">
                <Row label="Gateway" value={isGatewayLive ? 'Connected' : 'Unreachable'} ok={isGatewayLive} />
                <Row
                  label="Supabase"
                  value={system.data ? `${formatDuration(system.data.supabase.latency_ms)}` : '…'}
                  ok={system.data?.supabase.configured ?? false}
                />
                <Row
                  label="Middleware"
                  value={system.data?.middleware_version ?? 'unknown'}
                  ok={!!system.data}
                />
                <Row
                  label="Active departments"
                  value={`${activeDepartments.length}/${catalog.data?.length ?? 0}`}
                />
                <li>
                  <ProgressBar
                    value={
                      catalog.data && catalog.data.length
                        ? (activeDepartments.length / catalog.data.length) * 100
                        : 0
                    }
                    showLabel
                    size="sm"
                  />
                  <div className="mt-1 text-xs text-[color:var(--color-fg-3)]">Department activation</div>
                </li>
              </ul>
              <div className="mt-4">
                <Button variant="outline" size="sm" iconLeft={<Plug className="h-4 w-4" />} onClick={() => (window.location.href = '/integrations')}>
                  Connect more
                </Button>
              </div>
            </Card>
          </motion.section>

          {/* Recently used conversations */}
          <motion.section variants={fadeUp}>
            <Card padding="sm">
              <CardHeader
                title="Recent conversations"
                subtitle={(conversations.data ?? []).length === 0 ? 'Start your first chat' : `${(conversations.data ?? []).length} total`}
                action={
                  <Button variant="ghost" size="sm" iconRight={<ArrowRight className="h-4 w-4" />} onClick={() => (window.location.href = '/chat')}>
                    View all
                  </Button>
                }
              />
              {(conversations.data ?? []).length === 0 ? (
                <p className="px-1 pb-2 text-xs text-[color:var(--color-fg-3)]">No conversations yet — open a new one to start working with the Executive Director.</p>
              ) : (
                <ul className="space-y-1">
                  {(conversations.data ?? []).slice(0, 4).map((c) => {
                    const pres = getDepartment(c.department_key);
                    return (
                      <li key={c.id}>
                        <Link
                          to={`/chat/${c.id}`}
                          className="flex items-center gap-2 rounded-[var(--radius-md)] p-2 hover:bg-[color:var(--color-bg-3)]"
                        >
                          <div className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] bg-[color:var(--color-bg-3)]">
                            <MessageSquare className="h-3.5 w-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium text-[color:var(--color-fg-1)]">
                              {c.title || 'Untitled'}
                            </div>
                            <div className="truncate text-xs text-[color:var(--color-fg-3)]">
                              {pres?.name ?? c.department_key} · {formatRelativeTime(c.updated_at)}
                            </div>
                          </div>
                          <ArrowRight className="h-3.5 w-3.5 text-[color:var(--color-fg-3)]" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          </motion.section>
        </div>
      </div>
    </motion.div>
  );
}

function Row({ label, value, ok }: { label: string; value: React.ReactNode; ok?: boolean }) {
  return (
    <li className="flex items-center justify-between gap-2">
      <span className="text-[color:var(--color-fg-3)]">{label}</span>
      <span className="inline-flex items-center gap-1.5 text-[color:var(--color-fg-1)]">
        {typeof ok === 'boolean' && (
          <Dot tone={ok ? 'emerald' : 'rose'} pulse={ok === true} />
        )}
        <span className="font-mono text-xs">{value}</span>
      </span>
    </li>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[var(--radius-md)] bg-[color:var(--color-bg-3)] p-2">
      <div className="text-base font-semibold text-[color:var(--color-fg-1)]">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-[color:var(--color-fg-3)]">{label}</div>
    </div>
  );
}
function MarketingWidget({ tasks, conversations }: { tasks: { status: string }[]; conversations: { department_key: string; updated_at: string; title: string; id: string }[] }) {
  const marketingTasks = tasks.filter((t) => ['completed', 'failed', 'waiting_approval'].includes(t.status));
  const marketingConversations = conversations.filter((c) => c.department_key === 'marketing').slice(0, 3);
  return (
    <Card>
      <CardHeader
        title="Marketing"
        subtitle="Primer departamento comercial operativo"
        action={
          <Button variant="ghost" size="sm" iconRight={<ArrowRight className="h-4 w-4" />} onClick={() => (window.location.href = '/marketing')}>
            Open
          </Button>
        }
      />
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[color:var(--color-dept-revenue-soft)] text-[color:var(--color-dept-revenue)]">
          <Megaphone className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[color:var(--color-fg-1)]">8 specialists operativos</span>
            <Badge tone="emerald" size="xs" icon={<Dot tone="emerald" pulse />}>
              active
            </Badge>
          </div>
          <p className="mt-1 text-xs text-[color:var(--color-fg-3)]">
            Manager + 8 especialistas coordinados. Pide campañas, contenido, marca, email, social, research o analytics desde el chat.
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <Stat label="completed" value={marketingTasks.filter((t) => t.status === 'completed').length} />
            <Stat label="attention" value={marketingTasks.filter((t) => t.status === 'waiting_approval').length} />
            <Stat label="convos" value={marketingConversations.length} />
          </div>
          {marketingConversations.length > 0 && (
            <div className="mt-3 space-y-1">
              {marketingConversations.map((c) => (
                <Link key={c.id} to={`/chat/${c.id}`} className="flex items-center gap-2 rounded-[var(--radius-md)] px-2 py-1 text-xs hover:bg-[color:var(--color-bg-3)]">
                  <MessageSquare className="h-3 w-3 text-[color:var(--color-fg-3)]" />
                  <span className="flex-1 truncate text-[color:var(--color-fg-2)]">{c.title}</span>
                  <span className="text-[10px] text-[color:var(--color-fg-3)]">{formatRelativeTime(c.updated_at)}</span>
                </Link>
              ))}
            </div>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button size="sm" iconLeft={<MessageSquare className="h-3.5 w-3.5" />} onClick={() => (window.location.href = '/chat/new?department=marketing')}>
              Hablar con marketing
            </Button>
            <Button size="sm" variant="ghost" onClick={() => (window.location.href = '/departments/marketing')}>
              Configurar
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
