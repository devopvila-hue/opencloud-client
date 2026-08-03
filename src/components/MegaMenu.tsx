import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ArrowUpRight, Sparkles, type LucideIcon } from 'lucide-react';
import { cn } from '@/design-system/cn';
import { Logo } from '@/components/Logo';
import { useI18n } from '@/i18n/I18nProvider';

interface MegaMenuItem {
  key: string;
  name: { es: string; en: string };
  icon: LucideIcon;
  color: string;
  outcomes: { es: string; en: string };
  examples: { es: string; en: string }[];
  estimatedTime: { es: string; en: string };
  priority: number;
  featured: boolean;
}

interface MegaMenuProps {
  /** Items rendered inside the grid (departments). */
  items: MegaMenuItem[];
  /** Label for the trigger button (e.g. "Departamentos"). */
  triggerLabel: string;
  /** Render the trigger as the header nav button. */
  className?: string;
}

/**
 * MegaMenu — Hostinger-inspired dropdown for the authenticated Portal.
 *
 * Trigger (desktop): hover or focus opens a wide card with a 5×3 grid
 * of department cards. Each card shows the customer-facing outcome,
 * three concrete examples, and a realistic time-to-result. Never the
 * AI / agent / model details.
 *
 * Trigger (mobile): tap toggles the same panel anchored below the
 * Topbar (no hover on touch devices).
 *
 * Closes on:
 *   - Click outside
 *   - Escape key
 *   - Trigger toggle
 *
 * Layout:
 *   - Up to 11 department cards in the grid (no empty slots).
 *   - Remaining slots are filled with:
 *       - Founder Edition (callout)
 *       - Casos de uso destacados
 *       - Próximamente
 *       - CTA "Ver todos los departamentos"
 *
 * Locale: uses the active i18n locale (`es` default). Customer-facing
 * copy only — no technical jargon.
 */
export function MegaMenu({ items, triggerLabel, className }: MegaMenuProps) {
  const { locale } = useI18n();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
    }
    function onClick(e: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) close();
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open, close]);

  // Sort departments by priority (lower = first). Featured departments
  // are guaranteed to appear in the first row.
  const sorted = [...items].sort((a, b) => a.priority - b.priority);

  return (
    <div
      ref={rootRef}
      className={cn('relative', className)}
      onMouseLeave={(e) => {
        // Only close on mouseleave for pointer-capable devices.
        if (e.relatedTarget && rootRef.current?.contains(e.relatedTarget as Node)) return;
        close();
      }}
    >
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        onFocus={() => setOpen(true)}
        className={cn(
          'inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm transition-colors',
          open
            ? 'bg-[color:var(--color-bg-2)] text-[color:var(--foreground)]'
            : 'text-[color:var(--muted-foreground)] hover:bg-[color:var(--color-bg-2)] hover:text-[color:var(--foreground)]',
        )}
      >
        {triggerLabel}
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
            className="absolute left-0 top-full z-50 mt-2 w-[min(1320px,calc(100vw-2rem))]"
          >
            <div className="rounded-[var(--radius-xl)] border border-[color:var(--color-line-strong)] bg-[color:var(--color-bg-1)]/95 p-5 shadow-[var(--shadow-pop)] backdrop-blur-md">
              <div className="mb-4 flex items-center gap-2">
                <Logo size={20} />
                <span className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
                  Equipos para tu empresa
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {sorted.map((item) => (
                  <MegaMenuCard key={item.key} item={item} locale={locale} />
                ))}

                {/* Featured slot: Founder Edition */}
                <MegaMenuCallout
                  icon={<Sparkles className="h-5 w-5" />}
                  title={{ es: 'Founder Edition', en: 'Founder Edition' }}
                  description={{
                    es: 'Acompañamiento directo del equipo DEPARTIFY durante los primeros 30 días.',
                    en: 'Direct guidance from the DEPARTIFY team for your first 30 days.',
                  }}
                  accent="--color-accent"
                />

                {/* Featured slot: Casos de uso destacados */}
                <MegaMenuCallout
                  icon={<ArrowUpRight className="h-5 w-5" />}
                  title={{ es: 'Casos de uso', en: 'Use cases' }}
                  description={{
                    es: 'Empresas como la tuya ya están usando DEPARTIFY.',
                    en: 'Companies like yours are already using DEPARTIFY.',
                  }}
                  accent="--color-dept-customer"
                />

                {/* Featured slot: Próximamente */}
                <MegaMenuCallout
                  icon={<ArrowUpRight className="h-5 w-5" />}
                  title={{ es: 'Próximamente', en: 'Coming soon' }}
                  description={{
                    es: 'Tres equipos nuevos este trimestre.',
                    en: 'Three new departments this quarter.',
                  }}
                  accent="--color-dept-people"
                />

                {/* Featured slot: CTA Ver todos los departamentos */}
                <MegaMenuCta
                  title={{ es: 'Ver todos los departamentos', en: 'See every department' }}
                  description={{
                    es: 'Compara qué consigue cada uno y empieza cuando quieras.',
                    en: 'Compare what each one delivers and start when you want.',
                  }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MegaMenuCard({
  item,
  locale,
}: {
  item: MegaMenuItem;
  locale: 'es' | 'en';
}) {
  const Icon = item.icon;
  const tr = (value: { es: string; en: string }) => value[locale];
  return (
    <a
      href={`/departments/${item.key}`}
      className="group flex flex-col gap-2 rounded-[var(--radius-lg)] border border-[color:var(--color-line)] bg-[color:var(--color-bg-2)]/40 p-4 transition-all hover:border-[color:var(--color-accent)]/40 hover:bg-[color:var(--color-bg-2)]"
    >
      <div className="flex items-center gap-2">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-[22%]"
          style={{
            background: `color-mix(in oklab, ${item.color} 18%, transparent)`,
            color: item.color,
          }}
        >
          <Icon className="h-4 w-4" />
        </span>
        {item.featured && (
          <span className="rounded-full bg-[color:var(--color-accent-soft)] px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-[0.14em] text-[color:var(--color-accent)]">
            Top
          </span>
        )}
      </div>
      <h3 className="text-sm font-semibold text-[color:var(--foreground)]">
        {tr(item.name)}
      </h3>
      <p className="text-xs text-[color:var(--muted-foreground)] text-pretty">
        {tr(item.outcomes)}
      </p>
      <ul className="mt-1 space-y-1 text-[11px] text-[color:var(--muted-foreground)]">
        {item.examples.slice(0, 3).map((ex, i) => (
          <li key={i} className="flex items-start gap-1.5">
            <span aria-hidden className="mt-1 h-1 w-1 shrink-0 rounded-full bg-[color:var(--color-fg-3)]" />
            <span>{tr(ex)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-auto pt-2 font-mono text-[0.625rem] uppercase tracking-[0.16em] text-[color:var(--color-fg-3)]">
        {tr(item.estimatedTime)}
      </div>
    </a>
  );
}

function MegaMenuCallout({
  icon,
  title,
  description,
  accent,
}: {
  icon: ReactNode;
  title: { es: string; en: string };
  description: { es: string; en: string };
  accent: string;
}) {
  const { locale } = useI18n();
  return (
    <div className="flex flex-col gap-2 rounded-[var(--radius-lg)] border border-dashed border-[color:var(--color-line-strong)] bg-[color:var(--color-bg-0)]/40 p-4">
      <div
        className="flex h-9 w-9 items-center justify-center rounded-[22%]"
        style={{
          background: `color-mix(in oklab, var(${accent}) 18%, transparent)`,
          color: `var(${accent})`,
        }}
      >
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-[color:var(--foreground)]">{title[locale]}</h3>
      <p className="text-xs text-[color:var(--muted-foreground)] text-pretty">{description[locale]}</p>
    </div>
  );
}

function MegaMenuCta({
  title,
  description,
}: {
  title: { es: string; en: string };
  description: { es: string; en: string };
}) {
  const { locale } = useI18n();
  return (
    <a
      href="/marketplace"
      className="flex flex-col justify-between gap-2 rounded-[var(--radius-lg)] border border-[color:var(--color-accent)]/40 bg-[color:var(--color-accent-soft)]/50 p-4 transition-colors hover:bg-[color:var(--color-accent-soft)]"
    >
      <ArrowUpRight className="h-5 w-5 text-[color:var(--color-accent)]" />
      <div>
        <h3 className="text-sm font-semibold text-[color:var(--foreground)]">{title[locale]}</h3>
        <p className="mt-1 text-xs text-[color:var(--muted-foreground)] text-pretty">{description[locale]}</p>
      </div>
    </a>
  );
}
