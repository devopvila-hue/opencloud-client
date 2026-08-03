/**
 * BrandMark — DEPARTIFY official identity.
 *
 * Visual contract: single mark used across the entire DEPARTIFY
 * ecosystem (Landing, Portal auth screens, Client Portal,
 * Docs.departify.app, marketing assets). Replaces the placeholder
 * square-with-bars that the Portal shipped with.
 *
 * Anatomy of the mark (56×56 viewBox):
 *   - Container: square with rx=12, transparent fill (text color).
 *   - Letter D: constructed from rectangles + notches.
 *   - 4 circuit nodes (circles) at the four "joints" of the D.
 *   - 4 connectors (paths) linking the nodes — the signature of
 *     the brand: a circuit-styled D.
 *
 * Variants:
 *   - `light` — white mark on dark backgrounds (Landing, Portal).
 *   - `dark`  — dark mark on light backgrounds (monochrome
 *               fallback, light-mode Portal if ever shipped).
 *   - `accent` — lime container + black D (for hero blocks on
 *                dark backgrounds, very high contrast).
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
  light:  { container: 'transparent', mark: '#FFFFFF', stroke: '#FFFFFF' },
  dark:   { container: 'transparent', mark: '#080908', stroke: '#080908' },
  accent: { container: '#CCFF00',    mark: '#080908', stroke: '#080908' },
} as const;

export function BrandMark({
  size = 40,
  showWordmark = false,
  variant = 'light',
  className,
  ariaLabel = 'Deptartify',
}: BrandMarkProps) {
  const colors = VARIANTS[variant];

  return (
    <span
      className={`inline-flex items-center gap-3 leading-none ${className ?? ''}`}
      role="img"
      aria-label={ariaLabel}
    >
      <svg
        viewBox="0 0 56 56"
        width={size}
        height={size}
        aria-hidden="true"
        className="shrink-0"
      >
        {/* Container */}
        <rect
          width="56"
          height="56"
          rx="12"
          fill={colors.container}
        />

        {/* Letter "D" — three stacked rectangles forming the spine
            and the bowl. The right side is opened with notches so
            the connectors can leave the mark and link to the
            circuit nodes. */}
        <g fill={colors.mark}>
          {/* Vertical bar (spine of the D) */}
          <rect x="11" y="13" width="6" height="30" rx="1" />
          {/* Top horizontal */}
          <rect x="17" y="13" width="18" height="5" rx="1" />
          {/* Bottom horizontal */}
          <rect x="17" y="38" width="18" height="5" rx="1" />
          {/* Right vertical (split into two segments around the
              exit point of the connectors) */}
          <rect x="35" y="18" width="5" height="8" rx="1" />
          <rect x="35" y="30" width="5" height="8" rx="1" />
        </g>

        {/* Circuit connectors — short paths leaving the D and
            reaching the nodes outside the bowl. These are the
            signature of the BrandMark. */}
        <g
          fill="none"
          stroke={colors.stroke}
          strokeWidth="1.2"
          strokeLinecap="round"
        >
          {/* Top right connector (from D body to top-right node) */}
          <path d="M40 22 Q44 22 44 18" />
          {/* Mid right connector (from D body to middle-right node) */}
          <path d="M40 28 Q46 28 46 28" />
          {/* Bottom right connector (from D body to bottom-right node) */}
          <path d="M40 34 Q44 34 44 38" />
          {/* Inner connector linking middle-left node to middle-right
              node — the iconic "circuit" detail. */}
          <path d="M22 28 L46 28" />
        </g>

        {/* Circuit nodes — 4 circles at the joints of the D. */}
        <g fill={colors.stroke}>
          {/* Top-right node (just outside the D bowl) */}
          <circle cx="44" cy="18" r="1.8" />
          {/* Middle-right node */}
          <circle cx="46" cy="28" r="1.8" />
          {/* Bottom-right node */}
          <circle cx="44" cy="38" r="1.8" />
          {/* Inner middle-left node (inside the D spine) */}
          <circle cx="22" cy="28" r="1.8" />
        </g>
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