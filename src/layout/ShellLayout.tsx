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
          Footer — single source of truth for the DEPARTIFY ecosystem
          surface inside the Portal. Minimal because the Portal is an
          authenticated SaaS, not a marketing site: no commercial
          CTAs, no grid of product links. Only the brand wordmark,
          the year, and the four official sub-domains so the user
          always sees "still inside DEPARTIFY".
        */}
        <footer
          role="contentinfo"
          className="shrink-0 border-t border-[color:var(--color-line)] bg-[color:var(--color-bg-0)]/80 backdrop-blur"
        >
          <div className="flex flex-col gap-3 px-4 py-3 text-[11px] text-[color:var(--muted-foreground)] sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-display text-[12px] font-semibold tracking-[-0.01em] text-[color:var(--foreground)]">
                DEPARTIFY
              </span>
              <span aria-hidden className="opacity-30">·</span>
              <span className="font-mono uppercase tracking-[0.18em]">
                Business Operating System
              </span>
              <span aria-hidden className="hidden opacity-30 sm:inline">·</span>
              <span className="hidden font-mono uppercase tracking-[0.18em] sm:inline">
                © {year}
              </span>
            </div>

            <nav aria-label="Ecosistema DEPARTIFY" className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {ECOSYSTEM.map((entry) => (
                <a
                  key={entry.href}
                  href={entry.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-sm text-[color:var(--muted-foreground)] transition-colors hover:text-[color:var(--foreground)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--accent)]"
                >
                  <span className="font-mono">{entry.label}</span>
                </a>
              ))}
              <span aria-hidden className="opacity-30">·</span>
              <a
                href={DEPARTIFY_LANDING_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-sm text-[color:var(--accent)] transition-colors hover:opacity-80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--accent)]"
              >
                Volver a departify.app →
              </a>
            </nav>
          </div>
        </footer>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <NotificationsPanel open={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
    </div>
  );
}
