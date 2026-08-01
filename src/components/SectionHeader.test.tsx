import { render, screen } from '@testing-library/react';
import { SectionHeader } from '@/components/SectionHeader';

describe('SectionHeader', () => {
  it('renders title', () => {
    render(<SectionHeader title="My Section" />);
    expect(screen.getByText('My Section')).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    render(<SectionHeader title="Title" subtitle="A description" />);
    expect(screen.getByText('A description')).toBeInTheDocument();
  });

  it('renders eyebrow when provided', () => {
    render(<SectionHeader title="Title" eyebrow="Section 01" index="01" />);
    expect(screen.getByText('01')).toBeInTheDocument();
    expect(screen.getByText('Section 01')).toBeInTheDocument();
  });

  it('renders action element when provided', () => {
    render(
      <SectionHeader
        title="Title"
        action={<button data-testid="action-btn">Action</button>}
      />,
    );
    expect(screen.getByTestId('action-btn')).toBeInTheDocument();
  });

  it('renders children', () => {
    render(
      <SectionHeader title="Title">
        <span data-testid="child">Child</span>
      </SectionHeader>,
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });
});
