import { cn } from '@/design-system/cn';

/**
 * DEPARTIFY logo — visual identity mark for the Client Portal.
 *
 * Implementation: pure inline SVG, no external assets, no font
 * dependencies. The mark renders crisply at every size from the
 * 16px favicon up to the 160px landing hero.
 *
 * Shape origin: the official DEPARTIFY mark lives in the public
 * Landing (departia). The Portal consumes the same SVG path so
 * the user perceives a single brand across surfaces.
 *
 * Path anatomy (64×64 grid, scaled by `width`/`height`):
 *   - 1× rounded square (the container), rx=14
 *   - 2× vertical bars at x=15 and x=43, width=6
 *   - 1× diagonal polygon (15,14 → 21,14 → 49,50 → 43,50)
 *
 * Variants:
 *   - `compact` (default) — square mark only. Used in the Topbar
 *     and Sidebar where space is tight.
 *   - `full` — square mark + "DEPARTIFY" wordmark to the right.
 *     Used wherever the product name should appear next to the
 *     mark (e.g. login screen header).
 *
 * Props:
 *   - `size` — pixel size of the square mark (16, 20, 32, 40, …).
 *   - `href` — when provided, wraps the mark in an anchor.
 *   - `external` — opens in a new tab when `href` is external.
 *   - `tone` — 'accent' (lime container, dark bars) or 'inverse'
 *     (dark container, lime bars). Default 'accent'.
 */

export type LogoTone = 'accent' | 'inverse';

export interface LogoProps {
  size?: number;
  variant?: 'compact' | 'full';
  href?: string;
  external?: boolean;
  tone?: LogoTone;
  className?: string;
  ariaLabel?: string;
}

export function Logo({
  size = 28,
  variant = 'compact',
  href,
  external = false,
  tone = 'accent',
  className,
  ariaLabel = 'DEPARTIFY',
}: LogoProps) {
  // The fill colours are tied to the brand tokens so they stay in
  // sync with the rest of the design system. We default to the
  // landing pattern: lime container, near-black cut-outs.
  const containerFill = tone === 'accent' ? 'var(--accent)' : 'var(--background-elevated)';
  const innerFill = tone === 'accent' ? 'var(--accent-foreground)' : 'var(--accent)';

  const mark = (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-[var(--radius-md)] shrink-0',
        className,
      )}
      style={{ width: size, height: size, backgroundColor: containerFill }}
      aria-hidden
    >
      <svg
        viewBox="0 0 64 64"
        width={Math.round(size * 0.78)}
        height={Math.round(size * 0.78)}
        xmlns="http://www.w3.org/2000/svg"
        role="presentation"
      >
        {/* Two vertical bars + diagonal connector — the DEPARTIFY D */}
        <g fill={innerFill}>
          <rect x="15" y="14" width="6" height="36" />
          <rect x="43" y="14" width="6" height="36" />
          <polygon points="15,14 21,14 49,50 43,50" />
        </g>
      </svg>
    </span>
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

  const content = variant === 'full' ? (
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
      {...(external
        ? { target: '_blank', rel: 'noopener noreferrer' }
        : {})}
    >
      {content}
    </a>
  );
}
