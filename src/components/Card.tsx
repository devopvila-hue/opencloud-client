import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/design-system/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  surface?: 1 | 2 | 3;
  variant?: 'default' | 'elevated' | 'soft' | 'outline';
  interactive?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const surfaceMap: Record<NonNullable<CardProps['surface']>, string> = {
  1: 'bg-[color:var(--background-elevated)]',
  2: 'bg-[color:var(--surface)]',
  3: 'bg-[color:var(--surface-soft)]',
};

const variantMap: Record<NonNullable<CardProps['variant']>, string> = {
  default: 'border border-[color:var(--border)]',
  elevated: 'bg-gradient-to-b from-[color:var(--background-elevated)] to-[color:var(--surface)] border border-[color:var(--border)]',
  soft: 'bg-[color:var(--surface)] border border-[color:var(--border)]/60',
  outline: 'bg-transparent border border-[color:var(--border)]',
};

const padMap: Record<NonNullable<CardProps['padding']>, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export function Card({
  surface = 2,
  variant = 'default',
  interactive,
  padding = 'md',
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-lg)] transition-colors',
        surfaceMap[surface],
        variantMap[variant],
        interactive &&
          'cursor-pointer hover:border-[color:var(--border-strong)]',
        padMap[padding],
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-4 flex items-start justify-between gap-3', className)}>
      <div className="min-w-0 flex-1">
        <h3 className="text-base font-medium text-[color:var(--foreground)]">{title}</h3>
        {subtitle && (
          <p className="mt-1 text-xs text-[color:var(--muted-foreground)]">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardSection({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('border-t border-[color:var(--border)] pt-4', className)}>
      {children}
    </div>
  );
}
