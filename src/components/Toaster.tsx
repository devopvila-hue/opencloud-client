import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '@/design-system/cn';

export type ToastTone = 'success' | 'error' | 'info' | 'warn';

interface ToastItem {
  id: string;
  tone: ToastTone;
  title: string;
  description?: string;
}

interface ToastApi {
  push: (toast: Omit<ToastItem, 'id'>) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback<ToastApi['push']>((toast) => {
    const id = Math.random().toString(36).slice(2);
    setItems((prev) => [...prev, { id, ...toast }]);
    window.setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2"
        aria-live="polite"
      >
        <AnimatePresence>
          {items.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
              className={cn(
                'pointer-events-auto flex items-start gap-3 rounded-[var(--radius-lg)] border p-3 shadow-[var(--shadow-pop)]',
                'panel',
                t.tone === 'error' && 'border-[color:var(--danger)]/40',
                t.tone === 'success' && 'border-[color:var(--success)]/40',
                t.tone === 'warn' && 'border-[color:var(--warning)]/40',
                t.tone === 'info' && 'border-[color:var(--color-dept-operations)]/40',
              )}
            >
              <span
                className={cn(
                  'mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full shrink-0',
                  t.tone === 'error' && 'text-[color:var(--danger)] bg-[color:var(--danger)]/10',
                  t.tone === 'success' && 'text-[color:var(--success)] bg-[color:var(--success)]/10',
                  t.tone === 'warn' && 'text-[color:var(--warning)] bg-[color:var(--warning)]/10',
                  t.tone === 'info' && 'text-[color:var(--color-dept-operations)] bg-[color:var(--color-dept-operations)]/10',
                )}
              >
                {t.tone === 'error' ? (
                  <AlertTriangle className="h-4 w-4" />
                ) : t.tone === 'success' ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : t.tone === 'info' ? (
                  <Info className="h-4 w-4" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-[color:var(--foreground)]">{t.title}</div>
                {t.description && (
                  <div className="mt-0.5 text-xs text-[color:var(--muted-foreground)]">{t.description}</div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setItems((prev) => prev.filter((i) => i.id !== t.id))}
                className="rounded-md p-1 text-[color:var(--muted-foreground)] hover:bg-[color:var(--surface-soft)]"
                aria-label="Dismiss"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Outside provider: silently no-op so components in tests don't crash.
    return { push: () => undefined };
  }
  return ctx;
}
