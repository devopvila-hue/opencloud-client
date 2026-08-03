import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Bot, ClipboardList, Loader2, RotateCcw, Trash2 } from 'lucide-react';
import { Badge, Dot } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card, CardHeader } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { useApproveTask, useCancelTask, useInternalMessages, useTask, useRetryTask } from '@/api/queries';
import { formatDateTime, formatRelativeTime } from '@/utils/format';
import { getDepartment } from '@/design-system/departments';
import { useToast } from '@/components/Toaster';
import { Timeline } from '@/components/Timeline';
import { JsonBlock } from '@/components/JsonBlock';
import { useI18n } from '@/i18n/I18nProvider';

export default function TaskDetailPage() {
  const { t } = useI18n();
  const params = useParams<{ id: string }>();
  const id = params.id ?? '';
  const task = useTask(id);
  const messages = useInternalMessages({ taskId: id, limit: 100 });
  const cancel = useCancelTask();
  const retry = useRetryTask();
  const approve = useApproveTask();
  const toast = useToast();

  if (task.isLoading) {
    return (
      <div className="mx-auto w-full max-w-5xl p-6">
        <div className="shimmer h-32 rounded-[var(--radius-lg)]" />
      </div>
    );
  }
  if (task.isError || !task.data) {
    return (
      <div className="mx-auto w-full max-w-5xl p-6">
        <EmptyState
          icon={<ClipboardList className="h-5 w-5" />}
          title={t('task.detail.not_found')}
          description={t('task.detail.not_found_desc')}
          action={<Link to="/tasks" className="text-sm text-[color:var(--color-accent)] hover:underline">{t('task.detail.back_queue')}</Link>}
        />
      </div>
    );
  }
  const taskData = task.data;
  const pres = getDepartment(taskData.department_key);

  function act<T>(fn: () => Promise<T>, successKey: string) {
    return async () => {
      try {
        await fn();
        toast.push({ tone: 'success', title: t(successKey) });
      } catch (e) {
        toast.push({ tone: 'error', title: t('task.detail.action_failed'), description: (e as Error).message });
      }
    };
  }

  const timeline = [
    { id: 'created', title: t('task.detail.timeline_created'), subtitle: taskData.id, at: formatRelativeTime(taskData.created_at) },
    taskData.started_at ? { id: 'started', title: t('task.detail.timeline_started'), subtitle: taskData.assigned_agent ?? taskData.target_agent ?? '', at: formatRelativeTime(taskData.started_at) } : null,
    taskData.approved_at ? { id: 'approved', title: t('task.detail.timeline_approved'), subtitle: taskData.approved_by ?? '', at: formatRelativeTime(taskData.approved_at) } : null,
    taskData.completed_at ? { id: 'completed', title: t('task.detail.timeline_completed'), subtitle: taskData.status, at: formatRelativeTime(taskData.completed_at) } : null,
  ].filter(Boolean) as { id: string; title: string; subtitle?: string; at: string }[];

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 md:p-6 lg:p-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link to="/tasks" className="inline-flex items-center gap-1 text-xs text-[color:var(--color-fg-3)] hover:text-[color:var(--color-fg-1)]">
            <ArrowLeft className="h-3 w-3" /> {t('task.detail.back_queue')}
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{taskData.title}</h1>
          <p className="mt-1 text-sm text-[color:var(--color-fg-3)]">
            {pres?.name ?? taskData.department_key} · {taskData.status.replace('_', ' ')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={taskData.status === 'completed' ? 'emerald' : taskData.status === 'failed' ? 'rose' : 'cyan'} size="sm" icon={<Dot tone={taskData.status === 'completed' ? 'emerald' : taskData.status === 'failed' ? 'rose' : 'cyan'} pulse={taskData.status === 'running'} />}>
            {taskData.status.replace('_', ' ')}
          </Badge>
          {taskData.status === 'waiting_approval' && (
            <>
              <Button variant="primary" onClick={act(() => approve.mutateAsync({ id: taskData.id, approve: true }), 'task.detail.approved_toast')}>
                {t('task.detail.approve')}
              </Button>
              <Button variant="outline" onClick={act(() => approve.mutateAsync({ id: taskData.id, approve: false }), 'task.detail.rejected_toast')}>
                {t('task.detail.reject')}
              </Button>
            </>
          )}
          {(taskData.status === 'failed' || taskData.status === 'cancelled' || taskData.status === 'expired') && (
            <Button variant="primary" iconLeft={<RotateCcw className="h-4 w-4" />} onClick={act(() => retry.mutateAsync({ id: taskData.id }), 'task.detail.retried_toast')}>
              {t('task.detail.retry')}
            </Button>
          )}
          {['queued', 'assigned', 'running', 'waiting_approval'].includes(taskData.status) && (
            <Button variant="danger" iconLeft={<Trash2 className="h-4 w-4" />} onClick={act(() => cancel.mutateAsync({ id: taskData.id, reason: 'manual' }), 'task.detail.cancelled_toast')}>
              {t('task.detail.cancel')}
            </Button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title={t('task.detail.overview')} />
            {taskData.description && <p className="text-sm text-[color:var(--color-fg-2)]">{taskData.description}</p>}
            <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <Field label={t('task.detail.priority')} value={taskData.priority.toString()} />
              <Field label={t('task.detail.attempts')} value={`${taskData.attempts}/${taskData.max_attempts}`} />
              <Field label={t('task.detail.source_agent')} value={taskData.source_agent ?? '—'} />
              <Field label={t('task.detail.target_agent')} value={taskData.target_agent ?? '—'} />
              <Field label={t('task.detail.created')} value={formatDateTime(taskData.created_at)} />
              <Field label={t('task.detail.updated')} value={formatDateTime(taskData.updated_at)} />
              {taskData.started_at && <Field label={t('task.detail.started')} value={formatDateTime(taskData.started_at)} />}
              {taskData.completed_at && <Field label={t('task.detail.completed')} value={formatDateTime(taskData.completed_at)} />}
            </dl>
            {taskData.error && (
              <div className="mt-3 rounded-md bg-[color:var(--color-rose-soft)] px-3 py-2 text-xs text-[color:var(--color-rose)]">
                {taskData.error}
              </div>
            )}
          </Card>

          {taskData.result && (
            <Card>
              <CardHeader title="Resultado" subtitle="Devuelto por el equipo al terminar" />
              <JsonBlock value={taskData.result} />
            </Card>
          )}

          <Card>
            <CardHeader title="Datos de entrada" subtitle="Lo que se envió al equipo" />
            <JsonBlock value={taskData.payload} />
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Timeline" />
            <Timeline entries={timeline} />
          </Card>

          <Card>
            <CardHeader title="Mensajes internos" subtitle={`${(messages.data ?? []).length} eventos`} />
            {(messages.data ?? []).length === 0 ? (
              <EmptyState icon={<Bot className="h-5 w-5" />} title="Sin mensajes todavía" />
            ) : (
              <ul className="space-y-2">
                {(messages.data ?? []).slice(0, 8).map((m) => (
                  <li key={m.id} className="rounded-md border border-[color:var(--color-line)] p-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[color:var(--color-fg-1)]">{m.type}</span>
                      <span className="text-[color:var(--color-fg-3)]">{formatRelativeTime(m.created_at)}</span>
                    </div>
                    <div className="text-xs text-[color:var(--color-fg-3)]">
                      {m.source_agent} → {m.target_agent}
                    </div>
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

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wider text-[color:var(--color-fg-3)]">{label}</dt>
      <dd className="mt-0.5 font-mono text-xs text-[color:var(--color-fg-1)]">{value}</dd>
    </div>
  );
}