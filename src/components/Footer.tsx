import { Logo } from '@/components/Logo';

/**
 * Public marketing site — clicking the logo (Topbar/Sidebar) and
 * the "Volver a departify.app" link in the footer must both point
 * to the same destination. Centralised here so the URL is the
 * single source of truth.
 */
export const DEPARTIFY_LANDING_URL = 'https://departify.app';

/**
 * DEPARTIFY ecosystem URL — every official product lives on a
 * sub-domain of `departify.app`. Keeping this list next to the
 * landing URL means the footer is the only place to update if
 * the ecosystem expands.
 */
export const ECOSYSTEM = [
  { label: 'departify.app', href: 'https://departify.app' },
  { label: 'app.departify.app', href: 'https://app.departify.app' },
  { label: 'docs.departify.app', href: 'https://docs.departify.app' },
  { label: 'api.departify.app', href: 'https://api.departify.app' },
];

/**
 * Footer column model — mirror of the public Landing footer (departia):
 *   Producto:      links to Landing product pages.
 *   Empresa:       links to Landing corporate pages.
 *   Ecosistema:    the 4 official sub-domains.
 *
 * All links open in a new tab so the authenticated Portal session
 * is preserved.
 */
export const FOOTER_COLUMNS = [
  {
    title: 'Producto',
    links: [
      { label: 'Departamentos', href: 'https://departify.app/departamentos' },
      { label: 'Cómo funciona', href: 'https://departify.app/como-funciona' },
      { label: 'Precios', href: 'https://departify.app/precios' },
      { label: 'Recursos', href: 'https://departify.app/recursos' },
    ],
  },
  {
    title: 'Empresa',
    links: [
      { label: 'Seguridad', href: 'https://departify.app/seguridad' },
      { label: 'Privacidad', href: 'https://departify.app/privacidad' },
      { label: 'Términos', href: 'https://departify.app/terminos' },
      { label: 'Cookies', href: 'https://departify.app/cookies' },
    ],
  },
  {
    title: 'Ecosistema',
    links: ECOSYSTEM.map((entry) => ({ label: entry.label, href: entry.href })),
  },
];

/**
 * Footer — DEPARTIFY Client Portal footer.
 *
 * Reusable across the entire Portal. The visual wordmark on the
 * left is the same <Logo /> the Topbar and Sidebar mount, so the
 * three surfaces stay in sync.
 *
 * Layout:
 *   - Left:  Logo (full variant with wordmark) + tagline + CTA back
 *            to the Landing.
 *   - Right: 3 columns (Producto, Empresa, Ecosistema) with the
 *            official links.
 *   - Bottom: copyright + country.
 *
 * Visual contract shared with the Landing footer (departia):
 *   - Three-column responsive grid.
 *   - External links open in a new tab.
 *   - Single source of truth for DEPARTIFY_LANDING_URL.
 */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      role="contentinfo"
      className="shrink-0 border-t border-[color:var(--color-line)] bg-[color:var(--color-bg-0)]/80 backdrop-blur"
    >
      <div className="mx-auto w-full max-w-[1320px] px-5 py-8 sm:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-md">
            <Logo
              size={32}
              href={DEPARTIFY_LANDING_URL}
              external
              variant="full"
              ariaLabel="DEPARTIFY — volver a la web"
            />
            <p className="mt-3 text-sm text-[color:var(--color-muted-foreground)] text-pretty">
              Equipos de IA que ejecutan tareas bajo tu control, con tus herramientas y para tu negocio.
            </p>
            <a
              href={DEPARTIFY_LANDING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[color:var(--color-accent)]/40 bg-[color:var(--color-accent-soft)] px-3 py-1.5 text-xs font-medium text-[color:var(--color-foreground)] transition-colors hover:border-[color:var(--color-accent)]/70 hover:bg-[color:var(--color-accent)]/20"
            >
              Volver a departify.app →
            </a>
          </div>

          <div className="grid w-full grid-cols-2 gap-6 sm:grid-cols-3 lg:max-w-2xl">
            {FOOTER_COLUMNS.map((col) => (
              <div key={col.title}>
                <h3 className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-[color:var(--color-muted-foreground)]">
                  {col.title}
                </h3>
                <ul className="mt-3 space-y-2">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-[color:var(--color-foreground)]/80 transition-colors hover:text-[color:var(--color-foreground)]"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-[color:var(--color-line)] pt-4 text-[11px] text-[color:var(--color-muted-foreground)] sm:flex-row sm:items-center sm:justify-between">
          <span className="font-mono uppercase tracking-[0.18em]">© {year} DEPARTIFY</span>
          <span className="font-mono uppercase tracking-[0.18em] opacity-70">
            Made in Spain
          </span>
        </div>
      </div>
    </footer>
  );
}
