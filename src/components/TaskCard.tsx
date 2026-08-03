import { motion } from 'framer-motion';
import { Loader2, AlertTriangle, PauseCircle, CheckCircle2, Clock4, XCircle, Hourglass } from 'lucide-react';
import { cn } from '@/design-system/cn';
import { Badge } from './Badge';
import type { Task, TaskStatus } from '@/api/schemas';
import { getDepartment, departmentIcon } from '@/design-system/departments';
import { formatRelativeTime, truncate } from '@/utils/format';
import { useI18n } from '@/i18n/I18nProvider';

const toneByStatus: Record<TaskStatus, 'cyan' | 'amber' | 'emerald' | 'rose' | 'violet' | 'neutral'> = {
  queued: 'neutral',
  assigned: 'cyan',
  running: 'cyan',
  waiting_approval: 'amber',
  completed: 'emerald',
  failed: 'rose',
  cancelled: 'neutral',
  expired: 'rose',
};

const iconByStatus: Record<TaskStatus, React.ReactNode> = {
  queued: <Hourglass className="h-3.5 w-3.5" />,
  assigned: <Clock4 className="h-3.5 w-3.5" />,
  running: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
  waiting_approval: <PauseCircle className="h-3.5 w-3.5" />,
  completed: <CheckCircle2 className="h-3.5 w-3.5" />,
  failed: <AlertTriangle className="h-3.5 w-3.5" />,
  cancelled: <XCircle className="h-3.5 w-3.5" />,
  expired: <AlertTriangle className="h-3.5 w-3.5" />,
};

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const { t } = useI18n();
  const Icon = departmentIcon(task.department_key);
  const presentation = getDepartment(task.department_key);
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      className={cn(
        'group w-full overflow-hidden rounded-[var(--radius-lg)] border p-4 text-left shadow-[var(--shadow-soft)]',
        'surface-1 hover:border-[color:var(--color-line-strong)]',
        onClick && 'cursor-pointer',
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)]"
          style={{
            backgroundColor: presentation?.cssVar
              ? `color-mix(in oklab, var(${presentation.cssVar}) 18%, transparent)`
              : 'var(--color-bg-3)',
            color: presentation?.cssVar ? `var(${presentation.cssVar})` : undefined,
          }}
        >
          <Icon className="h-4.5 w-4.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="truncate text-sm font-semibold text-[color:var(--color-fg-1)]">
              {task.title}
            </div>
            <Badge tone={toneByStatus[task.status]} size="xs" icon={iconByStatus[task.status]}>
              {task.status.replace('_', ' ')}
            </Badge>
          </div>
          {task.description && (
            <p className="mt-1 line-clamp-2 text-xs text-[color:var(--color-fg-3)]">
              {truncate(task.description, 160)}
            </p>
          )}
          <div className="mt-2 flex items-center gap-3 text-[11px] uppercase tracking-wider text-[color:var(--color-fg-3)]">
            <span>{presentation?.name ?? task.department_key}</span>
            <span>•</span>
            <span>{formatRelativeTime(task.created_at)}</span>
            {task.priority > 5 && (
              <>
                <span>•</span>
                <span className="text-[color:var(--color-amber)]">priority {task.priority}</span>
              </>
            )}
            {task.attempts > 1 && (
              <>
                <span>•</span>
                <span>
                  attempt {task.attempts}/{task.max_attempts}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.button>
  );
}
