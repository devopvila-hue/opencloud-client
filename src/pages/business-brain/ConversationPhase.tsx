/**
 * Phase 3 — Conversación (REAL).
 *
 * Sprint P0 — Real Connection. The conversation is no longer a
 * scripted sequence of 6 questions. Instead, the model picks the
 * NEXT question based on what it already knows. The user sees one
 * question per turn and the Brain Panel evolves as they answer.
 *
 * Flow:
 *   1. On mount, ask the backend for the first question.
 *   2. The user answers (text or skip).
 *   3. We persist the answer locally + on the backend.
 *   4. We ask the backend for the next question.
 *   5. After the model signals READY_FOR_DIAGNOSIS (or after 8
 *      turns), we advance to the integrations phase.
 *
 * The portal never falls back to a local mock. If the backend
 * errors, we show the error and let the user retry. We do NOT
 * invent a question on the portal.
 */

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Send, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { useBrain } from './BrainContext';
import { patchBrain, streamNextQuestion } from '@/api/brain-api';
import { useToast } from '@/components/Toaster';
import type { SignalState } from './types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const MAX_TURNS = 8;

export function ConversationPhase() {
  const { snapshot, update } = useBrain();
  const toast = useToast();
  const [history, setHistory] = useState<Message[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  const [readyForDiagnosis, setReadyForDiagnosis] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [turn, setTurn] = useState(0);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const streamingRef = useRef<{ cancel: () => void } | null>(null);

  // Ask the backend for the first question on mount.
  useEffect(() => {
    void askBackend([], (q) => {
      setCurrentQuestion(q);
    });
    return () => {
      streamingRef.current?.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function focusInput() {
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  async function askBackend(
    hist: Message[],
    onQuestion: (q: string) => void,
  ): Promise<{ content: string; ok: boolean; error?: string }> {
    setStreaming(true);
    return new Promise((resolve) => {
      const stream = streamNextQuestion(
        hist,
        {
          onReady: () => {
            /* no-op */
          },
          onToken: () => {
            /* tokens are accumulated internally — we just want the
               final question, not the stream. But we still register
               the handler to keep the stream alive. */
          },
          onDone: (content, ok, error) => {
            setStreaming(false);
            if (!ok) {
              toast.push({
                tone: 'error',
                title: 'No he podido pensar la siguiente pregunta',
                description:
                  error ?? 'Reintentemos en un momento.',
              });
              resolve({ content: '', ok: false, error: error ?? 'unknown' });
              return;
            }
            // Strip the READY_FOR_DIAGNOSIS marker if present.
            const cleaned = content.replace(/READY_FOR_DIAGNOSIS/gi, '').trim();
            if (cleaned.length === 0 || /READY_FOR_DIAGNOSIS/i.test(content)) {
              setReadyForDiagnosis(true);
              onQuestion('');
            } else {
              onQuestion(cleaned);
            }
            resolve({ content: cleaned, ok: true });
          },
          onError: (err) => {
            setStreaming(false);
            toast.push({
              tone: 'error',
              title: 'No he podido pensar la siguiente pregunta',
              description: err.message,
            });
            resolve({ content: '', ok: false, error: err.message });
          },
        },
      );
      streamingRef.current = stream;
    });
  }

  async function handleSubmit(e?: FormEvent<HTMLFormElement>) {
    e?.preventDefault();
    const answer = draft.trim();
    if (!answer || !currentQuestion || streaming) return;
    setDraft('');

    const next = [...history, { role: 'user' as const, content: answer }, { role: 'assistant' as const, content: currentQuestion }];
    setHistory(next);
    setCurrentQuestion(null);

    // Persist the new answer to the brain — naive parsing for now:
    // we treat any answer as a free-text "process" entry unless the
    // model returns structured data. The model returns rich
    // structured output in v2; v1 keeps it simple.
    const newTurn = turn + 1;
    setTurn(newTurn);

    // Best-effort patch to backend; the portal snapshot is the cache.
    void patchBrain({
      processes: [
        ...snapshot.processes,
        { description: answer, category: 'other', signal: newTurn === 1 ? 'time-sink' : 'pain' },
      ],
    } as any).catch(() => undefined);
    update({
      processes: [
        ...snapshot.processes,
        { description: answer, category: 'other', signal: newTurn === 1 ? 'time-sink' : 'pain' },
      ],
    });

    if (newTurn >= MAX_TURNS) {
      setReadyForDiagnosis(true);
      return;
    }

    // Ask the model for the next question.
    const result = await askBackend(next, (q) => {
      setCurrentQuestion(q);
      focusInput();
    });
    if (!result.ok) {
      // Leave currentQuestion null so the user can retry.
      setCurrentQuestion(currentQuestion);
    }
  }

  function skip() {
    void handleSubmit();
    // We don't actually skip — we send an empty answer so the model
    // can decide what to do. The user's draft is empty.
    setDraft('(Prefiero no responder ahora)');
  }

  // When the model says READY_FOR_DIAGNOSIS, advance.
  useEffect(() => {
    if (readyForDiagnosis) {
      // Brief pause so the user sees the final question answered.
      const t = setTimeout(() => {
        update({ phase: 'integrations' });
      }, 600);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readyForDiagnosis]);

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

        {history.map((m, i) => (
          <div key={i} className="mb-2 flex items-start justify-end gap-3">
            {m.role === 'user' ? (
              <div className="max-w-md rounded-2xl border border-accent/30 bg-accent-soft px-4 py-2 text-[0.875rem] text-foreground">
                {m.content}
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-foreground">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="rounded-2xl border border-border bg-surface px-4 py-3 text-[0.9375rem] text-foreground">
                  {m.content}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Current question */}
        {currentQuestion && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 flex items-start gap-3"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-foreground">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="rounded-2xl border border-border bg-surface px-4 py-3">
              <p className="text-[0.9375rem] text-foreground">{currentQuestion}</p>
            </div>
          </motion.div>
        )}

        {/* Loading state while the model picks the next question */}
        {!currentQuestion && !readyForDiagnosis && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4 flex items-start gap-3"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-foreground">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="rounded-2xl border border-border bg-surface px-4 py-3 text-[0.875rem] text-muted">
              Pensando la siguiente pregunta…
            </div>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="mt-auto">
          <div className="space-y-3">
            <textarea
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="Escribe tu respuesta…"
              rows={3}
              disabled={streaming || !currentQuestion}
              className="w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-[0.9375rem] text-foreground placeholder:text-muted focus:border-accent focus:outline-none disabled:opacity-50"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[0.75rem] text-muted">
                <button
                  type="button"
                  onClick={skip}
                  className="inline-flex items-center gap-1 text-muted transition-colors hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                  Prefiero no responder
                </button>
                <span>
                  Turno {turn} de {MAX_TURNS}
                </span>
              </div>
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={!draft.trim() || streaming || !currentQuestion}
              >
                {streaming ? 'Enviando…' : 'Siguiente'}
                <Send className="ml-2 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
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