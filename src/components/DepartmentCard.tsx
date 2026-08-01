import type { ReactNode, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight, type LucideIcon } from 'lucide-react';
import { cn } from '@/design-system/cn';
import { Badge, Dot } from './Badge';
import type { DepartmentCatalogEntry } from '@/api/schemas';
import { categoryLabel, departments, getDepartment, iconFromManifest } from '@/design-system/departments';
import { formatRelativeTime } from '@/utils/format';

const lifecycleTone: Record<string, 'emerald' | 'amber' | 'rose' | 'neutral' | 'cyan' | 'violet'> = {
  active: 'emerald',
  available: 'cyan',
  licensed: 'violet',
  activating: 'cyan',
  suspended: 'amber',
  error: 'rose',
  deactivating: 'amber',
  inactive: 'neutral',
  installed: 'neutral',
};

const healthTone: Record<string, 'emerald' | 'amber' | 'rose' | 'neutral'> = {
  healthy: 'emerald',
  degraded: 'amber',
  unhealthy: 'rose',
  unknown: 'neutral',
};

interface DepartmentCardProps {
  entry: DepartmentCatalogEntry;
  to?: string;
  onClick?: () => void;
}

export function DepartmentCard({ entry, to, onClick }: DepartmentCardProps) {
  const presentation = departments[entry.key] ?? getDepartment(entry.key);
  const Icon: LucideIcon = iconFromManifest(entry.icon);
  const lifecycle = entry.installation?.lifecycle ?? 'available';
  const health = entry.installation?.health ?? 'unknown';
  const badge = {
    tone: lifecycleTone[lifecycle] ?? 'neutral',
    label: lifecycle.replace('_', ' '),
  };

  const body = (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      className={cn(
        'group relative flex h-full flex-col gap-3 overflow-hidden rounded-[var(--radius-xl)] border p-5 shadow-[var(--shadow-soft)]',
        'panel hover:border-[color:var(--color-line-strong)]',
        'cursor-pointer',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] text-white',
            presentation?.accentBg ?? 'bg-[color:var(--color-bg-3)]',
          )}
          style={{
            backgroundColor: presentation?.cssVar
              ? `color-mix(in oklab, var(${presentation.cssVar}) 90%, transparent)`
              : undefined,
            color: presentation?.cssVar ? `var(${presentation.cssVar})` : undefined,
          }}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex items-center gap-1.5">
          <Badge tone={badge.tone} size="xs">
            {badge.label}
          </Badge>
          {lifecycle === 'active' && (
            <Badge tone={healthTone[health] ?? 'neutral'} size="xs" icon={<Dot tone={healthTone[health] ?? 'neutral'} pulse={health === 'healthy'} />}>
              {health}
            </Badge>
          )}
        </div>
      </div>

      <div className="min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="truncate text-base font-semibold text-[color:var(--color-fg-1)]">
            {entry.name}
          </h3>
          <span className="text-[11px] font-mono text-[color:var(--color-fg-3)]">v{entry.version}</span>
        </div>
        <p className="mt-1 line-clamp-2 text-xs text-[color:var(--color-fg-3)] text-pretty">
          {entry.description}
        </p>
      </div>

      <div className="mt-auto flex items-center justify-between gap-2">
        <Badge tone="neutral" size="xs" variant="outline">
          {categoryLabel[(presentation?.category ?? 'internal') as keyof typeof categoryLabel] ?? entry.category}
        </Badge>
        <ArrowUpRight className="h-4 w-4 text-[color:var(--color-fg-3)] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </div>
    </motion.div>
  );

  if (to) {
    return (
      <Link to={to} className="block" onClick={onClick}>
        {body}
      </Link>
    );
  }
  return body;
}
