import { motion } from 'framer-motion';
import { Activity, AlertTriangle, CheckCircle2, HelpCircle } from 'lucide-react';
import { cn } from '@/design-system/cn';
import { Badge, Dot } from './Badge';
import type { DepartmentHealthApi } from '@/api/schemas';
import { formatRelativeTime, formatDuration } from '@/utils/format';
import { useI18n } from '@/i18n/I18nProvider';

const toneByHealth: Record<DepartmentHealthApi, 'emerald' | 'amber' | 'rose' | 'neutral'> = {
  healthy: 'emerald',
  degraded: 'amber',
  unhealthy: 'rose',
  unknown: 'neutral',
};

const iconByHealth: Record<DepartmentHealthApi, React.ReactNode> = {
  healthy: <CheckCircle2 className="h-4 w-4" />,
  degraded: <Activity className="h-4 w-4" />,
  unhealthy: <AlertTriangle className="h-4 w-4" />,
  unknown: <HelpCircle className="h-4 w-4" />,
};

interface HealthCardProps {
  title: string;
  status: DepartmentHealthApi;
  subtitle?: string;
  meta?: string;
  checkedAt?: string | null;
  durationMs?: number | null;
  className?: string;
}

export function HealthCard({
  title,
  status,
  subtitle,
  meta,
  checkedAt,
  durationMs,
  className,
}: HealthCardProps) {
  const { t } = useI18n();
  const tone = toneByHealth[status];
  const statusLabel = t(`health.status.${status}`);
  return (
    <motion.div
      whileHover={{ y: -1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      className={cn(
        'overflow-hidden rounded-[var(--radius-lg)] border p-4 shadow-[var(--shadow-soft)] surface-1',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-xs uppercase tracking-wider text-[color:var(--muted-foreground)]">
            {title}
          </div>
          {subtitle && (
            <div className="mt-1 text-sm font-medium text-[color:var(--foreground)]">{subtitle}</div>
          )}
        </div>
        <Badge tone={tone} size="xs" icon={<Dot tone={tone} pulse={status === 'healthy'} />}>
          {statusLabel}
        </Badge>
      </div>
      {meta && (
        <div className="mt-3 text-xs text-[color:var(--muted-foreground)]">{meta}</div>
      )}
      <div className="mt-3 flex items-center justify-between text-[11px] uppercase tracking-wider text-[color:var(--muted-foreground)]">
        <span className="inline-flex items-center gap-1.5">
          {iconByHealth[status]}
          {checkedAt ? formatRelativeTime(checkedAt) : '—'}
        </span>
        <span className="font-mono normal-case">{formatDuration(durationMs ?? null)}</span>
      </div>
    </motion.div>
  );
}
