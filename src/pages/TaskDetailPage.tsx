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

export default function TaskDetailPage() {
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
          title="Task not found"
          description="It may have been deleted or never existed."
          action={<Link to="/tasks" className="text-sm text-[color:var(--color-accent)] hover:underline">Back to queue</Link>}
        />
      </div>
    );
  }
  const t = task.data;
  const pres = getDepartment(t.department_key);

  function act<T>(fn: () => Promise<T>, success: string) {
    return async () => {
      try {
        await fn();
        toast.push({ tone: 'success', title: success });
      } catch (e) {
        toast.push({ tone: 'error', title: 'Action failed', description: (e as Error).message });
      }
    };
  }

  const timeline = [
    { id: 'created', title: 'Task created', subtitle: t.id, at: formatRelativeTime(t.created_at) },
    t.started_at ? { id: 'started', title: 'Agent started', subtitle: t.assigned_agent ?? t.target_agent ?? '', at: formatRelativeTime(t.started_at) } : null,
    t.approved_at ? { id: 'approved', title: 'Approved', subtitle: t.approved_by ?? '', at: formatRelativeTime(t.approved_at) } : null,
    t.completed_at ? { id: 'completed', title: 'Completed', subtitle: t.status, at: formatRelativeTime(t.completed_at) } : null,
  ].filter(Boolean) as { id: string; title: string; subtitle?: string; at: string }[];

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 md:p-6 lg:p-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link to="/tasks" className="inline-flex items-center gap-1 text-xs text-[color:var(--color-fg-3)] hover:text-[color:var(--color-fg-1)]">
            <ArrowLeft className="h-3 w-3" /> Back to queue
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{t.title}</h1>
          <p className="mt-1 text-sm text-[color:var(--color-fg-3)]">
            {pres?.name ?? t.department_key} · {t.status.replace('_', ' ')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={t.status === 'completed' ? 'emerald' : t.status === 'failed' ? 'rose' : 'cyan'} size="sm" icon={<Dot tone={t.status === 'completed' ? 'emerald' : t.status === 'failed' ? 'rose' : 'cyan'} pulse={t.status === 'running'} />}>
            {t.status.replace('_', ' ')}
          </Badge>
          {t.status === 'waiting_approval' && (
            <>
              <Button variant="primary" onClick={act(() => approve.mutateAsync({ id: t.id, approve: true }), 'Approved')}>
                Approve
              </Button>
              <Button variant="outline" onClick={act(() => approve.mutateAsync({ id: t.id, approve: false }), 'Rejected')}>
                Reject
              </Button>
            </>
          )}
          {(t.status === 'failed' || t.status === 'cancelled' || t.status === 'expired') && (
            <Button variant="primary" iconLeft={<RotateCcw className="h-4 w-4" />} onClick={act(() => retry.mutateAsync({ id: t.id }), 'Retried')}>
              Retry
            </Button>
          )}
          {['queued', 'assigned', 'running', 'waiting_approval'].includes(t.status) && (
            <Button variant="danger" iconLeft={<Trash2 className="h-4 w-4" />} onClick={act(() => cancel.mutateAsync({ id: t.id, reason: 'manual' }), 'Cancelled')}>
              Cancel
            </Button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Overview" />
            {t.description && <p className="text-sm text-[color:var(--color-fg-2)]">{t.description}</p>}
            <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <Field label="Priority" value={t.priority.toString()} />
              <Field label="Attempts" value={`${t.attempts}/${t.max_attempts}`} />
              <Field label="Source agent" value={t.source_agent ?? '—'} />
              <Field label="Target agent" value={t.target_agent ?? '—'} />
              <Field label="Created" value={formatDateTime(t.created_at)} />
              <Field label="Updated" value={formatDateTime(t.updated_at)} />
              {t.started_at && <Field label="Started" value={formatDateTime(t.started_at)} />}
              {t.completed_at && <Field label="Completed" value={formatDateTime(t.completed_at)} />}
            </dl>
            {t.error && (
              <div className="mt-3 rounded-md bg-[color:var(--color-rose-soft)] px-3 py-2 text-xs text-[color:var(--color-rose)]">
                {t.error}
              </div>
            )}
          </Card>

          {t.result && (
            <Card>
              <CardHeader title="Result" subtitle="Returned by the manager agent" />
              <JsonBlock value={t.result} />
            </Card>
          )}

          <Card>
            <CardHeader title="Payload" subtitle="Input sent to the agent" />
            <JsonBlock value={t.payload} />
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Timeline" />
            <Timeline entries={timeline} />
          </Card>

          <Card>
            <CardHeader title="Internal messages" subtitle={`${(messages.data ?? []).length} events`} />
            {(messages.data ?? []).length === 0 ? (
              <EmptyState icon={<Bot className="h-5 w-5" />} title="No messages yet" />
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