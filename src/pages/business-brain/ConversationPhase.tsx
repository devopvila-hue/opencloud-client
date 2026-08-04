/**
 * Phase 3 — Conversación.
 *
 * Six questions, one per turn, in the Director General's voice.
 * The user must never feel they're filling out a form — it's a chat.
 *
 * Question order (designed to maximise signal without exhausting the
 * user; cap at 8 turns including reformulations):
 *
 *   1. ¿Qué tarea te roba más tiempo cada semana?
 *   2. ¿Qué proceso odias hacer y harías que otro hiciese por ti?
 *   3. ¿Qué herramienta utilizáis para trabajar a diario?  (chips)
 *   4. ¿Qué objetivo quieres conseguir este trimestre?      (free text + reformulation)
 *   5. ¿Qué departamento te preocupa más ahora mismo?       (skip-able)
 *   6. ¿Qué significa para ti que este proyecto sea un éxito?(skip-able)
 *
 * The Brain Panel on the right shows progress on each dimension
 * without revealing fake percentages. Pure conceptual bars.
 */

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Send, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { useBrain } from './BrainContext';
import { recommendDepartments } from './analyzer';
import type { BrainProcess, BrainTool, SignalState } from './types';

interface Question {
  id: string;
  prompt: string;
  type: 'text' | 'chips' | 'tool';
  chips?: string[];
  optional?: boolean;
  /** Parse the answer into brain fields. */
  parse: (answer: string) => Partial<{
    processes: BrainProcess[];
    tools: { primary: BrainTool };
    objectives: { raw: string; reformulation: string; quarter: string | null };
    priorities: { worriedAbout: string | null; successDefinition: string | null };
    market: { competitors: string[]; sector: string | null };
  }>;
}

const TOOL_CHIPS: Array<{ id: BrainTool; label: string }> = [
  { id: 'google_workspace', label: 'Google Workspace' },
  { id: 'microsoft_365', label: 'Microsoft 365' },
  { id: 'hubspot', label: 'HubSpot' },
  { id: 'salesforce', label: 'Salesforce' },
  { id: 'pipedrive', label: 'Pipedrive' },
  { id: 'slack', label: 'Slack' },
  { id: 'teams', label: 'Teams' },
  { id: 'other', label: 'Otro' },
];

const QUESTIONS: Question[] = [
  {
    id: 'time-sink',
    prompt: '¿Qué tarea te roba más tiempo cada semana?',
    type: 'text',
    parse(answer) {
      return {
        processes: [
          {
            description: answer,
            category: inferCategory(answer),
            signal: 'time-sink',
          },
        ],
      };
    },
  },
  {
    id: 'pain',
    prompt: '¿Qué proceso odias hacer y harías que otro hiciese por ti?',
    type: 'text',
    parse(answer) {
      return {
        processes: [
          {
            description: answer,
            category: inferCategory(answer),
            signal: 'pain',
          },
        ],
      };
    },
  },
  {
    id: 'tool',
    prompt: '¿Qué herramienta utilizáis para trabajar a diario?',
    type: 'tool',
    parse(answer) {
      const id = (TOOL_CHIPS.find((t) => t.label === answer)?.id ?? 'other') as BrainTool;
      return { tools: { primary: id, connected: [], rejected: [] } };
    },
  },
  {
    id: 'objective',
    prompt: '¿Qué objetivo quieres conseguir este trimestre?',
    type: 'text',
    parse(answer) {
      return {
        objectives: {
          raw: answer,
          reformulation: reformulate(answer),
          quarter: 'current',
        },
      };
    },
  },
  {
    id: 'priority',
    prompt: '¿Qué departamento te preocupa más ahora mismo?',
    type: 'text',
    optional: true,
    parse(answer) {
      return { priorities: { worriedAbout: answer, successDefinition: null } };
    },
  },
  {
    id: 'success',
    prompt: '¿Qué significa para ti que este proyecto sea un éxito?',
    type: 'text',
    optional: true,
    parse(answer) {
      return { priorities: { worriedAbout: null, successDefinition: answer } };
    },
  },
];

function inferCategory(text: string): BrainProcess['category'] {
  const t = text.toLowerCase();
  if (/venta|cliente|factura|crm|pipeline|lead/.test(t)) return 'sales';
  if (/marketing|contenido|redes|campaña|public/.test(t)) return 'marketing';
  if (/operaci[oó]n|proceso|inventario|log[ií]stica|stock/.test(t)) return 'operations';
  if (/soporte|ticket|reclamaci[oó]n|atenci[oó]n/.test(t)) return 'support';
  if (/contabilidad|factura[n]?|impuesto|n[oó]mina|finanza/.test(t)) return 'finance';
  if (/contratar|equipo|persona|nóminas|onboarding/.test(t)) return 'people';
  if (/admin|backoffice|tr[aá]mite|gesti[oó]n documental/.test(t)) return 'admin';
  return 'other';
}

function reformulate(text: string): string {
  // V1 heuristic reformulation. V2 will be model-based.
  const t = text.trim();
  if (!t) return t;
  if (t.length <= 80) return t;
  const first = t.split(/[.,;:]/)[0] ?? t;
  return first.slice(0, 100).trim();
}

export function ConversationPhase() {
  const { snapshot, update, setPhase } = useBrain();
  const [questionIdx, setQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const question = QUESTIONS[questionIdx];
  const isLast = questionIdx === QUESTIONS.length - 1;

  useEffect(() => {
    inputRef.current?.focus();
  }, [questionIdx]);

  function submitAnswer(answer: string) {
    if (!question) return;
    const parsed = question.parse(answer);
    update({
      ...(parsed as any),
      // Append processes, don't overwrite.
      processes:
        parsed.processes && parsed.processes.length > 0
          ? [...(snapshot.processes ?? []), ...parsed.processes]
          : snapshot.processes,
    });
    setAnswers((prev) => [...prev, answer]);
    setDraft('');
    if (isLast) {
      // Build recommendations now that we have enough data.
      const rec = recommendDepartments({
        processes: snapshot.processes,
        objectives: snapshot.objectives,
        tools: snapshot.tools,
      });
      update({
        recommendations: {
          primary: rec.primary
            ? { ...rec.primary, priority: 'primary' }
            : null,
          secondary: rec.secondary
            ? { ...rec.secondary, priority: 'secondary' }
            : null,
          optional: [],
          avoid: rec.avoid,
          rationale: rec.rationale,
        },
        phase: 'integrations',
      });
    } else {
      setQuestionIdx((i) => i + 1);
    }
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!draft.trim() && question?.type !== 'tool') return;
    submitAnswer(draft.trim());
  }

  function pickChip(label: string) {
    submitAnswer(label);
  }

  function skip() {
    if (!question?.optional) return;
    submitAnswer('');
  }

  if (!question) return null;

  return (
    <motion.div
      key="conversation"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
      className="grid w-full max-w-5xl grid-cols-1 gap-8 lg:grid-cols-[1fr_280px]"
    >
      <div className="flex flex-col">
        <div className="mb-6 text-center lg:text-left">
          <p className="mb-2 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-muted">
            Paso 3 de 5 · Conversación con tu Business Brain
          </p>
          <h1 className="font-display text-[clamp(1.25rem,2.4vw,1.75rem)] tracking-[-0.02em] text-foreground">
            He aprendido bastante sobre tu empresa. Pero todavía necesito pensar como tú.
          </h1>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={question.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="mb-4 flex items-start gap-3"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-foreground">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="rounded-2xl border border-border bg-surface px-4 py-3">
              <p className="text-[0.9375rem] text-foreground">{question.prompt}</p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Answer history (compact) */}
        {answers.length > 0 && (
          <div className="mb-4 space-y-2">
            {answers.map((a, i) => (
              <div key={i} className="flex items-start justify-end gap-3">
                <div className="max-w-md rounded-2xl border border-accent/30 bg-accent-soft px-4 py-2 text-[0.875rem] text-foreground">
                  {a || <em className="text-muted">Saltado</em>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Input area */}
        <form onSubmit={handleSubmit} className="mt-auto">
          {question.type === 'tool' ? (
            <div className="flex flex-wrap gap-2">
              {TOOL_CHIPS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => pickChip(t.label)}
                  className="rounded-full border border-border bg-surface px-4 py-2 text-[0.8125rem] text-foreground transition-colors hover:border-accent/40 hover:bg-accent-soft"
                >
                  {t.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <textarea
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e as unknown as FormEvent<HTMLFormElement>);
                  }
                }}
                placeholder="Escribe tu respuesta…"
                rows={3}
                className="w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-[0.9375rem] text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[0.75rem] text-muted">
                  {question.optional && (
                    <button
                      type="button"
                      onClick={skip}
                      className="inline-flex items-center gap-1 text-muted transition-colors hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                      Saltar
                    </button>
                  )}
                  <span>
                    {questionIdx + 1} de {QUESTIONS.length}
                  </span>
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={!draft.trim()}

                >
                  {isLast ? 'Terminar conversación' : 'Siguiente'}
                </Button>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Brain panel */}
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <p className="mb-4 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-muted">
            Business Brain
          </p>
          <ul className="space-y-3">
            {Object.entries(snapshot.signals).map(([key, state]) => (
              <SignalRow key={key} label={LABELS[key as keyof typeof LABELS]} state={state} />
            ))}
          </ul>
        </div>
      </aside>
    </motion.div>
  );
}

const LABELS = {
  empresa: 'Empresa',
  mercado: 'Mercado',
  procesos: 'Procesos',
  herramientas: 'Herramientas',
  objetivos: 'Objetivos',
  prioridades: 'Prioridades',
};

function SignalRow({ label, state }: { label: string; state: SignalState }) {
  const filled = state === 'complete' ? 8 : state === 'partial' ? 4 : 0;
  const tone =
    state === 'complete' ? 'bg-success' : state === 'partial' ? 'bg-accent' : 'bg-border';
  return (
    <li className="flex items-center gap-3 text-[0.8125rem]">
      <span className="w-24 text-muted">{label}</span>
      <div className="flex flex-1 gap-1">
        {Array.from({ length: 8 }).map((_, i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-sm transition-colors ${i < filled ? tone : 'bg-border/60'}`}
          />
        ))}
      </div>
      <span className="w-12 text-right text-[0.6875rem] uppercase tracking-[0.14em] text-muted">
        {state === 'complete' ? <Badge tone="emerald" size="xs">OK</Badge> : state === 'partial' ? <Badge tone="cyan" size="xs">···</Badge> : null}
      </span>
    </li>
  );
}

// keep imports referenced to avoid unused warnings on later edits
void ArrowRight;