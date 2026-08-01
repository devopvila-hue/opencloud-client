import type { ReactNode } from 'react';
import { cn } from '@/design-system/cn';

interface ErrorStateProps {
  icon?: ReactNode;
  title?: string;
  description?: string;
  action?: ReactNode;
  retry?: () => void;
  className?: string;
}

export function ErrorState({
  icon,
  title = 'Something went wrong',
  description = "We couldn't load this content. Try refreshing or check back later.",
  action,
  retry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-[var(--radius-lg)] border border-[color:var(--danger)]/30 bg-[color:var(--rose-soft)] p-8 text-center',
        className,
      )}
    >
      {icon && (
        <div className="flex h-10 w-10 items-center justify-center rounded-full text-[color:var(--danger)]">
          {icon}
        </div>
      )}
      <h3 className="font-display text-base tracking-[-0.01em] text-[color:var(--foreground)]">
        {title}
      </h3>
      {description && (
        <p className="max-w-md text-sm text-[color:var(--muted-foreground)] text-pretty">
          {description}
        </p>
      )}
      {(action || retry) && (
        <div className="pt-1">
          {action ?? (retry ? (
            <button
              type="button"
              onClick={retry}
              className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-2 text-sm font-medium text-[color:var(--foreground)] hover:bg-[color:var(--surface-soft)]"
            >
              Retry
            </button>
          ) : undefined)}
        </div>
      )}
    </div>
  );
}
