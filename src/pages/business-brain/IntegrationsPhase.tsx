/**
 * Phase 4 — Integraciones, con justificación.
 *
 * No longer a "connect everything" wizard. Each integration must
 * justify itself with a clear value sentence.
 *
 * V1: stub state. Connecting actually means "telling the brain
 * we'll connect this later". No real OAuth in V1.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Link2, Minus } from 'lucide-react';
import { Button } from '@/components/Button';
import { useBrain } from './BrainContext';
import type { BrainTool } from './types';

interface Integration {
  id: BrainTool;
  label: string;
  benefit: string;
}

const SUGGESTED: Integration[] = [
  { id: 'google_workspace', label: 'Google Workspace', benefit: 'Entender tus documentos' },
  { id: 'microsoft_365', label: 'Microsoft 365', benefit: 'Conectar tu correo y calendario' },
  { id: 'hubspot', label: 'HubSpot', benefit: 'Conocer a tus clientes' },
  { id: 'slack', label: 'Slack', benefit: 'Detectar bloqueos del equipo' },
  { id: 'teams', label: 'Microsoft Teams', benefit: 'Escuchar al equipo en su canal' },
];

type State = 'pending' | 'connected' | 'skipped';

export function IntegrationsPhase() {
  const { snapshot, update, setPhase } = useBrain();
  const [states, setStates] = useState<Record<string, State>>({});

  const primary = snapshot.tools?.primary;

  // Always include the primary tool at the top, even if not in SUGGESTED.
  const list = primary
    ? [
        ...(SUGGESTED.find((s) => s.id === primary)
          ? []
          : [{ id: primary, label: prettyTool(primary), benefit: 'Tu stack principal' }]),
        ...SUGGESTED,
      ]
    : SUGGESTED;

  function setState(id: string, state: State) {
    setStates((prev) => ({ ...prev, [id]: state }));
  }

  function handleContinue() {
    const connectedIds = (Object.entries(states)
      .filter(([, s]) => s === 'connected')
      .map(([id]) => id) as BrainTool[]);
    const rejectedIds = (Object.entries(states)
      .filter(([, s]) => s === 'skipped')
      .map(([id]) => id) as BrainTool[]);
    update({
      tools: {
        primary: snapshot.tools?.primary ?? 'other',
        connected: connectedIds,
        rejected: rejectedIds,
      },
      phase: 'diagnosis',
    });
  }

  return (
    <motion.div
      key="integrations"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
      className="mx-auto w-full max-w-2xl"
    >
      <div className="mb-6 text-center">
        <p className="mb-2 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-muted">
          Paso 4 de 5 · Conexiones
        </p>
        <h1 className="font-display text-[clamp(1.5rem,3vw,2rem)] tracking-[-0.02em] text-foreground">
          Para ayudarte mejor necesito conocer cómo trabaja tu empresa.
        </h1>
        <p className="mt-2 text-[0.9375rem] text-muted">
          No te voy a pedir que conectes nada por conectar. Cada conexión te aporta algo claro.
        </p>
      </div>

      <ul className="space-y-3">
        {list.map((integration) => {
          const state = states[integration.id] ?? 'pending';
          return (
            <li
              key={integration.id}
              className="flex items-center justify-between gap-4 rounded-xl border border-border bg-surface p-4"
            >
              <div className="flex items-start gap-3">
                <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
                <div>
                  <p className="text-[0.9375rem] font-medium text-foreground">{integration.label}</p>
                  <p className="mt-0.5 text-[0.8125rem] text-muted">{integration.benefit}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setState(integration.id, state === 'connected' ? 'pending' : 'connected')}
                  className={`inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-[0.8125rem] transition-colors ${
                    state === 'connected'
                      ? 'border-accent bg-accent-soft text-foreground'
                      : 'border-border bg-surface-soft text-muted hover:border-foreground/30 hover:text-foreground'
                  }`}
                >
                  <Check className="h-3.5 w-3.5" />
                  {state === 'connected' ? 'Conectado' : 'Conectar'}
                </button>
                <button
                  type="button"
                  onClick={() => setState(integration.id, state === 'skipped' ? 'pending' : 'skipped')}
                  aria-label="No me interesa"
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-md border transition-colors ${
                    state === 'skipped'
                      ? 'border-foreground/40 bg-surface text-foreground'
                      : 'border-border text-muted hover:border-foreground/30 hover:text-foreground'
                  }`}
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-8 flex items-center justify-between">
        <p className="text-[0.75rem] text-muted">
          No es obligatorio conectar nada para continuar. Puedes entrar al chat con 0 conexiones.
        </p>
        <Button
          onClick={handleContinue}
          variant="primary"
          size="md"

        >
          Continuar al chat
        </Button>
      </div>
    </motion.div>
  );
}

function prettyTool(id: BrainTool): string {
  const map: Record<BrainTool, string> = {
    google_workspace: 'Google Workspace',
    microsoft_365: 'Microsoft 365',
    hubspot: 'HubSpot',
    salesforce: 'Salesforce',
    pipedrive: 'Pipedrive',
    slack: 'Slack',
    teams: 'Teams',
    wordpress: 'WordPress',
    shopify: 'Shopify',
    other: 'Otra herramienta',
  };
  return map[id];
}