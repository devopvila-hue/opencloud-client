import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ClipboardList, AlertTriangle, CheckCircle2, MessageCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Drawer } from '@/components/Drawer';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/Button';
import { useInternalMessages, useTasks } from '@/api/queries';
import { useI18n } from '@/i18n/I18nProvider';
import { cn } from '@/design-system/cn';
import { formatRelativeTime } from '@/utils/format';

interface NotificationsPanelProps {
  open: boolean;
  onClose: () => void;
}

export function NotificationsPanel({ open, onClose }: NotificationsPanelProps) {
  const tasks = useTasks({ limit: 20 });
  const messages = useInternalMessages({ limit: 20 });
  const navigate = useNavigate();
  const { t } = useI18n();

  const items = useMemo(() => {
    const out: {
      id: string;
      title: string;
      subtitle: string;
      at: string;
      tone: 'info' | 'warn' | 'success';
      icon: React.ReactNode;
      href: string;
    }[] = [];
    for (const t of tasks.data ?? []) {
      const tone: 'info' | 'warn' | 'success' = t.status === 'failed' ? 'warn' : t.status === 'completed' ? 'success' : 'info';
      out.push({
        id: `t-${t.id}`,
        title: t.title,
        subtitle: `${t.department_key} · ${t.status}`,
        at: t.updated_at,
        tone,
        icon:
          tone === 'warn' ? (
            <AlertTriangle className="h-4 w-4" />
          ) : tone === 'success' ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <ClipboardList className="h-4 w-4" />
          ),
        href: `/tasks/${t.id}`,
      });
    }
    for (const m of messages.data ?? []) {
      out.push({
        id: `m-${m.id}`,
        title: m.type,
        subtitle: `${m.source_agent} → ${m.target_agent}`,
        at: m.created_at,
        tone: 'info',
        icon: <MessageCircle className="h-4 w-4" />,
        href: '/tasks',
      });
    }
    out.sort((a, b) => +new Date(b.at) - +new Date(a.at));
    return out.slice(0, 50);
  }, [tasks.data, messages.data]);

  return (
    <Drawer open={open} onClose={onClose} title={t('topbar.notifications')} width="md">
      {items.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-5 w-5" />}
          title={t('notifications.empty.title')}
          description={t('notifications.empty.description')}
          action={<Button onClick={() => { onClose(); navigate('/tasks'); }}>{t('notifications.empty.cta')}</Button>}
        />
      ) : (
        <ul className="space-y-1">
          <AnimatePresence initial={false}>
            {items.map((it, i) => (
              <motion.li
                key={it.id}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.18, delay: i * 0.02 }}
              >
                <button
                  type="button"
                  onClick={() => {
                    navigate(it.href);
                    onClose();
                  }}
                  className={cn(
                    'flex w-full items-start gap-3 rounded-[var(--radius-md)] p-2 text-left transition-colors hover:bg-[color:var(--color-bg-3)]',
                  )}
                >
                  <span
                    className={cn(
                      'mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                      it.tone === 'warn' && 'bg-[color:var(--color-rose-soft)] text-[color:var(--color-rose)]',
                      it.tone === 'success' && 'bg-[color:var(--color-emerald-soft)] text-[color:var(--color-emerald)]',
                      it.tone === 'info' && 'bg-[color:var(--color-cyan-soft)] text-[color:var(--color-cyan)]',
                    )}
                  >
                    {it.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-[color:var(--color-fg-1)]">{it.title}</div>
                    <div className="truncate text-xs text-[color:var(--color-fg-3)]">{it.subtitle}</div>
                    <div className="mt-0.5 text-[10px] uppercase tracking-wider text-[color:var(--color-fg-3)]">
                      {formatRelativeTime(it.at)}
                    </div>
                  </div>
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </Drawer>
  );
}
