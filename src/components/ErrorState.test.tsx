import { render, screen } from '@testing-library/react';
import { ErrorState } from '@/components/ErrorState';

describe('ErrorState', () => {
  it('renders default title and description', () => {
    render(<ErrorState />);
    expect(screen.getByText('No se pudo cargar este contenido')).toBeInTheDocument();
    expect(screen.getByText('Inténtalo de nuevo o vuelve más tarde.')).toBeInTheDocument();
  });

  it('renders custom title and description', () => {
    render(
      <ErrorState
        title="Failed to connect"
        description="Please check your network connection."
      />,
    );
    expect(screen.getByText('Failed to connect')).toBeInTheDocument();
    expect(screen.getByText('Please check your network connection.')).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    render(<ErrorState icon={<span data-testid="icon">❌</span>} />);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('renders action element when provided', () => {
    render(<ErrorState action={<button data-testid="action">Go Home</button>} />);
    expect(screen.getByTestId('action')).toBeInTheDocument();
  });

  it('renders retry button when retry is provided', () => {
    const mockRetry = vi.fn();
    render(<ErrorState retry={mockRetry} />);
    const button = screen.getByText('Reintentar');
    expect(button).toBeInTheDocument();
    button.click();
    expect(mockRetry).toHaveBeenCalled();
  });

  it('prefers action over retry', () => {
    const mockRetry = vi.fn();
    render(
      <ErrorState
        action={<button data-testid="action">Go Home</button>}
        retry={mockRetry}
      />,
    );
    expect(screen.getByTestId('action')).toBeInTheDocument();
    expect(screen.queryByText('Retry')).not.toBeInTheDocument();
  });
});
