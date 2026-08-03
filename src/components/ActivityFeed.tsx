import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, ClipboardList, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/design-system/cn';
import { Badge } from './Badge';
import { getDepartment } from '@/design-system/departments';
import { formatRelativeTime } from '@/utils/format';
import { useI18n } from '@/i18n/I18nProvider';
import type { InternalMessage, Task } from '@/api/schemas';

interface FeedEntry {
  id: string;
  at: string;
  kind: 'task' | 'message';
  title: string;
  subtitle?: string;
  departmentKey?: string;
  status?: string;
  href: string;
}

interface ActivityFeedProps {
  tasks?: Task[];
  messages?: InternalMessage[];
  limit?: number;
  className?: string;
}

export function ActivityFeed({ tasks = [], messages = [], limit = 20, className }: ActivityFeedProps) {
  const { t } = useI18n();
  const entries = useMemo<FeedEntry[]>(() => {
    const list: FeedEntry[] = [];
    for (const t of tasks) {
      list.push({
        id: `task-${t.id}`,
        at: t.updated_at,
        kind: 'task',
        title: t.title,
        subtitle: t.description ?? undefined,
        departmentKey: t.department_key,
        status: t.status,
        href: `/tasks/${t.id}`,
      });
    }
    for (const m of messages) {
      list.push({
        id: `msg-${m.id}`,
        at: m.created_at,
        kind: 'message',
        title: m.type.replace('task.', '').replace(/[._]/g, ' '),
        subtitle: `${m.source_agent} → ${m.target_agent}`,
        departmentKey: m.department_key,
        status: m.type,
        href: `/tasks`,
      });
    }
    list.sort((a, b) => +new Date(b.at) - +new Date(a.at));
    return list.slice(0, limit);
  }, [tasks, messages, limit]);

  if (entries.length === 0) {
    return (
      <div className={cn('text-sm text-[color:var(--muted-foreground)]', className)}>
        {t('activity.empty')}
      </div>
    );
  }

  return (
    <ul className={cn('space-y-1', className)}>
      {entries.map((entry, i) => {
        const Icon = entry.kind === 'task' ? ClipboardList : entry.kind === 'message' ? MessageCircle : FileText;
        const presentation = entry.departmentKey ? getDepartment(entry.departmentKey) : undefined;
        return (
          <motion.li
            key={entry.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, delay: i * 0.02 }}
          >
            <Link
              to={entry.href}
              className="flex items-start gap-3 rounded-[var(--radius-md)] px-2 py-2 hover:bg-[color:var(--surface-soft)]"
            >
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)]"
                style={{
                  backgroundColor: presentation?.cssVar
                    ? `color-mix(in oklab, var(${presentation.cssVar}) 18%, transparent)`
                    : 'var(--surface-soft)',
                  color: presentation?.cssVar ? `var(${presentation.cssVar})` : undefined,
                }}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-medium text-[color:var(--foreground)]">
                    {entry.title}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-[color:var(--muted-foreground)]">
                    {formatRelativeTime(entry.at)}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-[color:var(--muted-foreground)]">
                  {presentation && <span className="opacity-70">{presentation?.name ?? 'General'}</span>}
                  {entry.subtitle && (
                    <>
                      <span>·</span>
                      <span className="truncate">{entry.subtitle}</span>
                    </>
                  )}
                </div>
              </div>
              {entry.status && (
                <Badge tone="neutral" size="xs" variant="outline">
                  {entry.status.replace('task.', '')}
                </Badge>
              )}
            </Link>
          </motion.li>
        );
      })}
    </ul>
  );
}