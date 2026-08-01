import type { ReactNode } from 'react';
import { cn } from '@/design-system/cn';
import { Eyebrow } from './Eyebrow';

interface SectionHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  eyebrow?: string;
  index?: string;
  eyebrowColor?: string;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function SectionHeader({
  title,
  subtitle,
  eyebrow,
  index,
  eyebrowColor,
  action,
  children,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn('mb-4 flex flex-col gap-1.5 sm:flex-row sm:items-baseline sm:justify-between', className)}>
      <div className="flex flex-col gap-1">
        {eyebrow && (
          <Eyebrow label={eyebrow} index={index} color={eyebrowColor} />
        )}
        <h2 className="font-display text-[1.0625rem] tracking-[-0.01em] text-[color:var(--foreground)]">
          {title}
        </h2>
        {subtitle && (
          <p className="max-w-2xl text-sm text-[color:var(--muted-foreground)] text-pretty">
            {subtitle}
          </p>
        )}
        {children}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
