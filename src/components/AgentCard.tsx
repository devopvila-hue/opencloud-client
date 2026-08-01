import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';
import { cn } from '@/design-system/cn';
import { Badge, Dot } from './Badge';
import type { DepartmentCatalogEntry } from '@/api/schemas';
import { getDepartment, iconFromManifest } from '@/design-system/departments';
import { initialsFromName, formatRelativeTime } from '@/utils/format';

interface AgentCardProps {
  agentId: string;
  entry: DepartmentCatalogEntry;
  role: 'manager' | 'specialist' | 'observer';
  status?: string;
  lastSeenAt?: string;
  capabilities?: string[];
  className?: string;
}

export function AgentCard({
  agentId,
  entry,
  role,
  status = 'active',
  lastSeenAt,
  capabilities = [],
  className,
}: AgentCardProps) {
  const Icon = iconFromManifest(entry.icon);
  const presentation = getDepartment(entry.key);
  return (
    <motion.div
      whileHover={{ y: -1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      className={cn(
        'flex items-start gap-3 rounded-[var(--radius-lg)] border p-4 shadow-[var(--shadow-soft)] surface-1',
        className,
      )}
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] text-white"
        style={{
          backgroundColor: presentation?.cssVar
            ? `color-mix(in oklab, var(${presentation.cssVar}) 22%, transparent)`
            : 'var(--color-bg-3)',
          color: presentation?.cssVar ? `var(${presentation.cssVar})` : undefined,
        }}
      >
        {role === 'manager' ? <Icon className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <div className="truncate text-sm font-semibold text-[color:var(--color-fg-1)]">
            {agentId}
          </div>
          <Badge tone={status === 'active' ? 'emerald' : 'neutral'} size="xs" icon={<Dot tone={status === 'active' ? 'emerald' : 'neutral'} pulse={status === 'active'} />}>
            {status}
          </Badge>
        </div>
        <div className="mt-0.5 text-xs text-[color:var(--color-fg-3)]">
          {presentation?.name ?? entry.name} · {role}
        </div>
        {capabilities.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {capabilities.slice(0, 5).map((c) => (
              <span
                key={c}
                className="inline-flex h-5 items-center rounded-full bg-[color:var(--color-bg-3)] px-1.5 text-[10px] uppercase tracking-wider text-[color:var(--color-fg-3)]"
              >
                {c}
              </span>
            ))}
            {capabilities.length > 5 && (
              <span className="inline-flex h-5 items-center rounded-full bg-[color:var(--color-bg-3)] px-1.5 text-[10px] uppercase tracking-wider text-[color:var(--color-fg-3)]">
                +{capabilities.length - 5}
              </span>
            )}
          </div>
        )}
        {lastSeenAt && (
          <div className="mt-2 text-[11px] uppercase tracking-wider text-[color:var(--color-fg-3)]">
            last seen {formatRelativeTime(lastSeenAt)}
          </div>
        )}
      </div>
      <div
        aria-hidden
        className="flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--color-bg-3)] text-[10px] font-semibold text-[color:var(--color-fg-2)]"
      >
        {initialsFromName(agentId)}
      </div>
    </motion.div>
  );
}
