/**
 * Phase 2 — Análisis en vivo.
 *
 * The user just clicked "Continuar" from the welcome form. Now the
 * Brain shows that it's actively learning — the checklist ticks
 * appear one after another, never all at once.
 *
 * IMPORTANT: every tick is real. We don't fake progress. If a step
 * had to fall back (e.g. the website fetch failed), we mark it with
 * "?" and explain at the end.
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, HelpCircle, Loader2 } from 'lucide-react';
import { useBrain } from './BrainContext';
import { ANALYZER_STEPS, runAnalysis } from './analyzer';

interface StepState {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'done' | 'fallback';
}

export function AnalyzingPhase() {
  const { snapshot, update, setPhase } = useBrain();
  const [steps, setSteps] = useState<StepState[]>(
    ANALYZER_STEPS.map((s) => ({ id: s.id, label: s.label, status: 'pending' as const })),
  );

  useEffect(() => {
    let cancelled = false;

    async function go() {
      const ctx = await runAnalysis(snapshot.identity.domain ?? '', snapshot.identity.name ?? '');
      if (cancelled) return;

      // Tick steps in order with a small stagger so the UI feels alive.
      for (let i = 0; i < ANALYZER_STEPS.length; i++) {
        if (cancelled) return;
        const step = ANALYZER_STEPS[i]!;
        setSteps((prev) =>
          prev.map((s) => (s.id === step.id ? { ...s, status: 'running' } : s)),
        );
        await new Promise((r) => setTimeout(r, step.durationMs));
        if (cancelled) return;
        setSteps((prev) =>
          prev.map((s) =>
            s.id === step.id
              ? { ...s, status: ctx.fallbackUsed[step.id] ? 'fallback' : 'done' }
              : s,
          ),
        );
      }

      // Persist what the analyzer found.
      update({ market: ctx.market });
      // Hold for a beat so the final tick is visible.
      await new Promise((r) => setTimeout(r, 600));
      if (cancelled) return;
      setPhase('conversation');
    }

    void go();
    return () => {
      cancelled = true;
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