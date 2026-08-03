import { BrandMark } from '@/components/BrandMark';

/**
 * Logo — re-exports the BrandMark with the Portal's wordmark.
 *
 * The Portal had a placeholder "N-with-bars" mark since its first
 * release. The official DEPARTIFY identity (the circuit-styled D
 * with 4 nodes, published in the brand manual at docs.departify.app)
 * now lives in BrandMark. Logo keeps the same prop surface so
 * existing call sites don't break — they keep rendering the same
 * shape but with the correct mark.
 *
 * The Portal wordmark is "DEPARTIFY · Business Operating System"
 * (uppercase + small caps tagline). BrandMark renders the
 * lowercase "Deptartify" wordmark from the brand manual; we let
 * the Portal keep its existing wordmark style for the compact
 * variant so dense UI (Topbar, Sidebar) doesn't change.
 *
 * Variants:
 *   - `compact` (default) — BrandMark only, no wordmark.
 *   - `full` — BrandMark + Portal wordmark.
 */
export interface LogoProps {
  size?: number;
  variant?: 'compact' | 'full';
  href?: string;
  external?: boolean;
  tone?: 'accent' | 'inverse';
  className?: string;
  ariaLabel?: string;
}

export function Logo({
  size = 28,
  variant = 'compact',
  href,
  external = false,
  className,
  ariaLabel = 'DEPARTIFY',
}: LogoProps) {
  // accent → light mark (white on transparent); inverse → dark mark.
  const markVariant = 'light' as const;

  const mark = (
    <BrandMark
      size={size}
      showWordmark={false}
      variant={markVariant}
      className={className}
      ariaLabel={ariaLabel}
    />
  );

  const wordmark = (
    <span className="flex min-w-0 flex-col leading-none">
      <span className="font-display truncate text-[1.05em] font-semibold tracking-[-0.02em] text-[color:var(--foreground)]">
        DEPARTIFY
      </span>
      <span className="mt-1 truncate text-[0.42em] font-medium uppercase tracking-[0.22em] text-[color:var(--muted-foreground)] opacity-55">
        Business Operating System
      </span>
    </span>
  );

  const content =
    variant === 'full' ? (
      <span className="inline-flex items-center gap-3 leading-none">
        {mark}
        {wordmark}
      </span>
    ) : (
      mark
    );

  if (!href) {
    return (
      <span role="img" aria-label={ariaLabel} className="inline-flex">
        {content}
      </span>
    );
  }

  return (
    <a
      href={href}
      aria-label={ariaLabel}
      className="inline-flex rounded-[var(--radius-sm)] transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-bg-0)]"
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {content}
    </a>
  );
}