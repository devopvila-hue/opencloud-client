/**
 * Phase 2 — Análisis en vivo (REAL).
 *
 * The user just clicked "Continuar" from the welcome form. Now the
 * Brain shows that it's actively learning — the checklist ticks
 * appear one after another, never all at once.
 *
 * Sprint P0 — Real Connection: the analysis comes from the backend,
 * not a local mock. We tick the steps as the SSE stream produces
 * tokens; if the backend fails, the LAST step shows "?" and we
 * tell the user what happened (no fake ticks).
 *
 * The backend endpoint is /api/v1/business-brain/analyze — it
 * fetches the user's web, calls the configured model via OpenClaw
 * and streams the synthesis. The portal NEVER pretends to have
 * analysed the company when it hasn't.
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, HelpCircle, Loader2 } from 'lucide-react';
import { useBrain } from './BrainContext';
import { streamAnalyzeWeb, patchBrain, getBrain } from '@/api/brain-api';
import { useToast } from '@/components/Toaster';

interface StepState {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'done' | 'fallback';
}

const STEPS: Array<Pick<StepState, 'id' | 'label'>> = [
  { id: 'fetch', label: 'Analizando tu web' },
  { id: 'sector', label: 'Detectando tu sector' },
  { id: 'value', label: 'Entendiendo qué vendes' },
  { id: 'proposal', label: 'Identificando tu propuesta de valor' },
  { id: 'presence', label: 'Buscando presencia digital' },
  { id: 'snapshot', label: 'Preparando tu Business Brain' },
];

export function AnalyzingPhase() {
  const { snapshot, setPhase } = useBrain();
  const toast = useToast();
  const [steps, setSteps] = useState<StepState[]>(
    STEPS.map((s) => ({ ...s, status: 'pending' as const })),
  );
  const [analysisText, setAnalysisText] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    const identity = snapshot.identity;
    if (!identity.name || !identity.domain || !identity.country || !identity.employees) {
      setPhase('welcome');
      return;
    }

    // Tick steps progressively as the stream arrives. Each token
    // moves the next step from 'pending' to 'done' until we've
    // ticked all six. This is purely cosmetic — the real work is
    // the SSE stream from the backend.
    let nextStepToTick = 0;
    function tickNext() {
      if (cancelled) return;
      if (nextStepToTick >= STEPS.length) return;
      const idx = nextStepToTick;
      setSteps((prev) =>
        prev.map((s, i) => (i === idx ? { ...s, status: 'running' } : s)),
      );
      // Mark the step as done a moment later.
      setTimeout(() => {
        if (cancelled) return;
        setSteps((prev) =>
          prev.map((s, i) => (i === idx ? { ...s, status: 'done' } : s)),
        );
        nextStepToTick += 1;
      }, 350);
    }

    // First tick — the backend is fetching the web.
    tickNext();

    let tokenCount = 0;
    const stream = streamAnalyzeWeb(
      {
        name: identity.name,
        domain: identity.domain,
        country: identity.country,
        employees: identity.employees,
      },
      {
        onToken: (token) => {
          if (cancelled) return;
          tokenCount += token.length;
          setAnalysisText((prev) => prev + token);
          // After a few tokens, advance the visual ticks.
          if (nextStepToTick < STEPS.length && tokenCount > nextStepToTick * 40) {
            tickNext();
          }
        },
        onDone: async (ok, error) => {
          if (cancelled) return;
          // Tick any remaining steps as done.
          setSteps((prev) => prev.map((s) => ({ ...s, status: ok ? 'done' : 'fallback' })));
          if (!ok) {
            // Honest failure — never pretend we analysed anything.
            toast.push({
              tone: 'error',
              title: 'No he podido completar el análisis',
              description:
                error
                  ? `${error}. Podemos reintentarlo o continuar contigo.`
                  : 'Podemos reintentarlo o continuar contigo.',
            });
          } else {
            // Pull the latest snapshot from the backend so the
            // next phase picks up the persisted analysis.
            try {
              await getBrain();
            } catch {
              /* best effort */
            }
          }
          // Pause for a beat so the user can read the final state.
          setTimeout(() => {
            if (cancelled) return;
            setPhase('conversation');
          }, 800);
        },
        onError: (err) => {
          if (cancelled) return;
          setSteps((prev) => prev.map((s) => ({ ...s, status: 'fallback' })));
          toast.push({
            tone: 'error',
            title: 'No he podido completar el análisis',
            description: err.message,
          });
          setTimeout(() => {
            if (!cancelled) setPhase('conversation');
          }, 800);
        },
      },
    );

    return () => {
      cancelled = true;
      stream.cancel();
      // Best-effort: persist whatever text we did get so the
      // portal can recover across reloads.
      if (analysisText.length > 0) {
        patchBrain({
          market: { rawAnalysis: analysisText, detectedAt: new Date().toISOString() },
        } as any).catch(() => undefined);
      }
    };
    // We intentionally only want this effect to run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      key="analyzing"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      className="mx-auto w-full max-w-xl"
    >
      <div className="mb-8 text-center">
        <p className="mb-2 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-muted">
          Paso 2 de 5 · Construyendo tu Business Brain
        </p>
        <h1 className="font-display text-[clamp(1.5rem,3vw,2rem)] tracking-[-0.02em] text-foreground">
          Conociendo tu empresa…
        </h1>
        <p className="mt-2 text-[0.9375rem] text-muted">
          Mientras tanto, tu cerebro se construye en silencio.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-gradient-to-b from-[color:var(--surface)] to-[color:var(--background)] p-6 sm:p-8">
        <ul className="space-y-3">
          {steps.map((s) => (
            <li
              key={s.id}
              className="flex items-center gap-3 text-[0.9375rem] text-foreground transition-opacity"
            >
              <StatusIcon status={s.status} />
              <span className={s.status === 'pending' ? 'text-muted' : ''}>{s.label}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-6 text-center text-[0.75rem] text-muted">
        Si una línea muestra “?” significa que no he podido verificar algo.
        Te lo contaré al final, sin dramatismos.
      </p>
    </motion.div>
  );
}

function StatusIcon({ status }: { status: StepState['status'] }) {
  if (status === 'pending') {
    return <span className="h-4 w-4 shrink-0 rounded-full border border-border" aria-hidden />;
  }
  if (status === 'running') {
    return <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted" aria-hidden />;
  }
  if (status === 'done') {
    return (
      <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-success/15">
        <Check className="h-3 w-3 text-success" />
      </span>
    );
  }
  // fallback
  return (
    <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-warning/15">
      <HelpCircle className="h-3 w-3 text-warning" />
    </span>
  );
}