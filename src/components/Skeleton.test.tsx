import { render, screen } from '@testing-library/react';
import { Skeleton, SkeletonGrid } from '@/components/Skeleton';

describe('Skeleton', () => {
  it('renders with default classes', () => {
    render(<Skeleton data-testid="skeleton" />);
    const el = screen.getByTestId('skeleton');
    expect(el).toBeInTheDocument();
    expect(el).toHaveClass('shimmer');
    expect(el).toHaveClass('animate-pulse');
  });

  it('merges custom className', () => {
    render(<Skeleton className="h-4 w-4" data-testid="skeleton" />);
    const el = screen.getByTestId('skeleton');
    expect(el).toHaveClass('h-4');
    expect(el).toHaveClass('w-4');
  });

  it('forwards HTML attributes', () => {
    render(<Skeleton data-testid="skeleton" aria-label="loading" />);
    expect(screen.getByTestId('skeleton')).toHaveAttribute('aria-label', 'loading');
  });
});

describe('SkeletonGrid', () => {
  it('renders the specified count of items', () => {
    const { container } = render(<SkeletonGrid count={6} />);
    expect(container.querySelectorAll('[class*="shimmer"]')).toHaveLength(6);
  });

  it('renders default count of 6', () => {
    const { container } = render(<SkeletonGrid />);
    expect(container.querySelectorAll('[class*="shimmer"]')).toHaveLength(6);
  });

  it('renders custom count', () => {
    const { container } = render(<SkeletonGrid count={3} />);
    expect(container.querySelectorAll('[class*="shimmer"]')).toHaveLength(3);
  });
});
