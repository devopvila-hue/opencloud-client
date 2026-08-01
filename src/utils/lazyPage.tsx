import { lazy, Suspense, type ComponentType } from 'react';
import { SkeletonGrid } from '@/components/Skeleton';
import type { ReactNode } from 'react';

interface SkeletonGridWrapperProps {
  className?: string;
}

export function SkeletonGridWrapper({ className }: SkeletonGridWrapperProps) {
  return (
    <div className={className ?? 'p-4 md:p-6'}>
      <SkeletonGrid count={8} cols="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" itemHeight="h-40" />
    </div>
  );
}

/**
 * Wraps a lazily-loaded component in a Suspense boundary with a SkeletonGrid fallback.
 */
export function LazyRoute({
  component: Component,
  fallback,
  className,
}: {
  component: ComponentType;
  fallback?: ReactNode;
  className?: string;
}) {
  return (
    <Suspense fallback={fallback ?? <SkeletonGridWrapper className={className} />}>
      <Component />
    </Suspense>
  );
}

/**
 * Factory to lazily load a page component.
 * The returned component is a plain `lazy()` factory — the Suspense
 * boundary is provided by ShellLayout.
 *
 * Usage:
 *   const ChatPage = lazyPage(() => import('@/pages/ChatPage'));
 */
export function lazyPage<T extends ComponentType<Record<string, never>>>(
  factory: () => Promise<{ default: T }>,
) {
  return lazy(factory);
}
