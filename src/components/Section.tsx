import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/design-system/cn';

interface SectionProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  spacing?: 'default' | 'tight' | 'loose' | 'none';
  as?: 'section' | 'div' | 'article' | 'header' | 'footer';
  id?: string;
}

export function Section({
  children,
  className,
  spacing = 'default',
  as: Tag = 'section',
  id,
  ...rest
}: SectionProps) {
  const spacingClass = {
    none: '',
    tight: 'py-16 sm:py-20',
    default: 'py-24 sm:py-32',
    loose: 'py-32 sm:py-40',
  }[spacing];

  return (
    <Tag id={id} className={cn('relative w-full', spacingClass, className)} {...rest}>
      {children}
    </Tag>
  );
}

export function Container({
  children,
  className,
  width = 'wide',
  ...rest
}: {
  children: ReactNode;
  className?: string;
  width?: 'narrow' | 'wide' | 'full';
} & HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'mx-auto w-full px-5 sm:px-8',
        width === 'narrow' && 'max-w-[920px]',
        width === 'wide' && 'max-w-[1320px]',
        width === 'full' && 'max-w-none',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
