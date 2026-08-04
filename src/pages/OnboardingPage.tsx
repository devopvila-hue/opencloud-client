/**
 * OnboardingPage — orquestador del Business Brain Initialization.
 *
 * Este componente NO renderiza un formulario. Orquesta las 6 fases
 * del "Business Brain" tal como se diseñan en
 * `BUSINESS_BRAIN_DESIGN.md`:
 *
 *   Phase 1 (welcome)        → 4 campos, < 30 s
 *   Phase 2 (analyzing)      → checklist en vivo con ticks reales
 *   Phase 3 (conversation)   → chat de 6 preguntas, una por turno
 *   Phase 4 (integrations)   → máximo 5 conexiones con justificación
 *   Phase 5 (diagnosis)      → recomendación con criterio
 *   Phase 6 (WOW)            → ChatPage arranca con un mensaje que ya sabe
 *
 * El snapshot del cerebro vive en localStorage. El backend se
 * actualiza con PATCH al company (igual que la versión anterior)
 * pero solo cuando la fase 5/6 termina — para mantener
 * compatibilidad con OnboardingGuard.
 *
 * Esta página sustituye al formulario de 5 campos. El comportamiento
 * funcional (redirigir al dashboard cuando termina) se conserva.
 */

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { BrainProvider, useBrain } from '@/pages/business-brain/BrainContext';
import { WelcomePhase } from '@/pages/business-brain/WelcomePhase';
import { AnalyzingPhase } from '@/pages/business-brain/AnalyzingPhase';
import { ConversationPhase } from '@/pages/business-brain/ConversationPhase';
import { IntegrationsPhase } from '@/pages/business-brain/IntegrationsPhase';
import { DiagnosisPhase } from '@/pages/business-brain/DiagnosisPhase';
import { useCompany, useCreateCompany, useMe, usePatchCompany } from '@/api/queries';

function OnboardingOrchestrator() {
  const navigate = useNavigate();
  const me = useMe();
  const company = useCompany();
  const patch = usePatchCompany();
  const create = useCreateCompany();
  const { snapshot, hydrated } = useBrain();

  // Persist the brain + mark onboarding as completed when we reach
  // the diagnosis phase and the user makes a choice.
  useEffect(() => {
    if (!hydrated) return;
    if (snapshot.phase !== 'completed') return;
    if (!snapshot.identity.name) return;

    const payload = {
      name: snapshot.identity.name,
      domain: normalizeUrl(snapshot.identity.domain ?? ''),
      sector: snapshot.market.sector,
      employees: snapshot.identity.employees,
      goals: snapshot.objectives?.raw ? [snapshot.objectives.raw] : [],
      onboarding_status: 'completed' as const,
      onboarding_completed_at: new Date().toISOString(),
    };

    (async () => {
      try {
        if (company.data?.id) {
          await patch.mutateAsync({ id: company.data.id, patch: payload });
        } else {
          await create.mutateAsync(payload);
        }
        await company.refetch();
        // Replace so back-button doesn't return to onboarding.
        navigate('/', { replace: true });
      } catch {
        // Best effort — the user can still reach the dashboard manually.
        navigate('/', { replace: true });
      }
    })();
  }, [
    snapshot.phase,
    snapshot.identity.name,
    snapshot.identity.domain,
    snapshot.identity.employees,
    snapshot.objectives,
    snapshot.market.sector,
    hydrated,
    navigate,
    company,
    patch,
    create,
  ]);

  const phase = snapshot.phase;
  const { reset: resetBrain } = useBrain();

  // Emergency exit: if the brain fails repeatedly (e.g. backend
  // tables missing), the user must be able to leave the flow and
  // reach the dashboard. We PATCH the company with whatever we
  // have and redirect — the brain can be re-run later from the
  // Company page.
  async function skipBrain() {
    const payload = {
      name: snapshot.identity.name ?? me.data?.email?.split('@')[0] ?? 'Mi empresa',
      domain: snapshot.identity.domain ?? undefined,
      onboarding_status: 'completed' as const,
      onboarding_completed_at: new Date().toISOString(),
    };
    try {
      if (company.data?.id) {
        await patch.mutateAsync({ id: company.data.id, patch: payload });
      } else {
        await create.mutateAsync(payload);
      }
      await company.refetch();
    } catch {
      /* ignore — user can still reach the dashboard */
    }
    resetBrain();
    navigate('/', { replace: true });
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      {/* Subtle background accents */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-accent/3 blur-3xl" />
        <div className="absolute -right-32 bottom-1/4 h-80 w-80 rounded-full bg-accent/2 blur-3xl" />
      </div>

      <header className="relative z-10 flex justify-between px-4 pt-8 sm:pt-12">
        <div className="flex-1" />
        <Logo variant="full" size={32} />
        <div className="flex flex-1 items-center justify-end pr-1">
          {phase !== 'completed' && (
            <button
              type="button"
              onClick={skipBrain}
              className="rounded-md border border-border bg-surface-soft/50 px-3 py-1.5 text-[0.8125rem] text-muted transition-colors hover:border-foreground/30 hover:text-foreground"
            >
              Saltar al panel
            </button>
          )}
        </div>
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
                className="text-center text-[0.9375rem] text-muted"
              >
                Guardando tu Business Brain…
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {me.data?.email && (
        <footer className="relative z-10 px-4 pb-6 text-center text-[0.75rem] text-muted">
          Sesión iniciada como {me.data.email}
        </footer>
      )}
    </div>
  );
}

function normalizeUrl(url: string): string {
  if (!url) return url;
  if (!/^https?:\/\//i.test(url)) return `https://${url}`;
  return url;
}

export default function OnboardingPage() {
  return (
    <BrainProvider>
      <OnboardingOrchestrator />
    </BrainProvider>
  );
}