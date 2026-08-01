import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardSection } from '@/components/Card';

describe('Card', () => {
  it('renders header and children', () => {
    render(
      <Card>
        <CardHeader title="Title" subtitle="subtitle" />
        <p>Body</p>
      </Card>,
    );
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('subtitle')).toBeInTheDocument();
    expect(screen.getByText('Body')).toBeInTheDocument();
  });

  it('renders CardSection with border', () => {
    render(
      <Card>
        <CardHeader title="Header" />
        <CardSection>Section content</CardSection>
      </Card>,
    );
    expect(screen.getByText('Section content')).toBeInTheDocument();
  });
});
