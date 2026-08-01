import { describe, it, expect } from 'vitest';
import { lazyPage } from '@/utils/lazyPage';
import { SkeletonGrid } from '@/components/Skeleton';

describe('lazyPage', () => {
  it('returns a component (lazy)', () => {
    const Comp = lazyPage(() => Promise.resolve({ default: () => null }));
    expect(Comp).toBeDefined();
    expect(typeof Comp).toBe('object');
  });
});

describe('SkeletonGrid', () => {
  it('is importable from Skeleton', () => {
    expect(SkeletonGrid).toBeDefined();
  });
});
