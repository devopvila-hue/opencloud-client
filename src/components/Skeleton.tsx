import type { HTMLAttributes } from 'react';
import { cn } from '@/design-system/cn';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className, ...rest }: SkeletonProps) {
  return (
    <div
      className={cn(
        'shimmer animate-pulse rounded-[var(--radius-md)] bg-[color:var(--surface-soft)]',
        className,
      )}
      {...rest}
    />
  );
}

export function SkeletonGrid({
  count = 6,
  cols = 'sm:grid-cols-2 lg:grid-cols-3',
  itemHeight = 'h-44',
}: {
  count?: number;
  cols?: string;
  itemHeight?: string;
}) {
  return (
    <div className={cn('grid grid-cols-1 gap-4', cols)}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={cn(itemHeight, 'w-full')} />
      ))}
    </div>
  );
}
