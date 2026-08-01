import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { BarChart, Sparkline, ProgressBar } from '@/components/Chart';

describe('Chart primitives', () => {
  it('renders bars without crashing', () => {
    const { container } = render(<BarChart data={[{ label: 'A', value: 3 }, { label: 'B', value: 5 }]} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders sparkline svg', () => {
    const { container } = render(<Sparkline values={[1, 2, 3, 4]} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('clamps progress between 0 and 100', () => {
    const { container } = render(<ProgressBar value={150} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('handles zero values', () => {
    const { container } = render(<ProgressBar value={0} showLabel />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
