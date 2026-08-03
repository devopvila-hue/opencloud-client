import { cn } from '@/design-system/cn';

/**
 * DEPARTIFY logo — visual identity mark for the Client Portal.
 *
 * The official brand mark is a lime-accent rounded square with a
 * bold "D" inside, paired with the DEPARTIFY wordmark.
 *
 * Implementation: pure inline SVG (no external assets, no font
 * dependencies, no FOIT). The mark renders crisply at every size
 * from the 16px favicon up to the 160px landing hero.
 *
 * Variants:
 *   - `compact` (default) — square mark only. Used in the Topbar
 *     where space is tight.
 *   - `full` — square mark + "DEPARTIFY" wordmark to the right.
 *     Used wherever the product name should appear next to the
 *     mark (e.g. login screen header).
 *
 * Props:
 *   - `size` — pixel size of the square mark (16, 20, 32, 40, …).
 *   - `href` — when provided, wraps the mark in an anchor that
 *     navigates to the given URL (e.g. the public landing).
 *   - `external` — opens the link in a new tab when `href` is
 *     external (used for departify.app from inside the portal).
 */

export interface LogoProps {
  size?: number;
  variant?: 'compact' | 'full';
  href?: string;
  external?: boolean;
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
  const mark = (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-[var(--radius-md)] shrink-0',
        'bg-[color:var(--color-accent)] text-[color:var(--color-accent-foreground)]',
        className,
      )}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg
        viewBox="0 0 32 32"
        width={Math.round(size * 0.72)}
        height={Math.round(size * 0.72)}
        xmlns="http://www.w3.org/2000/svg"
        role="presentation"
      >
        {/* DEPARTIFY mark — a square tile (the lime container is
            rendered by the wrapping <span>) with a bold "D"
            rendered as text. Using <text> with a system serif
            fallback guarantees the glyph is always legible
            regardless of font loading state. */}
        <text
          x="16"
          y="22"
          textAnchor="middle"
          fontFamily="'Fraunces', Georgia, 'Times New Roman', serif"
          fontWeight="700"
          fontSize="22"
          fill="currentColor"
        >
          D
        </text>
      </svg>
    </span>
  );

  const wordmark = (
    <span className="flex min-w-0 flex-col leading-tight">
      <span className="truncate text-sm font-semibold tracking-tight text-[color:var(--color-fg-1)]">
        DEPARTIFY
      </span>
      <span className="truncate text-[10px] uppercase tracking-wider text-[color:var(--color-fg-3)]">
        Business Operating System
      </span>
    </span>
  );

  const content = variant === 'full' ? (
    <span className="inline-flex items-center gap-2">
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
      className="inline-flex rounded-[var(--radius-sm)] transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-bg-0)]"
      {...(external
        ? { target: '_blank', rel: 'noopener noreferrer' }
        : {})}
    >
      {content}
    </a>
  );
}
