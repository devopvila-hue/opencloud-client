import { Link } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  Crown,
  FileText,
  Layers,
  Loader2,
  Mail,
  Megaphone,
  MessageSquare,
  Plug,
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
      <motion.header
        variants={fadeUp}
        className="rounded-[var(--radius-2xl)] border border-[color:var(--color-line)] bg-gradient-to-b from-[color:var(--color-bg-2)] to-[color:var(--color-bg-1)] p-6 sm:p-8"
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-[color:var(--color-muted-foreground)]">
              ¿Qué quieres conseguir hoy?
            </span>
          </div>
          <h1 className="font-display text-[clamp(1.75rem,3vw,2.5rem)] leading-[1.1] tracking-[-0.02em] text-[color:var(--foreground)] text-balance">
            Dile a tu empresa qué necesitas y empezaremos.
          </h1>
          <p className="max-w-2xl text-sm text-[color:var(--color-muted-foreground)] text-pretty">
            {system.data?.gateway.ok ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="live-dot" /> Tu empresa está conectada y lista para trabajar.
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[color:var(--color-rose)]">
                <AlertTriangle className="h-3.5 w-3.5" /> No podemos conectar con tu empresa. Revisa la conexión.
              </span>
            )}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              variant="primary"
              size="lg"
              iconLeft={<MessageSquare className="h-4 w-4" />}
              onClick={() => (window.location.href = '/chat/new')}
            >
              Pedir algo a tu empresa
            </Button>
            <Button
              size="lg"
              iconLeft={<Zap className="h-4 w-4" />}
              onClick={() => (window.location.href = '/departments')}
            >
              Activar un equipo
            </Button>
          </div>
        </div>
      </motion.header>

      {/* ── Acciones rápidas ─────────────────────────────────── */}
      <motion.section variants={fadeUp} aria-labelledby="quick-actions">
        <div className="mb-3 flex items-end justify-between">
          <h2
            id="quick-actions"
            className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-[color:var(--color-muted-foreground)]"
          >
            Acciones rápidas
          </h2>
          <Link to="/marketplace" className="text-xs text-[color:var(--color-muted-foreground)] hover:text-[color:var(--foreground)]">
            Ver todas →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {[
            { icon: Megaphone, title: 'Conseguir más clientes', to: '/chat/new?intent=growth' },
            { icon: Calendar, title: 'Preparar una reunión', to: '/chat/new?intent=meeting' },
            { icon: Mail, title: 'Responder correos', to: '/chat/new?intent=inbox' },
            { icon: Megaphone, title: 'Crear una campaña', to: '/chat/new?intent=campaign' },
            { icon: FileText, title: 'Preparar una oferta', to: '/chat/new?intent=offer' },
          ].map((qa) => {
            const Icon = qa.icon;
            return (
              <Link
                key={qa.title}
                to={qa.to}
                className="flex flex-col gap-2 rounded-[var(--radius-lg)] border border-[color:var(--color-line)] bg-[color:var(--color-bg-2)]/40 p-4 transition-all hover:border-[color:var(--color-accent)]/40 hover:bg-[color:var(--color-bg-2)]"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-[22%] bg-[color:var(--color-accent-soft)] text-[color:var(--color-accent)]">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-sm font-medium text-[color:var(--foreground)]">{qa.title}</span>
              </Link>
            );
          })}
        </div>
      </motion.section>

      {/* ── Actividad de Departamentos ─────────────────────── */}
      <motion.section variants={fadeUp} aria-labelledby="dept-activity">
        <div className="mb-3 flex items-end justify-between">
          <h2
            id="dept-activity"
            className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-[color:var(--color-muted-foreground)]"
          >
            Actividad de Departamentos
          </h2>
          <span className="text-xs text-[color:var(--color-muted-foreground)]">Qué está haciendo tu empresa</span>
        </div>
        {activeDepartments.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Briefcase className="h-5 w-5" />}
              title="Activa tu primer equipo"
              description="Elige un departamento y empezaremos a trabajar para tu empresa."
              action={<Button onClick={() => (window.location.href = '/marketplace')}>Ver departamentos</Button>}
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {activeDepartments.slice(0, 4).map((d) => {
              const Icon = iconFromManifest(d.icon);
              return (
                <Link key={d.key} to={`/departments/${d.key}`}>
                  <HealthCard
                    title={d.name}
                    subtitle={`${d.name} — ${runningTasks.filter((t) => t.department_key === d.key).length} tareas en curso`}
                    status={d.installation?.health ?? 'unknown'}
                    checkedAt={d.last_health?.checked_at}
                    durationMs={d.last_health?.duration_ms}
                  />
                </Link>
              );
            })}
          </div>
        )}
      </motion.section>

      {/* ── KPIs ─────────────────────────────────────────────── */}
      <motion.section variants={fadeUp} aria-labelledby="kpis" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <h2 id="kpis" className="sr-only">Indicadores</h2>
        <MetricTile
          label="Equipos activos"
          value={activeDepartments.length}
          hint={`de ${catalog.data?.length ?? 0} disponibles`}
          icon={<Layers className="h-4 w-4" />}
          accent="--color-dept-governance"
        />
        <MetricTile
          label="Tareas en curso"
          value={runningTasks.length}
          hint={`${attentionTasks.length} necesitan tu OK`}
          icon={<Loader2 className={cn('h-4 w-4', runningTasks.length > 0 && 'animate-spin')} />}
          accent="--color-cyan"
        />
        <MetricTile
          label="Terminadas hoy"
          value={completedToday.length}
          hint={pluralize((tasks.data ?? []).length, 'tarea en total')}
          icon={<CheckCircle2 className="h-4 w-4" />}
          accent="--color-emerald"
        />
        <MetricTile
          label="Tiempo de respuesta"
          value={system.data ? `${system.data.gateway.latency_ms} ms` : '—'}
          hint={system.data ? `Base de datos ${system.data.supabase.latency_ms} ms` : 'midiendo…'}
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
                title="Lo que necesita tu atención"
                subtitle={attentionTasks.length === 0 ? 'Nada urgente. Buen trabajo.' : `${attentionTasks.length} pendientes de acción`}
                action={
                  <Button variant="ghost" size="sm" iconRight={<ArrowRight className="h-4 w-4" />} onClick={() => (window.location.href = '/tasks')}>
                    Ver cola
                  </Button>
                }
              />
              {attentionTasks.length === 0 ? (
                <EmptyState
                  icon={<CheckCircle2 className="h-5 w-5" />}
                  title="Nada necesita tu atención"
                  description="Las aprobaciones, errores y vencimientos aparecerán aquí en tiempo real."
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
                title="Actividad reciente"
                subtitle="Tareas y mensajes de todos los departamentos"
              />
              <ActivityFeed tasks={tasks.data ?? []} messages={messages.data ?? []} limit={10} />
            </Card>
          </motion.section>

          {/* Department health */}
          <motion.section variants={fadeUp}>
            <Card>
              <CardHeader
                title="Salud de los departamentos"
                subtitle="Estado en tiempo real de cada equipo activo"
                action={
                  <Button variant="ghost" size="sm" iconRight={<ArrowRight className="h-4 w-4" />} onClick={() => (window.location.href = '/departments')}>
                    Ver todos
                  </Button>
                }
              />
              {activeDepartments.length === 0 ? (
                <EmptyState
                  icon={<Crown className="h-5 w-5" />}
                  title="Aún no hay departamentos activos"
                  description="Activa uno desde el catálogo para ver su estado en vivo."
                  action={<Button onClick={() => (window.location.href = '/departments')}>Ver catálogo</Button>}
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
                  <div className="mt-1 text-xs text-[color:var(--color-fg-3)]">Equipos activos</div>
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
