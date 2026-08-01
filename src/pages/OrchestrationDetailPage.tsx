import { Link, useParams } from 'react-router-dom';
import {
  Activity,
  CheckCircle2,
  Crown,
  Loader2,
  Pause,
  Play,
  X,
} from 'lucide-react';
import { Card, CardHeader, CardSection } from '@/components/Card';
import { Badge, Dot } from '@/components/Badge';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { ProgressBar } from '@/components/Chart';
import {
  useBusMessages,
  useCancelOrchestration,
  useEscalateOrchestration,
  useOrchestration,
  useOrchestrationSteps,
  useResumeOrchestration,
} from '@/api/queries';
import { formatRelativeTime, formatDateTime } from '@/utils/format';

const STATUS_COLORS: Record<string, string> = {
  queued: 'var(--color-text-muted)',
  planning: 'var(--color-info)',
  delegated: 'var(--color-info)',
  running: 'var(--color-info)',
  waiting: 'var(--color-warning)',
  review: 'var(--color-warning)',
  completed: 'var(--color-success)',
  cancelled: 'var(--color-text-muted)',
  failed: 'var(--color-danger)',
  escalated: 'var(--color-warning)',
};

export default function OrchestrationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const orch = useOrchestration(id ?? '');
  const steps = useOrchestrationSteps(id ?? '');
  const bus = useBusMessages({ orchestrationId: id ?? '', limit: 50 });
  const cancelMutation = useCancelOrchestration();
  const resumeMutation = useResumeOrchestration();
  const escalateMutation = useEscalateOrchestration();

  if (!id) {
    return <EmptyState title="Orchestration no especificada" description="Falta el id." />;
  }

  if (orch.isLoading || steps.isLoading) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-6 lg:p-8">
        <div className="flex items-center gap-3 text-text-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Cargando orquestación...</span>
        </div>
      </div>
    );
  }

  const o = orch.data;
  const stepList = steps.data ?? [];
  const busList = (bus.data ?? []).slice().reverse();

  if (!o) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-6 lg:p-8">
        <EmptyState title="Orchestration no encontrada" description={id} />
      </div>
    );
  }

  const completed = stepList.filter((s) => s.status === 'completed').length;
  const total = stepList.length;
  const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-6 lg:p-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)]"
            style={{
              backgroundColor: 'color-mix(in oklab, var(--color-info) 80%, transparent)',
              color: 'var(--color-info)',
            }}
          >
            <Crown className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">{o.title}</h1>
            <p className="text-sm text-text-muted">{o.intent}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-text-muted">
              <Badge
                tone={
                  o.status === 'completed'
                    ? 'emerald'
                    : o.status === 'failed'
                      ? 'rose'
                      : o.status === 'cancelled'
                        ? 'neutral'
                        : 'cyan'
                }
              >
                {o.status}
              </Badge>
              <span>Iniciada: {formatDateTime(o.created_at)}</span>
              <span>· {formatRelativeTime(o.created_at)}</span>
              {o.completed_at && (
                <span>
                  · Finalizada: {formatDateTime(o.completed_at)} (
                  {formatRelativeTime(o.completed_at)})
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {(o.status === 'failed' || o.status === 'escalated') && (
            <Button onClick={() => resumeMutation.mutate({ id: o.id })} variant="secondary">
              <Play className="mr-1 h-4 w-4" />
              Reanudar
            </Button>
          )}
          {(o.status === 'running' || o.status === 'waiting' || o.status === 'delegated') && (
            <>
              <Button
                onClick={() =>
                  escalateMutation.mutate({
                    id: o.id,
                    reason: 'Escalated manually from Executive Room',
                  })
                }
                variant="secondary"
              >
                <Pause className="mr-1 h-4 w-4" />
                Escalar
              </Button>
              <Button
                onClick={() => cancelMutation.mutate({ id: o.id, reason: 'cancelled by user' })}
                variant="ghost"
              >
                <X className="mr-1 h-4 w-4" />
                Cancelar
              </Button>
            </>
          )}
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Pasos"
            subtitle="Cada paso es una delegación a un departamento. Ordénalos por sequence."
          />
          <CardSection>
            <div className="mb-3">
              <ProgressBar value={progress} />
              <p className="mt-1 text-xs text-text-muted">
                {completed} / {total} pasos completados · {progress}%
              </p>
            </div>
            {stepList.length === 0 ? (
              <EmptyState
                title="Sin pasos"
                description="Esta orquestación no tiene pasos definidos."
              />
            ) : (
              <div className="space-y-2">
                {stepList.map((s) => (
                  <div
                    key={s.id}
                    className="rounded-[var(--radius-md)] border border-border p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Dot
                          style={{
                            backgroundColor:
                              STATUS_COLORS[s.status] ?? 'var(--color-text-muted)',
                          }}
                        />
                        <strong className="text-sm">
                          #{s.sequence} {s.title}
                        </strong>
                        <Badge tone="neutral">{s.execution_mode}</Badge>
                        <Badge tone="neutral">{s.department_key}</Badge>
                        <Badge
                          tone={
                            s.status === 'completed'
                              ? 'emerald'
                              : s.status === 'failed'
                                ? 'rose'
                                : 'cyan'
                          }
                        >
                          {s.status}
                        </Badge>
                      </div>
                      <span className="text-xs text-text-muted">
                        {s.duration_ms
                          ? `${Math.round(s.duration_ms / 1000)}s`
                          : formatRelativeTime(s.started_at)}
                      </span>
                    </div>
                    {s.error && <p className="mt-1 text-xs text-danger">⚠ {s.error}</p>}
                  </div>
                ))}
              </div>
            )}
          </CardSection>
        </Card>

        <Card>
          <CardHeader
            title="Department Bus"
            subtitle="Mensajes entre el Executive Director y este plan."
          />
          <CardSection>
            {busList.length === 0 ? (
              <EmptyState
                title="Sin mensajes"
                description="Aún no hay actividad en el bus para esta orquestación."
              />
            ) : (
              <div className="space-y-2">
                {busList.map((b) => (
                  <div
                    key={b.id}
                    className="rounded-[var(--radius-sm)] border border-border p-2 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span>
                        <strong>{b.source_department}</strong>
                        <span className="text-text-muted"> → </span>
                        <strong>{b.target_department}</strong>
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
                    <p className="mt-1">{b.subject}</p>
                    <p className="mt-1 text-text-muted">{formatRelativeTime(b.created_at)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardSection>
        </Card>
      </section>

      {o.result && (
        <Card>
          <CardHeader
            title="Resultado consolidado"
            subtitle="El Executive Director consolidó los outputs de cada paso en este objeto."
          />
          <CardSection>
            <pre className="overflow-x-auto rounded-[var(--radius-sm)] bg-surface-2 p-3 text-xs">
              {JSON.stringify(o.result, null, 2)}
            </pre>
          </CardSection>
        </Card>
      )}
    </div>
  );
}
