/**
 * BrainContext — React context + localStorage persistence for the
 * Business Brain snapshot.
 *
 * Single source of truth during the 6-phase onboarding flow. Reads
 * from localStorage on mount and writes on every change.
 *
 * V1 limitations (intentional):
 *   - No backend persistence. The snapshot lives in localStorage
 *     under a single key. Backend sync is a sprint-2 concern.
 *   - No concurrent-user merging. Last-write-wins by design.
 *   - Schema migrations are explicit (`schemaVersion: 1`).
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { emptySnapshot, computeSignals, type BrainSnapshot, type BrainPhase } from './types';

const STORAGE_KEY = 'departify.business_brain.v1';

interface BrainContextValue {
  snapshot: BrainSnapshot;
  /** Update the snapshot (shallow merge at the top level). */
  update: (partial: Partial<BrainSnapshot>) => void;
  /** Reset the snapshot to the empty state. */
  reset: () => void;
  /** Move to a specific phase. */
  setPhase: (phase: BrainPhase) => void;
  /** True once the snapshot has been hydrated from localStorage. */
  hydrated: boolean;
}

const BrainContext = createContext<BrainContextValue | null>(null);

export function BrainProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<BrainSnapshot>(() => emptySnapshot());
  const [hydrated, setHydrated] = useState(false);
  /** Skip the first effect-run save (which would overwrite localStorage
   *  with the default state before we've read it). */
  const skipFirstSave = useRef(true);

  // Hydrate from localStorage once.
  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
      if (raw) {
        const parsed = JSON.parse(raw) as BrainSnapshot;
        if (parsed && typeof parsed === 'object' && parsed.schemaVersion === 1) {
          setSnapshot(parsed);
        }
      }
    } catch {
      // Bad JSON or quota exceeded — ignore and start fresh.
    }
    setHydrated(true);
  }, []);

  // Persist on every change (skip the initial hydration save).
  useEffect(() => {
    if (!hydrated) return;
    if (skipFirstSave.current) {
      skipFirstSave.current = false;
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      // Quota exceeded or localStorage disabled — degrade silently.
    }
  }, [snapshot, hydrated]);

  const update = useCallback((partial: Partial<BrainSnapshot>) => {
    setSnapshot((prev) => {
      const next: BrainSnapshot = {
        ...prev,
        ...partial,
        // Recompute signals whenever the underlying data may have changed.
        signals: computeSignals({
          ...prev,
          ...partial,
          // Carry over the previously-computed signals if a partial update
          // didn't touch any signal-driving field; the recompute below
          // handles this correctly regardless.
        } as BrainSnapshot),
        updatedAt: new Date().toISOString(),
      };
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setSnapshot(emptySnapshot());
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const setPhase = useCallback((phase: BrainPhase) => {
    update({ phase });
  }, [update]);

  const value = useMemo<BrainContextValue>(
    () => ({ snapshot, update, reset, setPhase, hydrated }),
    [snapshot, update, reset, setPhase, hydrated],
  );

  return <BrainContext.Provider value={value}>{children}</BrainContext.Provider>;
}

export function useBrain(): BrainContextValue {
  const ctx = useContext(BrainContext);
  if (!ctx) throw new Error('useBrain must be used within a BrainProvider');
  return ctx;
}