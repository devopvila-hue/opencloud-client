import type { ReactNode } from 'react';
import { cn } from '@/design-system/cn';

export interface TimelineEntry {
  id: string;
  title: ReactNode;
  subtitle?: ReactNode;
  at: string; // ISO
  status?: ReactNode;
  icon?: ReactNode;
}

export function Timeline({ entries, className }: { entries: TimelineEntry[]; className?: string }) {
  if (entries.length === 0) {
    return (
      <div className={cn('text-sm text-[color:var(--muted-foreground)]', className)}>No activity yet.</div>
    );
  }
  return (
    <ol className={cn('relative space-y-4 pl-6', className)}>
      <span
        aria-hidden
        className="absolute left-[10px] top-2 bottom-2 w-px bg-[color:var(--border-strong)]"
      />
      {entries.map((entry) => (
        <li key={entry.id} className="relative">
          <span
            aria-hidden
            className="absolute -left-[18px] top-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-[color:var(--border-strong)] bg-[color:var(--background-elevated)] text-[color:var(--foreground)]"
          >
            {entry.icon ?? <span className="block h-1.5 w-1.5 rounded-full bg-[color:var(--muted-foreground)]" />}
          </span>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div className="text-sm font-medium text-[color:var(--foreground)]">{entry.title}</div>
            {entry.status}
          </div>
          {entry.subtitle && (
            <div className="text-xs text-[color:var(--muted-foreground)]">{entry.subtitle}</div>
          )}
          <div className="mt-0.5 text-[11px] uppercase tracking-wider text-[color:var(--muted)]">
            {entry.at}
          </div>
        </li>
      ))}
    </ol>
  );
}