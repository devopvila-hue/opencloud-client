import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/design-system/cn';

interface EyebrowProps extends HTMLAttributes<HTMLDivElement> {
  label?: string;
  index?: string;
  color?: string;
  children?: ReactNode;
}

export function Eyebrow({ label, index, color, children, className, ...rest }: EyebrowProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-3 font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]',
        className,
      )}
      {...rest}
    >
      {index && (
        <span
          className="inline-flex h-5 items-center rounded-sm border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-1.5 text-[0.625rem] tracking-[0.2em] text-foreground/80"
          style={color ? { color, borderColor: `${color}40` } : undefined}
        >
          {index}
        </span>
      )}
      <span
        className="h-px w-6"
        style={{ background: color ? `${color}60` : 'var(--border-strong)' }}
        aria-hidden
      />
      <span style={color ? { color } : undefined}>{children ?? label}</span>
    </div>
  );
}
