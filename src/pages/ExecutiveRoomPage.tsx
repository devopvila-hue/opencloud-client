import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock,
  Crown,
  Loader2,
  MessageSquare,
  Pause,
  Play,
  Shield,
  Timer,
  Users,
  X,
} from 'lucide-react';
import { Card, CardHeader, CardSection } from '@/components/Card';
import { Badge, Dot } from '@/components/Badge';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { MetricTile } from '@/components/MetricTile';
import { ProgressBar } from '@/components/Chart';
import {
  useCancelOrchestration,
  useExecutiveRoom,
  useOrchestrations,
  useResumeOrchestration,
} from '@/api/queries';
import { formatRelativeTime } from '@/utils/format';
import { cn } from '@/design-system/cn';

const STATUS_COLORS: Record<string, string> = {
  idle: 'color-mix(in oklab, var(--color-text-muted) 70%, transparent)',
  working: 'color-mix(in oklab, var(--color-dept-revenue) 90%, transparent)',
  waiting: 'color-mix(in oklab, var(--color-warning) 80%, transparent)',
  blocked: 'color-mix(in oklab, var(--color-danger) 80%, transparent)',
  review: 'color-mix(in oklab, var(--color-info) 80%, transparent)',
  offline: 'color-mix(in oklab, var(--color-text-muted) 100%, transparent)',
};

const STATUS_LABELS: Record<string, string> = {
  idle: 'Inactivo',
  working: 'Trabajando',
  waiting: 'Esperando',
  blocked: 'Bloqueado',
  review: 'Revisión',
  offline: 'Sin conexión',
};

export default function ExecutiveRoomPage() {
  const room = useExecutiveRoom();
  const orchestrations = useOrchestrations('open');
  const cancelMutation = useCancelOrchestration();
  const resumeMutation = useResumeOrchestration();

  const roomData = room.data;
  const orchList = orchestrations.data ?? [];

  if (room.isLoading) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-6 lg:p-8">
        <div className="flex items-center gap-3 text-text-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Cargando Executive Room...</span>
        </div>
      </div>
    );
  }

  if (!roomData) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-6 lg:p-8">
        <EmptyState
          title="Sin datos del Executive Room"
          description="La sala del Executive Director no tiene datos todavía."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-6 lg:p-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)]"
            style={{
              backgroundColor: 'color-mix(in oklab, var(--color-dept-governance) 80%, transparent)',
              color: 'var(--color-dept-governance)',
            }}
          >
            <Crown className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Executive Room</h1>
            <p className="text-sm text-text-muted">
              Vista en vivo de la empresa: departamentos, orquestaciones activas, mensajes del
              Department Bus y KPIs operativos.
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-text-muted">
              <span>Última actualización: {formatRelativeTime(roomData.generated_at)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="accent">Phase 6</Badge>
          <Link to="/timeline">
            <Button variant="ghost" size="sm">
              <Activity className="mr-1 h-4 w-4" />
              Timeline
            </Button>
          </Link>
          <Link to="/internal-messages">
            <Button variant="ghost" size="sm">
              <MessageSquare className="mr-1 h-4 w-4" />
              Mensajes internos
            </Button>
          </Link>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile
          label="Departamentos activos"
          value={roomData.departments.filter((d) => d.status !== 'offline').length}
          subtitle={`${roomData.departments.length} totales`}
          icon={<Building2 className="h-4 w-4" />}
        />
        <MetricTile
          label="Orquestaciones activas"
          value={roomData.active_orchestrations.length}
          subtitle={`${roomData.pending_human_approvals} esperan aprobación`}
          icon={<Activity className="h-4 w-4" />}
        />
        <MetricTile
          label="Tasa de éxito"
          value={`${Math.round(roomData.averages.success_rate * 100)}%`}
          subtitle={
            roomData.averages.avg_duration_ms
              ? `Media ${Math.round(roomData.averages.avg_duration_ms / 1000)}s`
              : 'Sin datos'
          }
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <MetricTile
          label="Cuellos de botella"
          value={roomData.bottlenecks.length}
          subtitle={
            roomData.bottlenecks.length > 0
              ? roomData.bottlenecks.map((b) => b.department_key).join(', ')
              : 'Sin cuellos'
          }
          icon={<AlertTriangle className="h-4 w-4" />}
        />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Departamentos"
            subtitle="Estado live del runtime por departamento. Cada departamento refleja su integración en el Department Bus."
          />
          <CardSection>
            {roomData.departments.length === 0 ? (
              <EmptyState
                title="Sin departamentos"
                description="Activa algún departamento para ver el estado en vivo."
              />
            ) : (
              <div className="space-y-3">
                {roomData.departments.map((d) => (
                  <div
                    key={d.department_key}
                    className="rounded-[var(--radius-md)] border border-border p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Dot
                          style={{
                            backgroundColor: STATUS_COLORS[d.status] ?? 'var(--color-text-muted)',
                          }}
                        />
                        <span className="font-medium">{d.department_key}</span>
                        <Badge
                          tone={
                            d.status === 'working'
                              ? 'emerald'
                              : d.status === 'blocked'
                                ? 'rose'
                                : d.status === 'waiting'
                                  ? 'amber'
                                  : 'neutral'
                          }
                        >
                          {STATUS_LABELS[d.status] ?? d.status}
                        </Badge>
                        <Badge
                          tone={
                            d.health === 'healthy'
                              ? 'emerald'
                              : d.health === 'degraded'
                                ? 'amber'
                                : d.health === 'unhealthy'
                                  ? 'rose'
                                  : 'neutral'
                          }
                        >
                          <Shield className="mr-1 h-3 w-3" />
                          {d.health}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-text-muted">
                        <span title="Tareas pendientes">
                          <Timer className="mr-1 inline h-3 w-3" />
                          {d.pending_tasks} pendientes
                        </span>
                        <span title="Completadas hoy">
                          <CheckCircle2 className="mr-1 inline h-3 w-3" />
                          {d.completed_today} hoy
                        </span>
                        <span title="Última actividad">
                          {formatRelativeTime(d.last_activity_at)}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2">
                      <ProgressBar value={d.progress} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardSection>
        </Card>

        <Card>
          <CardHeader
            title="Ejecutivo (vivo)"
            subtitle="Pulso del Executive Director. Toda la coordinación pasa por aquí."
          />
          <CardSection>
            <div className="flex flex-col items-center gap-3">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="relative flex h-28 w-28 items-center justify-center rounded-full"
                style={{
                  background:
                    'radial-gradient(circle, color-mix(in oklab, var(--color-dept-governance) 35%, transparent), transparent)',
                }}
              >
                <Crown className="h-12 w-12" style={{ color: 'var(--color-dept-governance)' }} />
                <span className="absolute -bottom-1 inline-flex items-center gap-1 rounded-full bg-surface-2 px-3 py-1 text-xs">
                  <Dot
                    style={{
                      backgroundColor:
                        roomData.active_orchestrations.length > 0
                          ? 'var(--color-success)'
                          : 'var(--color-text-muted)',
                    }}
                  />
                  {roomData.active_orchestrations.length > 0
                    ? 'Orquestando'
                    : 'Disponible'}
                </span>
              </motion.div>
              <p className="text-center text-xs text-text-muted">
                El Executive Director recibe cada mensaje, lo descompone en un plan, delega a
                departamentos y consolida la respuesta. El usuario nunca ve la coordinación
                interna.
              </p>
            </div>
          </CardSection>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Orquestaciones activas"
            subtitle="Trabajos multi-departamento en curso. Cada uno es un plan emitido por el Executive Director."
          />
          <CardSection>
            {orchList.length === 0 ? (
              <EmptyState
                title="Sin orquestaciones activas"
                description="El Executive Director no está orquestando nada ahora mismo."
              />
            ) : (
              <div className="space-y-3">
                {orchList.map((o) => (
                  <div
                    key={o.id}
                    className="rounded-[var(--radius-md)] border border-border p-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <strong className="text-sm">{o.title}</strong>
                          <Badge
                            tone={
                              o.status === 'completed'
                                ? 'emerald'
                                : o.status === 'failed'
                                  ? 'rose'
                                  : o.status === 'cancelled'
                                    ? 'neutral'
                                    : o.status === 'escalated'
                                      ? 'amber'
                                      : 'cyan'
                            }
                          >
                            {o.status}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-text-muted">{o.intent}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-text-muted">
                          <span>
                            <Users className="mr-1 inline h-3 w-3" />
                            {o.departments.join(', ')}
                          </span>
                          <span>
                            <Clock className="mr-1 inline h-3 w-3" />
                            {formatRelativeTime(o.created_at)}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Link to={`/orchestrations/${o.id}`}>
                          <Button size="sm" variant="ghost">
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </Link>
                        {(o.status === 'failed' || o.status === 'escalated') && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => resumeMutation.mutate({ id: o.id })}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        {(o.status === 'running' ||
                          o.status === 'waiting' ||
                          o.status === 'delegated') && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              cancelMutation.mutate({
                                id: o.id,
                                reason: 'cancelled by user',
                              })
                            }
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardSection>
        </Card>

        <Card>
          <CardHeader
            title="Mensajes del Department Bus"
            subtitle="Última actividad en el bus interno entre el Executive Director y los departamentos."
          />
          <CardSection>
            {roomData.recent_bus_messages.length === 0 ? (
              <EmptyState
                title="Sin mensajes en el Bus"
                description="No hay actividad reciente en el Department Bus."
              />
            ) : (
              <div className="space-y-2">
                {roomData.recent_bus_messages.slice(0, 10).map((b) => (
                  <div
                    key={b.id}
                    className={cn(
                      'rounded-[var(--radius-sm)] border border-border p-2 text-xs',
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">
                        <span className="text-text-muted">{b.source_department}</span>
                        <ChevronRight className="mx-1 inline h-3 w-3" />
                        <span>{b.target_department}</span>
                      </span>
                      <Badge
                        tone={
                          b.status === 'replied'
                            ? 'emerald'
                            : b.status === 'failed'
                              ? 'rose'
                              : 'neutral'
                        }
                      >
                        {b.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-text-muted">{b.subject}</p>
                    <p className="mt-1 text-text-muted">{formatRelativeTime(b.created_at)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardSection>
        </Card>
      </section>

      {roomData.bottlenecks.length > 0 && (
        <Card>
          <CardHeader
            title="Cuellos de botella"
            subtitle="Departamentos con tareas pendientes que podrían ralentizar la orquestación."
          />
          <CardSection>
            <div className="space-y-2">
              {roomData.bottlenecks.map((b) => (
                <div
                  key={b.department_key}
                  className="flex items-center justify-between rounded-[var(--radius-sm)] border border-border p-2 text-sm"
                >
                  <span className="flex items-center gap-2">
                    <Pause className="h-4 w-4" style={{ color: 'var(--color-warning)' }} />
                    <strong>{b.department_key}</strong>
                    <span className="text-text-muted">{b.reason}</span>
                  </span>
                  <span className="text-text-muted">{b.pending_tasks} tareas</span>
                </div>
              ))}
            </div>
          </CardSection>
        </Card>
      )}
    </div>
  );
}
