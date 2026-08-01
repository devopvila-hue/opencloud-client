import { Link, Outlet } from 'react-router-dom';
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

export function ShellLayout() {
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

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
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <NotificationsPanel open={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
    </div>
  );
}
