import type { ReactNode } from 'react';
import { cn } from '@/design-system/cn';
import { Logo } from '@/components/Logo';

interface PageHeaderProps {
  /** Optional area-specific icon (Lucide). Rendered as the page mark,
   *  next to the DEPARTIFY logo so every screen carries both the
   *  brand identity and the area identity without one substituting
   *  the other. */
  icon?: ReactNode;
  /** Override the area mark background tone (defaults to accent-soft). */
  iconClassName?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Right-side CTA cluster (buttons, badges, links). */
  action?: ReactNode;
  /** Render title + subtitle centred (used on auth-like pages). */
  centered?: boolean;
  className?: string;
}

/**
 * PageHeader — unified header for every internal screen of the
 * Portal. Always shows the DEPARTIFY brand mark (compact, no link)
 * and optionally an area-specific icon next to the title, so the
 * user never loses the brand context no matter which page they
 * land on. Area icons are decorative only; they never replace the
 * logo.
 */
export function PageHeader({
  icon,
  iconClassName,
  title,
  subtitle,
  action,
  centered = false,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        'flex flex-wrap items-end justify-between gap-3',
        centered && 'flex-col items-center justify-center text-center',
        className,
      )}
    >
      <div
        className={cn(
          'flex items-start gap-3',
          centered && 'flex-col items-center',
        )}
      >
        {icon && (
          <div
            className={cn(
              'flex h-12 w-12 shrink-0 items-center justify-center rounded-[22%] bg-[color:var(--color-bg-2)] text-[color:var(--color-fg-2)]',
              iconClassName,
            )}
            aria-hidden
          >
            {icon}
          </div>
        )}
        <Logo size={24} />
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl text-[color:var(--foreground)]">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm text-[color:var(--muted-foreground)] text-pretty">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
