import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/design-system/cn';

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  external?: boolean;
  withArrow?: boolean;
};

const VARIANTS: Record<string, string> = {
  primary:
    'bg-[color:var(--accent)] text-[color:var(--accent-foreground)] hover:bg-[#e3ff7a] border border-accent',
  secondary:
    'bg-[color:var(--surface)] text-[color:var(--foreground)] border border-[color:var(--border-strong)] hover:bg-[color:var(--surface-soft)]',
  ghost:
    'bg-transparent text-[color:var(--foreground)] hover:bg-[color:var(--surface-soft)]',
  outline:
    'bg-transparent text-[color:var(--foreground)] border border-[color:var(--border)] hover:border-foreground/40 hover:bg-[color:var(--surface-soft)]/50',
};

const SIZES: Record<string, string> = {
  sm: 'h-9 px-3.5 text-[0.8125rem] rounded-md',
  md: 'h-11 px-5 text-[0.9375rem] rounded-lg',
  lg: 'h-12 px-6 text-[0.9375rem] rounded-lg',
};

export function LinkButton({
  href,
  children,
  variant = 'secondary',
  size = 'md',
  external,
  className,
  withArrow,
  ...rest
}: Props) {
  const isExternal = external ?? (href?.startsWith('http') ?? false);
  const classes = cn(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium tracking-tight',
    'transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--background)]',
    VARIANTS[variant],
    SIZES[size],
    className,
  );

  if (isExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={classes}
        {...rest}
      >
        {children}
        {withArrow && <ArrowUpRight className="h-4 w-4" />}
      </a>
    );
  }

  return (
    <a href={href} className={classes} {...rest}>
      {children}
      {withArrow && <ArrowUpRight className="h-4 w-4" />}
    </a>
  );
}
