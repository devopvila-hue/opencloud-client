import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/design-system/cn';

type Tone =
  | 'neutral'
  | 'accent'
  | 'cyan'
  | 'violet'
  | 'magenta'
  | 'emerald'
  | 'amber'
  | 'rose'
  | 'dept-revenue'
  | 'dept-operations'
  | 'dept-people'
  | 'dept-customer'
  | 'dept-compliance'
  | 'dept-governance'
  | 'dept-internal';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  variant?: 'soft' | 'outline' | 'solid';
  size?: 'xs' | 'sm' | 'md';
  icon?: ReactNode;
}

const toneVar: Record<Tone, string> = {
  neutral: 'var(--muted)',
  accent: 'var(--accent)',
  cyan: 'var(--color-dept-operations)',
  violet: 'var(--color-dept-people)',
  magenta: 'var(--color-dept-revenue)',
  emerald: 'var(--success)',
  amber: 'var(--warning)',
  rose: 'var(--danger)',
  'dept-revenue': 'var(--color-dept-revenue)',
  'dept-operations': 'var(--color-dept-operations)',
  'dept-people': 'var(--color-dept-people)',
  'dept-customer': 'var(--color-dept-customer)',
  'dept-compliance': 'var(--color-dept-compliance)',
  'dept-governance': 'var(--color-dept-governance)',
  'dept-internal': 'var(--color-dept-internal)',
};

export function Badge({
  tone = 'neutral',
  variant = 'soft',
  size = 'sm',
  icon,
  children,
  className,
  ...rest
}: BadgeProps) {
  const color = toneVar[tone];
  const sizeClasses = {
    xs: 'h-5 px-1.5 text-[10px]',
    sm: 'h-6 px-2 text-xs',
    md: 'h-7 px-2.5 text-sm',
  };

  const variantStyles = {
    solid: { backgroundColor: color, color: '#0a0c08', borderColor: 'transparent' },
    outline: { backgroundColor: 'transparent', color, borderColor: color },
    soft: {
      backgroundColor: `color-mix(in oklab, ${color} 14%, transparent)`,
      color,
      borderColor: 'transparent',
    },
  }[variant];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-mono uppercase tracking-[0.1em] whitespace-nowrap',
        sizeClasses[size],
        className,
      )}
      style={variantStyles}
      {...rest}
    >
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      {children}
    </span>
  );
}

export function Dot({
  tone = 'emerald',
  pulse = false,
  ...rest
}: {
  tone?: Tone;
  pulse?: boolean;
} & HTMLAttributes<HTMLSpanElement>) {
  const color = toneVar[tone];
  return (
    <span
      className={cn('inline-block h-2 w-2 rounded-full', pulse && 'live-dot')}
      style={{ backgroundColor: color }}
      {...rest}
    />
  );
}

export type { Tone as BadgeTone };
