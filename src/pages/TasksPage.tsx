import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Filter, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Dialog } from '@/components/Dialog';
import { EmptyState } from '@/components/EmptyState';
import { Field, Textarea } from '@/components/Field';
import { TaskCard } from '@/components/TaskCard';
import { useToast } from '@/components/Toaster';
import {
  useApproveTask,
  useCancelTask,
  useCreateTask,
  useDepartmentCatalog,
  useRetryTask,
  useTasks,
} from '@/api/queries';
import { cn } from '@/design-system/cn';
import { useI18n } from '@/i18n/I18nProvider';

const STATUS_OPTIONS = [
  'all',
  'queued',
  'assigned',
  'running',
  'waiting_approval',
  'completed',
  'failed',
  'cancelled',
  'expired',
] as const;

export default function TasksPage() {
  const { t } = useI18n();
  const [status, setStatus] = useState<typeof STATUS_OPTIONS[number]>('all');
  const [departmentKey, setDepartmentKey] = useState<string>('all');
  const tasks = useTasks({ status: status === 'all' ? undefined : status, departmentKey: departmentKey === 'all' ? undefined : departmentKey, limit: 200 });
  const catalog = useDepartmentCatalog();
  const navigate = useNavigate();
  const cancel = useCancelTask();
  const retry = useRetryTask();
  const approve = useApproveTask();
  const toast = useToast();
  const [createOpen, setCreateOpen] = useState(false);

  const filtered = useMemo(() => tasks.data ?? [], [tasks.data]);

  function onCancel(id: string) {
    cancel.mutate(
      { id, reason: 'manual' },
      {
        onSuccess: () => toast.push({ tone: 'success', title: t('tasks.cancelled_toast') }),
        onError: (e: Error) => toast.push({ tone: 'error', title: t('tasks.cancel_failed'), description: e.message }),
      },
    );
  }
  function onRetry(id: string) {
    retry.mutate(
      { id },
      {
        onSuccess: () => toast.push({ tone: 'success', title: t('tasks.retry_toast') }),
        onError: (e: Error) => toast.push({ tone: 'error', title: t('tasks.retry_failed'), description: e.message }),
      },
    );
  }
  function onApprove(id: string, ok: boolean) {
    approve.mutate(
      { id, approve: ok },
      {
        onSuccess: () => toast.push({ tone: ok ? 'success' : 'info', title: t(ok ? 'tasks.approved_toast' : 'tasks.rejected_toast') }),
        onError: (e: Error) => toast.push({ tone: 'error', title: t('tasks.decision_failed'), description: e.message }),
      },
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-6 lg:p-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{t('tasks.header.title')}</h1>
          <p className="mt-1 text-sm text-[color:var(--color-fg-3)]">
            {t('tasks.header.subtitle')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="primary"
            iconLeft={<Plus className="h-4 w-4" />}
            onClick={() => setCreateOpen(true)}
          >
            {t('tasks.new')}
          </Button>
        </div>
      </header>

      <Card padding="sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs uppercase tracking-wider text-[color:var(--color-fg-3)]">
            <Filter className="h-3 w-3" /> {t('tasks.filter')}
          </span>
          <div className="flex flex-wrap items-center gap-1 rounded-full border border-[color:var(--color-line)] bg-[color:var(--color-bg-2)] p-0.5 text-xs">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={cn(
                  'rounded-full px-3 py-1 transition-colors',
                  status === s
                    ? 'bg-[color:var(--color-accent)] text-[color:var(--color-accent-foreground)]'
                    : 'text-[color:var(--color-fg-3)] hover:text-[color:var(--color-fg-1)]',
                )}
              >
                {s}
              </button>
            ))}
          </div>
          <select
            value={departmentKey}
            onChange={(e) => setDepartmentKey(e.target.value)}
            className="ml-auto rounded-md border border-[color:var(--color-line-strong)] bg-[color:var(--color-bg-2)] px-3 py-1.5 text-xs text-[color:var(--color-fg-1)] focus:border-[color:var(--color-accent)] focus:outline-none"
          >
            <option value="all">{t('tasks.all_departments')}</option>
            {(catalog.data ?? []).map((d) => (
              <option key={d.key} value={d.key}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {tasks.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="shimmer h-20 rounded-[var(--radius-lg)]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={t('tasks.empty.title')}
          description={t('tasks.empty.desc')}
          action={<Button onClick={() => setCreateOpen(true)}>{t('tasks.create_first')}</Button>}
        />
      ) : (
        <motion.ul
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="space-y-2"
        >
          {filtered.map((t2, i) => (
            <motion.li
              key={t2.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, delay: i * 0.01 }}
            >
              <div className="flex flex-wrap items-stretch gap-2 sm:flex-nowrap">
                <div className="min-w-0 flex-1">
                  <TaskCard task={t2} onClick={() => navigate(`/tasks/${t2.id}`)} />
                </div>
                <div className="flex shrink-0 items-center gap-1 sm:flex-col sm:items-end">
                  {t2.status === 'waiting_approval' && (
                    <>
                      <Button size="sm" variant="primary" iconLeft={<Check className="h-3.5 w-3.5" />} onClick={() => onApprove(t2.id, true)} loading={approve.isPending}>
                        {t('tasks.approve')}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => onApprove(t2.id, false)} loading={approve.isPending}>
                        {t('tasks.reject')}
                      </Button>
                    </>
                  )}
                  {(t2.status === 'failed' || t2.status === 'cancelled' || t2.status === 'expired') && (
                    <Button size="sm" variant="outline" iconLeft={<RotateCcw className="h-3.5 w-3.5" />} onClick={() => onRetry(t2.id)} loading={retry.isPending}>
                      {t('tasks.retry')}
                    </Button>
                  )}
                  {['queued', 'assigned', 'running', 'waiting_approval'].includes(t2.status) && (
                    <Button size="sm" variant="danger" iconLeft={<Trash2 className="h-3.5 w-3.5" />} onClick={() => onCancel(t2.id)} loading={cancel.isPending}>
                      {t('tasks.cancel')}
                    </Button>
                  )}
                </div>
              </div>
            </motion.li>
          ))}
        </motion.ul>
      )}

      <CreateTaskDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(id) => navigate(`/tasks/${id}`)}
      />
    </div>
  );
}

function CreateTaskDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const { t } = useI18n();
  const catalog = useDepartmentCatalog();
  const create = useCreateTask();
  const toast = useToast();
  const [departmentKey, setDepartmentKey] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<number>(5);

  async function submit() {
    if (!departmentKey || !title.trim()) {
      toast.push({ tone: 'error', title: t('tasks.create.required_toast') });
      return;
    }
    try {
      const result = await create.mutateAsync({
        departmentKey,
        title,
        description: description || undefined,
        priority,
        idempotencyKey: `portal-${Date.now()}`,
      });
      onCreated(result.task.id);
      onClose();
      toast.push({ tone: 'success', title: t('tasks.create.success_toast') });
    } catch (e) {
      toast.push({ tone: 'error', title: t('tasks.create.failed_toast'), description: (e as Error).message });
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t('tasks.create_dialog.title')}
      description={t('tasks.create_dialog.desc')}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('tasks.create.dialog_cancel')}
          </Button>
          <Button variant="primary" onClick={submit} loading={create.isPending} iconLeft={<Plus className="h-4 w-4" />}>
            {t('tasks.create.submit')}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div>
          <label className="mb-1.5 block text-xs uppercase tracking-wider text-[color:var(--color-fg-3)]">{t('tasks.create.department')}</label>
          <select
            value={departmentKey}
            onChange={(e) => setDepartmentKey(e.target.value)}
            className="w-full rounded-md border border-[color:var(--color-line-strong)] bg-[color:var(--color-bg-2)] px-3 py-2 text-sm text-[color:var(--color-fg-1)] focus:border-[color:var(--color-accent)] focus:outline-none"
          >
            <option value="">{t('tasks.create.department_placeholder')}</option>
            {(catalog.data ?? []).map((d) => (
              <option key={d.key} value={d.key}>{d.name}</option>
            ))}
          </select>
        </div>
        <Field
          label={t('tasks.create.title_label')}
          placeholder={t('tasks.create.title_placeholder')}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Textarea
          label={t('tasks.create.description_label')}
          placeholder={t('tasks.create.description_placeholder')}
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <Field
          label={t('tasks.create.priority_label')}
          type="number"
          min={1}
          max={10}
          value={priority}
          onChange={(e) => setPriority(Number(e.target.value))}
        />
      </div>
    </Dialog>
  );
}