import type { ReactNode } from 'react';
import { cn } from '@/design-system/cn';

interface EmptyStateProps {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-[var(--radius-lg)] border border-[color:var(--border)] bg-[color:var(--background-elevated)] p-10 text-center',
        className,
      )}
    >
      {icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--surface-soft)] text-[color:var(--muted-foreground)]">
          {icon}
        </div>
      )}
      <h3 className="font-display text-base tracking-[-0.01em] text-[color:var(--foreground)]">{title}</h3>
      {description && (
        <p className="max-w-md text-sm text-[color:var(--muted-foreground)] text-pretty">{description}</p>
      )}
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}
