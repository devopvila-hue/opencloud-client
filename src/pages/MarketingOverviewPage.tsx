import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Activity,
  BarChart3,
  Bot,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Crown,
  FileText,
  Megaphone,
  MessageSquare,
  Settings as SettingsIcon,
  Sparkles,
} from 'lucide-react';
import { Card, CardHeader, CardSection } from '@/components/Card';
import { Badge, Dot } from '@/components/Badge';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { MetricTile } from '@/components/MetricTile';
import { ActivityFeed } from '@/components/ActivityFeed';
import { AgentCard } from '@/components/AgentCard';
import { HealthCard } from '@/components/HealthCard';
import { ProgressBar } from '@/components/Chart';
import {
  useConversations,
  useDepartment,
  useDepartmentCatalog,
  useInternalMessages,
  useTasks,
} from '@/api/queries';
import { formatRelativeTime, truncate } from '@/utils/format';
import { iconFromManifest } from '@/design-system/departments';
import { cn } from '@/design-system/cn';

interface SpecialistView {
  id: string;
  role: 'manager' | 'specialist';
  capabilities: string[];
  status: string;
}

const MARKETING_SPECIALISTS: SpecialistView[] = [
  { id: 'market-research', role: 'specialist', capabilities: ['market_analysis', 'competitor_benchmark', 'icp_definition', 'buyer_persona', 'trend_scanning'], status: 'active' },
  { id: 'brand-manager', role: 'specialist', capabilities: ['positioning', 'tone_of_voice', 'brand_guidelines', 'message_consistency'], status: 'active' },
  { id: 'content-strategist', role: 'specialist', capabilities: ['editorial_calendar', 'content_pillars', 'topic_ideation', 'content_roadmap'], status: 'active' },
  { id: 'copywriter', role: 'specialist', capabilities: ['landing_copy', 'email_copy', 'ad_copy', 'cta_design'], status: 'active' },
  { id: 'email-marketing', role: 'specialist', capabilities: ['email_sequences', 'newsletters', 'segmentation', 'subject_lines'], status: 'active' },
  { id: 'social-media', role: 'specialist', capabilities: ['instagram', 'linkedin', 'tiktok', 'facebook', 'social_calendar'], status: 'active' },
  { id: 'campaign-manager', role: 'specialist', capabilities: ['campaign_planning', 'launches', 'kpi_tracking', 'performance_follow_up'], status: 'active' },
  { id: 'marketing-analytics', role: 'specialist', capabilities: ['kpi_reporting', 'roi_analysis', 'conversion_funnel', 'insights'], status: 'active' },
];

const WORKFLOWS = [
  { id: 'investigation', name: 'Investigación', description: 'Mercado → competencia → marca', icon: BarChart3, specialists: ['market-research', 'brand-manager'] },
  { id: 'strategy', name: 'Estrategia', description: 'Posicionamiento → contenido → roadmap', icon: Sparkles, specialists: ['brand-manager', 'content-strategist'] },
  { id: 'editorial_plan', name: 'Plan editorial', description: 'Pilares → calendario → canales', icon: Calendar, specialists: ['content-strategist', 'social-media'] },
  { id: 'production', name: 'Producción', description: 'Copy → email → social', icon: FileText, specialists: ['copywriter', 'email-marketing', 'social-media'] },
  { id: 'review', name: 'Revisión', description: 'Validación de marca', icon: CheckCircle2, specialists: ['brand-manager'] },
  { id: 'optimization', name: 'Optimización', description: 'Analítica → campaña', icon: Activity, specialists: ['marketing-analytics', 'campaign-manager'] },
  { id: 'report', name: 'Informe', description: 'Resultados y próximos pasos', icon: BarChart3, specialists: ['marketing-analytics'] },
];

export default function MarketingOverviewPage() {
  const catalog = useDepartmentCatalog();
  const def = useDepartment('marketing');
  const tasks = useTasks({ departmentKey: 'marketing', limit: 30 });
  const messages = useInternalMessages({ departmentKey: 'marketing', limit: 30 });
  const conversations = useConversations();

  const marketingEntry = (catalog.data ?? []).find((d) => d.key === 'marketing');
  const lifecycle = def.data?.installation?.lifecycle ?? marketingEntry?.installation?.lifecycle ?? 'available';
  const health = def.data?.installation?.health ?? marketingEntry?.installation?.health ?? 'unknown';
  const lastHealth = def.data?.lastHealth;
  const capabilities = def.data?.manifest.capabilities ?? marketingEntry?.capabilities ?? [];
  const description = def.data?.manifest.description ?? marketingEntry?.description ?? '';
  const Icon = iconFromManifest(def.data?.manifest.icon ?? marketingEntry?.icon ?? 'megaphone');

  const completedTasks = (tasks.data ?? []).filter((t) => t.status === 'completed');
  const runningTasks = (tasks.data ?? []).filter((t) => ['running', 'assigned', 'queued'].includes(t.status));

  const marketingConversations = (conversations.data ?? []).filter((c) => c.department_key === 'marketing');

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-6 lg:p-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] text-white"
            style={{
              backgroundColor: 'color-mix(in oklab, var(--color-dept-revenue) 80%, transparent)',
              color: 'var(--color-dept-revenue)',
            }}
          >
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Marketing</h1>
              <Badge tone={lifecycle === 'active' ? 'emerald' : 'neutral'} size="sm" icon={<Dot tone={lifecycle === 'active' ? 'emerald' : 'neutral'} pulse={lifecycle === 'active'} />}>
                {lifecycle}
              </Badge>
              <Badge tone={health === 'healthy' ? 'emerald' : health === 'degraded' ? 'amber' : 'neutral'} size="sm" variant="outline">
                {health}
              </Badge>
            </div>
            <p className="mt-1 max-w-2xl text-sm text-[color:var(--color-fg-3)]">{description}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="primary"
            iconLeft={<MessageSquare className="h-4 w-4" />}
            onClick={() => (window.location.href = '/chat/new?department=marketing')}
          >
            Hablar con el equipo
          </Button>
          <Button
            variant="outline"
            iconLeft={<SettingsIcon className="h-4 w-4" />}
            onClick={() => (window.location.href = '/departments/marketing')}
          >
            Configurar
          </Button>
        </div>
      </header>

      {/* KPIs */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile label="Tareas completadas" value={completedTasks.length} icon={<CheckCircle2 className="h-4 w-4" />} accent="--color-emerald" />
        <MetricTile label="Tareas activas" value={runningTasks.length} icon={<Activity className="h-4 w-4" />} accent="--color-cyan" />
        <MetricTile label="Conversaciones" value={marketingConversations.length} icon={<MessageSquare className="h-4 w-4" />} accent="--color-dept-revenue" />
        <MetricTile label="Especialistas" value={MARKETING_SPECIALISTS.length} icon={<Bot className="h-4 w-4" />} accent="--color-violet" />
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Columna izquierda */}
        <div className="space-y-6 lg:col-span-2">
          {/* Capacidades */}
          <Card>
            <CardHeader title="Capacidades" subtitle="Lo que el departamento puede entregar" />
            <div className="flex flex-wrap gap-2">
              {capabilities.map((c) => (
                <span
                  key={c}
                  className="inline-flex h-7 items-center rounded-full bg-[color:var(--color-bg-3)] px-3 text-xs text-[color:var(--color-fg-2)]"
                >
                  {c}
                </span>
              ))}
            </div>
          </Card>

          {/* Equipo */}
          <Card>
            <CardHeader
              title="Equipo"
              subtitle="Marketing Manager y 8 especialistas coordinados"
            />
            <div className="mb-4 flex items-center gap-3 rounded-[var(--radius-md)] border border-[color:var(--color-line)] bg-[color:var(--color-accent-soft)] p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[color:var(--color-dept-revenue)] text-white">
                <Megaphone className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[color:var(--color-fg-1)]">marketing-manager</span>
                  <Badge tone="emerald" size="xs" icon={<Dot tone="emerald" pulse />}>active</Badge>
                  <Badge tone="violet" size="xs" variant="outline">manager</Badge>
                </div>
                <p className="mt-0.5 text-xs text-[color:var(--color-fg-3)]">
                  Coordina a los 8 especialistas y devuelve el resultado al Executive Director.
                </p>
              </div>
              <Link to="/chat/new?department=marketing" className="text-xs text-[color:var(--color-accent)] hover:underline">
                Hablar →
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {MARKETING_SPECIALISTS.map((s) => {
                const entry = marketingEntry;
                return (
                  <AgentCard
                    key={s.id}
                    agentId={s.id}
                    entry={entry ?? { ...marketingEntryFallback('marketing'), key: 'marketing' } as never}
                    role={s.role}
                    status={s.status}
                    capabilities={s.capabilities}
                  />
                );
              })}
            </div>
          </Card>

          {/* Workflows */}
          <Card>
            <CardHeader title="Workflows" subtitle="7 cadenas operativas que el manager orquesta" />
            <ul className="divide-y divide-[color:var(--color-line)]">
              {WORKFLOWS.map((w) => {
                const WIcon = w.icon;
                return (
                  <li key={w.id} className="flex items-center gap-3 py-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-[color:var(--color-dept-revenue-soft)] text-[color:var(--color-dept-revenue)]">
                      <WIcon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-[color:var(--color-fg-1)]">{w.name}</div>
                      <div className="text-xs text-[color:var(--color-fg-3)]">{w.description}</div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {w.specialists.map((s) => (
                          <span
                            key={s}
                            className="inline-flex h-5 items-center rounded-full bg-[color:var(--color-bg-3)] px-1.5 text-[10px] text-[color:var(--color-fg-3)]"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                    <Badge tone="neutral" size="xs" variant="outline">
                      {w.specialists.length} specialists
                    </Badge>
                  </li>
                );
              })}
            </ul>
          </Card>

          {/* Actividad reciente */}
          <Card>
            <CardHeader title="Actividad reciente" subtitle="Tareas y mensajes del departamento" />
            <ActivityFeed tasks={tasks.data ?? []} messages={messages.data ?? []} limit={12} />
          </Card>
        </div>

        {/* Columna derecha */}
        <div className="space-y-6">
          {/* Health */}
          <HealthCard
            title="Estado del departamento"
            subtitle={lifecycle}
            status={health}
            checkedAt={lastHealth?.checked_at ?? marketingEntry?.last_health?.checked_at}
            durationMs={lastHealth?.duration_ms ?? marketingEntry?.last_health?.duration_ms}
          />

          {/* Conversaciones */}
          <Card>
            <CardHeader
              title="Conversaciones con marketing"
              subtitle={`${marketingConversations.length} total`}
              action={
                <Link to="/chat" className="text-xs text-[color:var(--color-accent)] hover:underline">
                  Ver todas
                </Link>
              }
            />
            {marketingConversations.length === 0 ? (
              <EmptyState
                icon={<MessageSquare className="h-5 w-5" />}
                title="Sin conversaciones"
                description="Inicia una para hablar con el equipo de marketing."
                action={
                  <Button size="sm" onClick={() => (window.location.href = '/chat/new?department=marketing')}>
                    Iniciar
                  </Button>
                }
              />
            ) : (
              <ul className="space-y-1">
                {marketingConversations.slice(0, 5).map((c) => (
                  <li key={c.id}>
                    <Link
                      to={`/chat/${c.id}`}
                      className="flex items-center gap-2 rounded-[var(--radius-md)] p-2 hover:bg-[color:var(--color-bg-3)]"
                    >
                      <MessageSquare className="h-3.5 w-3.5 text-[color:var(--color-fg-3)]" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-[color:var(--color-fg-1)]">
                          {truncate(c.title || 'Sin título', 40)}
                        </div>
                        <div className="text-xs text-[color:var(--color-fg-3)]">
                          {formatRelativeTime(c.updated_at)}
                        </div>
                      </div>
                      <ChevronRight className="h-3 w-3 text-[color:var(--color-fg-3)]" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Activation progress */}
          <Card>
            <CardHeader title="Activación del departamento" subtitle="Cobertura operativa" />
            <div className="space-y-3">
              <ProgressBar
                value={
                  MARKETING_SPECIALISTS.filter((s) => s.status === 'active').length /
                  MARKETING_SPECIALISTS.length * 100
                }
                showLabel
                size="sm"
              />
              <p className="text-xs text-[color:var(--color-fg-3)]">
                {MARKETING_SPECIALISTS.filter((s) => s.status === 'active').length} de {MARKETING_SPECIALISTS.length} especialistas operativos
              </p>
            </div>
          </Card>

          {/* Notas */}
          <Card>
            <CardHeader title="Cómo hablar con marketing" />
            <ol className="space-y-2 text-sm text-[color:var(--color-fg-2)]">
              <li className="flex gap-2">
                <span className="text-[color:var(--color-accent)]">1.</span>
                Habla en español. El manager responde en tu idioma.
              </li>
              <li className="flex gap-2">
                <span className="text-[color:var(--color-accent)]">2.</span>
                Cada respuesta sigue el esquema canónico: Objetivo, Resumen, Análisis, Recomendaciones, Entregables, Riesgos, Próximos pasos, Estado.
              </li>
              <li className="flex gap-2">
                <span className="text-[color:var(--color-accent)]">3.</span>
                El manager orquesta a los specialists. No tienes que nombrarlos.
              </li>
              <li className="flex gap-2">
                <span className="text-[color:var(--color-accent)]">4.</span>
                Las tareas departamentales siguen el flujo del Department Core (Fase 3).
              </li>
            </ol>
          </Card>

          {/* Quick actions */}
          <Card>
            <CardHeader title="Acciones rápidas" />
            <div className="space-y-2">
              <QuickAction
                icon={<MessageSquare className="h-4 w-4" />}
                label="Iniciar conversación"
                hint="Hablar con el equipo de marketing"
                onClick={() => (window.location.href = '/chat/new?department=marketing')}
              />
              <QuickAction
                icon={<Sparkles className="h-4 w-4" />}
                label="Pedir una campaña"
                hint="'Quiero captar 100 autónomos en 3 meses'"
                onClick={() => (window.location.href = '/chat/new?department=marketing&prompt=campaign')}
              />
              <QuickAction
                icon={<SettingsIcon className="h-4 w-4" />}
                label="Configurar capacidades"
                hint="Activar / desactivar specialists"
                onClick={() => (window.location.href = '/departments/marketing')}
              />
              <QuickAction
                icon={<Crown className="h-4 w-4" />}
                label="Executive Office"
                hint="Coordinación cross-departamento"
                onClick={() => (window.location.href = '/executive-office')}
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function QuickAction({
  icon,
  label,
  hint,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-[var(--radius-md)] border border-[color:var(--color-line)] px-3 py-2 text-left transition-colors',
        'hover:border-[color:var(--color-line-strong)] hover:bg-[color:var(--color-bg-3)]',
      )}
    >
      <span className="text-[color:var(--color-fg-3)]">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-[color:var(--color-fg-1)]">{label}</div>
        <div className="truncate text-xs text-[color:var(--color-fg-3)]">{hint}</div>
      </div>
      <ChevronRight className="h-3 w-3 text-[color:var(--color-fg-3)]" />
    </button>
  );
}

function marketingEntryFallback(key: string) {
  return {
    key,
    name: 'Marketing',
    version: '1.0.0',
    category: 'revenue',
    description: 'Departamento de marketing',
    icon: 'megaphone',
    manager_agent_id: 'marketing-manager',
    capabilities: [],
    dependencies: [],
    permissions: [],
    configuration_schema: {},
    metadata: {},
    license: null,
    installation: null,
    manager: null,
    last_health: null,
  };
}