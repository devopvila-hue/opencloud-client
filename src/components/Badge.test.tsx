import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '@/components/Badge';

describe('Badge', () => {
  it('renders text', () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders with tone and variant', () => {
    render(
      <Badge tone="emerald" variant="outline" size="md">
        Running
      </Badge>,
    );
    expect(screen.getByText('Running')).toBeInTheDocument();
  });

  it('renders all variants without crashing', () => {
    const variants = ['soft', 'outline', 'solid'] as const;
    const tones = ['neutral', 'accent', 'emerald', 'rose', 'amber', 'cyan'] as const;
    for (const v of variants) {
      for (const t of tones) {
        const { unmount } = render(<Badge variant={v} tone={t}>Test</Badge>);
        unmount();
      }
    }
  });
});
