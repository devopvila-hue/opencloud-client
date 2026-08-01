import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/design-system/cn';

interface MetricTileProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  subtitle?: ReactNode;
  delta?: { value: string; positive?: boolean };
  icon?: ReactNode;
  className?: string;
  accent?: string;
}

export function MetricTile({ label, value, hint, subtitle, delta, icon, className, accent = '--accent' }: MetricTileProps) {
  return (
    <motion.div
      whileHover={{ y: -1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      className={cn(
        'overflow-hidden rounded-[var(--radius-lg)] border p-4 shadow-[var(--shadow-soft)] surface-1',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="text-xs uppercase tracking-wider text-[color:var(--muted-foreground)]">
          {label}
        </div>
        {icon && (
          <div
            className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-white"
            style={{
              backgroundColor: `color-mix(in oklab, var(${accent}) 22%, transparent)`,
              color: `var(${accent})`,
            }}
          >
            {icon}
          </div>
        )}
      </div>
      <div className="mt-3 text-2xl font-semibold text-[color:var(--foreground)]">{value}</div>
      {(hint || delta || subtitle) && (
        <div className="mt-1.5 flex items-center gap-2 text-xs text-[color:var(--muted-foreground)]">
          {delta && (
            <span
              className={cn(
                'font-medium',
                delta.positive
                  ? 'text-[color:var(--success)]'
                  : 'text-[color:var(--danger)]',
              )}
            >
              {delta.value}
            </span>
          )}
          {hint && <span>{hint}</span>}
          {subtitle && <span className="text-[color:var(--muted-foreground)]">{subtitle}</span>}
        </div>
      )}
    </motion.div>
  );
}

export function MetricGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4',
        className,
      )}
    >
      {children}
    </div>
  );
}
