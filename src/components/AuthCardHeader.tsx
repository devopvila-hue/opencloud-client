import type { ReactNode } from 'react';

/**
 * AuthCardHeader — title + subtitle slot for the AuthShell card.
 *
 * The DEPARTIFY wordmark sits OUTSIDE the card (in AuthShell).
 * This component only renders the page-specific heading and
 * supporting copy, all centred, with consistent spacing so the
 * three auth screens feel identical at a glance.
 */
interface AuthCardHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  className?: string;
}

export function AuthCardHeader({ title, subtitle, className }: AuthCardHeaderProps) {
  return (
    <div className={`mb-6 flex flex-col items-center gap-1 text-center ${className ?? ''}`}>
      <h1 className="font-display text-[1.25rem] tracking-[-0.02em] text-[color:var(--foreground)]">
        {title}
      </h1>
      {subtitle && (
        <p className="text-xs text-[color:var(--muted-foreground)] text-pretty">{subtitle}</p>
      )}
    </div>
  );
}