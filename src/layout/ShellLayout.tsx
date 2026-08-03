import { Outlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Suspense } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { CommandPalette } from './CommandPalette';
import { NotificationsPanel } from './NotificationsPanel';
import { OnboardingGuard } from '@/components/OnboardingGuard';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { SkeletonGrid } from '@/components/Skeleton';
import { useState } from 'react';

/**
 * Public marketing site — clicking the logo (Topbar/Sidebar) and
 * the "Volver a departify.app" link in the footer must both point
 * to the same destination. Centralised here so the URL is the
 * single source of truth.
 */
const DEPARTIFY_LANDING_URL = 'https://departify.app';

/**
 * DEPARTIFY ecosystem URL — every official product lives on a
 * sub-domain of `departify.app`. Keeping this list next to the
 * landing URL means the footer is the only place to update if
 * the ecosystem expands.
 */
const ECOSYSTEM = [
  { label: 'departify.app', href: 'https://departify.app' },
  { label: 'app.departify.app', href: 'https://app.departify.app' },
  { label: 'docs.departify.app', href: 'https://docs.departify.app' },
  { label: 'api.departify.app', href: 'https://api.departify.app' },
];

/**
 * Footer column model — mirrors the Landing footer (departia):
 *   Producto:      links to Landing product pages.
 *   Empresa:       links to Landing corporate pages.
 *   Ecosistema:    the 4 official sub-domains.
 *
 * All links open in a new tab so the authenticated Portal session
 * is preserved.
 */
const FOOTER_COLUMNS = [
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

export function ShellLayout() {
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const year = new Date().getFullYear();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[color:var(--color-bg-1)] text-[color:var(--color-fg-1)]">
      {/* Desktop sidebar */}
      {isDesktop && (
        <div className="shrink-0">
          <Sidebar />
        </div>
      )}

      {/* Mobile drawer */}
      <AnimatePresence>
        {!isDesktop && mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16 }}
              className="fixed inset-0 z-40 bg-black/60"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="fixed inset-y-0 left-0 z-50 w-[260px] shadow-[var(--shadow-pop)]"
            >
              <Sidebar onNavigate={() => setMobileOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          onMenuClick={() => setMobileOpen((v) => !v)}
          onSearchClick={() => setPaletteOpen(true)}
          onNotificationsClick={() => setNotificationsOpen(true)}
        />

        <main className="relative flex-1 overflow-y-auto">
          <Suspense
            fallback={
              <div className="p-4 md:p-6">
                <SkeletonGrid count={8} cols="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" itemHeight="h-40" />
              </div>
            }
          >
            <OnboardingGuard>
              <Outlet />
            </OnboardingGuard>
          </Suspense>
        </main>

        {/*
          Footer — mirror of the public Landing footer (departia).
          Three columns (Producto, Empresa, Ecosistema) with the
          DEPARTIFY wordmark + tagline, plus the year and a CTA back
          to the Landing. All external links open in a new tab so the
          authenticated Portal session is preserved.
        */}
        <footer
          role="contentinfo"
          className="shrink-0 border-t border-[color:var(--color-line)] bg-[color:var(--color-bg-0)]/80 backdrop-blur"
        >
          <div className="mx-auto w-full max-w-[1320px] px-5 py-8 sm:px-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-md">
                <span className="font-display text-[1.5rem] font-semibold tracking-[-0.02em] text-[color:var(--foreground)]">
                  DEPARTIFY
                </span>
                <span className="block text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted-foreground)] opacity-70">
                  Business Operating System
                </span>
                <p className="mt-3 text-sm text-[color:var(--muted-foreground)] text-pretty">
                  Equipos de IA que ejecutan tareas bajo tu control, con tus herramientas y para tu negocio.
                </p>
                <a
                  href={DEPARTIFY_LANDING_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[color:var(--accent)]/40 bg-[color:var(--color-accent-soft)] px-3 py-1.5 text-xs font-medium text-[color:var(--foreground)] transition-colors hover:border-[color:var(--accent)]/70 hover:bg-[color:var(--color-accent)]/20"
                >
                  Volver a departify.app →
                </a>
              </div>

              <div className="grid w-full grid-cols-2 gap-6 sm:grid-cols-3 lg:max-w-2xl">
                {FOOTER_COLUMNS.map((col) => (
                  <div key={col.title}>
                    <h3 className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
                      {col.title}
                    </h3>
                    <ul className="mt-3 space-y-2">
                      {col.links.map((link) => (
                        <li key={link.href}>
                          <a
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-[color:var(--foreground)]/80 transition-colors hover:text-[color:var(--foreground)]"
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

            <div className="mt-8 flex flex-col gap-2 border-t border-[color:var(--color-line)] pt-4 text-[11px] text-[color:var(--muted-foreground)] sm:flex-row sm:items-center sm:justify-between">
              <span className="font-mono uppercase tracking-[0.18em]">© {year} DEPARTIFY</span>
              <span className="font-mono uppercase tracking-[0.18em] opacity-70">
                Made in Spain
              </span>
            </div>
          </div>
        </footer>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <NotificationsPanel open={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
    </div>
  );
}
