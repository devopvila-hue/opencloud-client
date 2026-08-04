/**
 * Phase 5 — Diagnóstico.
 *
 * The Brain's first proposal. NOT all departments — only those
 * with a justified reason to start. Includes an "avoid" list to
 * demonstrate the Brain has its own opinion.
 *
 * The user can:
 *   - Accept the recommendation (button)
 *   - Push back ("Hablar con el Director General primero")
 *   - Edit the choice later from the Company page
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, MessageSquare, ShieldAlert, Sparkles } from 'lucide-react';
import { Button } from '@/components/Button';
import { useBrain } from './BrainContext';

export function DiagnosisPhase() {
  const { snapshot, update, setPhase } = useBrain();
  const [busy, setBusy] = useState(false);
  const recs = snapshot.recommendations;

  function startWithPrimary() {
    if (!recs.primary) return;
    setBusy(true);
    update({
      chosenDepartment: recs.primary.department,
      phase: 'completed',
    });
  }

  function chatFirst() {
    setBusy(true);
    update({ phase: 'completed' });
  }

  return (
    <motion.div
      key="diagnosis"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
      className="mx-auto w-full max-w-2xl"
    >
      <div className="mb-6">
        <p className="mb-2 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-muted">
          Paso 5 de 5 · Diagnóstico
        </p>
        <h1 className="font-display text-[clamp(1.5rem,3vw,2rem)] tracking-[-0.02em] text-foreground">
          He terminado.
        </h1>
        <p className="mt-2 text-[0.9375rem] text-muted">
          Ya conozco bastante bien tu empresa. Ya conozco tus procesos, las herramientas con las que trabajáis y vuestros objetivos.
          Ahora puedo ayudarte con criterio.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-gradient-to-b from-surface to-background p-6 sm:p-8">
        <p className="mb-4 text-[0.9375rem] text-foreground">
          He encontrado varias oportunidades. Te las priorizo:
        </p>

        {recs.primary && (
          <RecommendationCard
            priority="primary"
            department={recs.primary.department}
            reason={recs.primary.reason}
          />
        )}
        {recs.secondary && (
          <RecommendationCard
            priority="secondary"
            department={recs.secondary.department}
            reason={recs.secondary.reason}
          />
        )}

        {recs.avoid.length > 0 && (
          <div className="mt-6 border-t border-border pt-5">
            <p className="mb-3 inline-flex items-center gap-1.5 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-muted">
              <ShieldAlert className="h-3 w-3" />
              No empezaría por aquí
            </p>
            <ul className="space-y-2">
              {recs.avoid.map((a) => (
                <li key={a.department} className="text-[0.8125rem] text-muted">
                  <span className="font-medium text-foreground/80">{prettyDept(a.department)}</span>
                  {' — '}
                  {a.reason}
                </li>
              ))}
            </ul>
          </div>
        )}

        {recs.rationale && (
          <p className="mt-6 border-t border-border pt-5 text-[0.8125rem] text-muted">
            {recs.rationale}
          </p>
        )}

        <p className="mt-6 text-[0.75rem] text-muted">
          Por supuesto, la decisión final siempre es tuya.
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Button
          onClick={chatFirst}
          variant="ghost"
          size="md"
          disabled={busy}

        >
          Hablar con el Director primero
        </Button>
        <Button
          onClick={startWithPrimary}
          variant="primary"
          size="md"
          disabled={busy || !recs.primary}

        >
          {recs.primary
            ? `Empezar por ${prettyDept(recs.primary.department)}`
            : 'Continuar al chat'}
        </Button>
      </div>
    </motion.div>
  );
}

function RecommendationCard({
  priority,
  department,
  reason,
}: {
  priority: 'primary' | 'secondary';
  department: string;
  reason: string;
}) {
  const isPrimary = priority === 'primary';
  return (
    <div
      className={`mb-3 rounded-xl border p-4 ${
        isPrimary
          ? 'border-accent/40 bg-accent-soft'
          : 'border-border bg-surface-soft/30'
      }`}
    >
      <div className="mb-1 flex items-center gap-2">
        <span
          className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[0.625rem] font-bold ${
            isPrimary ? 'bg-accent text-[#0a0c08]' : 'bg-foreground/15 text-foreground'
          }`}
        >
          {isPrimary ? '1' : '2'}
        </span>
        <p className="font-display text-[1.125rem] tracking-[-0.01em] text-foreground">
          {prettyDept(department)}
        </p>
        {isPrimary && (
          <span className="inline-flex items-center gap-1 font-mono text-[0.6rem] uppercase tracking-[0.16em] text-muted">
            <Sparkles className="h-3 w-3" />
            Recomendado
          </span>
        )}
      </div>
      <p className="ml-7 text-[0.875rem] text-foreground/85">{reason}</p>
    </div>
  );
}

function prettyDept(slug: string): string {
  const map: Record<string, string> = {
    marketing: 'Marketing',
    ventas: 'Ventas',
    contenido: 'Contenido',
    operaciones: 'Operaciones',
    'atencion-cliente': 'Atención al cliente',
    seo: 'SEO',
    administracion: 'Administración',
    rrhh: 'Recursos Humanos',
    logistica: 'Logística',
    growth: 'Growth',
    analitica: 'Analítica',
    finanzas: 'Finanzas',
    soporte: 'Soporte',
    legal: 'Legal',
    gobierno: 'Gobierno',
  };
  return map[slug] ?? slug;
}