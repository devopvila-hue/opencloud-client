import type { ReactNode } from 'react';
import { motion, type MotionProps, type Transition } from 'framer-motion';
import { Card } from '@/components/Card';
import { Logo } from '@/components/Logo';
import { Footer } from '@/components/Footer';

/**
 * AuthShell — shared layout for every unauthenticated screen.
 *
 * Used by:
 *   - LoginPage    (/login)
 *   - SignupPage   (/signup, /register)
 *   - ForgotPasswordPage (/forgot-password)
 *
 * Visual contract (must be identical across the three):
 *   - Same background (var(--background)) + two blurred accent blobs.
 *   - Same entrance animation (opacity + 8px y, 240ms, [0.32, 0.72, 0, 1]).
 *   - Same Logo at the top (full variant, size 40, with wordmark).
 *   - Same Card elevation + padding (lg).
 *   - Same max-w-md frame, centred, with z-10 above the blobs.
 *   - Same Footer ecosystem strip below the card.
 *
 * Anything that diverges between Login / Signup / Recover lives
 * INSIDE the `children` slot. Anything that should always be the
 * same lives here.
 */
interface AuthShellProps {
  children: ReactNode;
}

const enterTransition: Transition = {
  duration: 0.24,
  ease: [0.32, 0.72, 0, 1],
};

const enterMotion: MotionProps = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: enterTransition,
};

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-between bg-[color:var(--background)] p-4 relative overflow-hidden">
      {/* Background accents matching Landing hero */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute top-1/3 -left-1/4 w-96 h-96 bg-accent/3 rounded-full filter blur-3xl" />
        <div className="absolute bottom-1/4 -right-1/4 w-80 h-80 bg-accent/2 rounded-full filter blur-3xl" />
      </div>

      {/* Main column: wordmark + card */}
      <motion.div
        {...enterMotion}
        className="w-full max-w-md relative z-10 pt-10 sm:pt-16"
      >
        <div className="mb-8 flex justify-center">
          <Logo variant="full" size={40} />
        </div>

        <Card variant="elevated" padding="lg">
          {children}
        </Card>
      </motion.div>

      {/* Same ecosystem footer as the rest of the Portal */}
      <div className="relative z-10 mt-10 w-full max-w-[1320px]">
        <Footer />
      </div>
    </div>
  );
}