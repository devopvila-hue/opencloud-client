/**
 * BrainDemo — Standalone route for visual review of the Business
 * Brain flow WITHOUT the OnboardingGuard.
 *
 * This route is public (`/brain-demo`). It exists only for the
 * Playwright walkthrough and any future demos. It does NOT persist
 * to the backend — it runs entirely from localStorage.
 *
 * The route lives in this file (not under RequireAuth) so reviewers
 * can see the experience without an authenticated session.
 */

import { AnimatePresence, motion } from 'framer-motion';
import { Logo } from '@/components/Logo';
import { BrainProvider, useBrain } from '@/pages/business-brain/BrainContext';
import { WelcomePhase } from '@/pages/business-brain/WelcomePhase';
import { AnalyzingPhase } from '@/pages/business-brain/AnalyzingPhase';
import { ConversationPhase } from '@/pages/business-brain/ConversationPhase';
import { IntegrationsPhase } from '@/pages/business-brain/IntegrationsPhase';
import { DiagnosisPhase } from '@/pages/business-brain/DiagnosisPhase';

function DemoOrchestrator() {
  const { snapshot } = useBrain();
  const phase = snapshot.phase;

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-accent/3 blur-3xl" />
        <div className="absolute -right-32 bottom-1/4 h-80 w-80 rounded-full bg-accent/2 blur-3xl" />
      </div>

      <header className="relative z-10 flex justify-center px-4 pt-8 sm:pt-12">
        <Logo variant="full" size={32} />
      </header>

      <main className="relative z-10 flex flex-1 items-start justify-center px-4 py-12 sm:py-16">
        <div className="w-full">
          <AnimatePresence mode="wait">
            {phase === 'welcome' && <WelcomePhase key="welcome" />}
            {phase === 'analyzing' && <AnalyzingPhase key="analyzing" />}
            {phase === 'conversation' && <ConversationPhase key="conversation" />}
            {phase === 'integrations' && <IntegrationsPhase key="integrations" />}
            {phase === 'diagnosis' && <DiagnosisPhase key="diagnosis" />}
            {phase === 'completed' && (
              <motion.div
                key="completed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mx-auto max-w-xl text-center"
              >
                <p className="text-[0.9375rem] text-muted">
                  Tu Business Brain está listo. Esta demo no persiste nada en el backend.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <footer className="relative z-10 px-4 pb-6 text-center text-[0.7rem] text-muted">
        Demo · Business Brain Initialization · Vista previa
      </footer>
    </div>
  );
}

export default function BrainDemo() {
  return (
    <BrainProvider>
      <DemoOrchestrator />
    </BrainProvider>
  );
}