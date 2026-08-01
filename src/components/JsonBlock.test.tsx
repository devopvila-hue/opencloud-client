import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { JsonBlock } from '@/components/JsonBlock';

describe('JsonBlock', () => {
  it('renders serialised JSON', () => {
    render(<JsonBlock value={{ a: 1, b: 'x' }} />);
    expect(screen.getByText(/"a": 1/)).toBeInTheDocument();
  });

  it('renders arrays', () => {
    render(<JsonBlock value={[1, 2, 3]} />);
    expect(screen.getByText(/1,/)).toBeInTheDocument();
  });

  it('handles circular references gracefully', () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    render(<JsonBlock value={circular} />);
    expect(screen.getByText(/Converting/)).toBeInTheDocument();
  });
});
