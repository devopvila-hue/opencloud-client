/**
 * BrandMark — DEPARTIFY official identity (the "Bible").
 *
 * Visual contract: the exact path published in the DEPARTIFY
 * brand manual at docs.departify.app (the "Bible"). One source
 * of truth for the mark across the entire ecosystem (Landing,
 * Portal auth screens, Client Portal, docs).
 *
 * The path comes from /brand/logo/departify.svg, the official
 * asset shipped with the DNA package. We re-export the same
 * geometry here so the Portal doesn't need a network request to
 * render the mark.
 *
 * Variants:
 *   - `light`  — white mark on dark backgrounds (Landing, Portal).
 *   - `dark`   — dark mark on light backgrounds (monochrome
 *                fallback, print, light-mode Portal if ever
 *                shipped).
 *   - `accent` — lime container + black D (for hero blocks,
 *                marketing assets, very high contrast).
 *
 * Wordmark:
 *   - Rendered as inline text in Inter / system-ui (so it scales
 *     with font-size and respects i18n).
 *   - Optional via `showWordmark` prop. Compact mark keeps the
 *     container only (Topbar, Sidebar, dense UI).
 *   - Full variant mounts the wordmark next to the mark.
 */

interface BrandMarkProps {
  size?: number;
  showWordmark?: boolean;
  variant?: 'light' | 'dark' | 'accent';
  className?: string;
  ariaLabel?: string;
}

const VARIANTS = {
  light:  '#FFFFFF',
  dark:   '#080908',
  accent: '#080908',
} as const;

const CONTAINER = {
  light:  'transparent',
  dark:   'transparent',
  accent: '#CCFF00',
} as const;

export function BrandMark({
  size = 40,
  showWordmark = false,
  variant = 'light',
  className,
  ariaLabel = 'Deptartify',
}: BrandMarkProps) {
  const stroke = VARIANTS[variant];
  const containerFill = CONTAINER[variant];

  return (
    <span
      className={`inline-flex items-center gap-3 leading-none ${className ?? ''}`}
      role="img"
      aria-label={ariaLabel}
    >
      <svg
        viewBox="0 0 1024 1024"
        width={size}
        height={size}
        aria-hidden="true"
        className="shrink-0"
      >
        {containerFill !== 'transparent' && (
          <rect width="1024" height="1024" rx="219" fill={containerFill} />
        )}
        {/* Official Deptartify BrandMark path (the "Bible").
            Source: /brand/logo/departify.svg from docs.departify.app.
            The first sub-path is the circuit-styled "D" with the four
            nodes that form the brand's signature. */}
        <path
          fill={stroke}
          d="M102.4 102.4 H588.8 c159.787 0 289.246 129.459 289.246 289.246 v241.108 c0 159.787 -129.459 289.246 -289.246 289.246 H102.4 V102.4 z M588.8 250.88 H250.88 V819.2 H588.8 c102.717 0 186.286 -83.569 186.286 -186.286 V437.166 c0 -102.717 -83.569 -186.286 -186.286 -186.286 z M246.682 409.6 c-44.847 0 -81.082 36.235 -81.082 81.082 v42.634 c0 44.847 36.235 81.082 81.082 81.082 h60.518 c44.847 0 81.082 -36.235 81.082 -81.082 V490.682 c0 -44.847 -36.235 -81.082 -81.082 -81.082 H246.682 z M803.2 460.8 a61.44 61.44 0 1 1 0 122.88 61.44 61.44 0 0 1 0 -122.88 z M276.97 460.8 a61.44 61.44 0 1 1 0 122.88 61.44 61.44 0 0 1 0 -122.88 z M276.97 768 a61.44 61.44 0 1 1 0 122.88 61.44 61.44 0 0 1 0 -122.88 z M803.2 768 a61.44 61.44 0 1 1 0 122.88 61.44 61.44 0 0 1 0 -122.88 z M803.2 614.4 a61.44 61.44 0 1 1 0 122.88 61.44 61.44 0 0 1 0 -122.88 z"
        />
      </svg>

      {showWordmark && (
        <span
          className="font-semibold tracking-[-0.02em]"
          style={{ fontSize: Math.max(14, Math.round(size * 0.55)) }}
        >
          Deptartify
        </span>
      )}
    </span>
  );
}