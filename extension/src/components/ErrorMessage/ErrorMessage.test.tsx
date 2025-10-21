import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorMessage } from './ErrorMessage';

describe('ErrorMessage', () => {
  it('should render error message with default props', () => {
    render(<ErrorMessage />);

    expect(screen.getByText('Oops, something went wrong!')).toBeInTheDocument();
    expect(screen.getByText('An unexpected error occurred. Please try again.')).toBeInTheDocument();
  });

  it('should render custom title and message', () => {
    render(
      <ErrorMessage
        title="Custom Error"
        message="This is a custom error message."
      />
    );

    expect(screen.getByText('Custom Error')).toBeInTheDocument();
    expect(screen.getByText('This is a custom error message.')).toBeInTheDocument();
  });

  it('should not render retry button when onRetry is not provided', () => {
    render(<ErrorMessage />);

    expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
  });

  it('should render retry button when onRetry is provided', () => {
    const onRetry = vi.fn();
    render(<ErrorMessage onRetry={onRetry} />);

    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('should call onRetry when retry button is clicked', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<ErrorMessage onRetry={onRetry} />);

    const retryButton = screen.getByRole('button', { name: /retry/i });
    await user.click(retryButton);

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('should have correct CSS class', () => {
    const { container } = render(<ErrorMessage />);

    expect(container.querySelector('.error')).toBeInTheDocument();
  });

  it('should render title as h3', () => {
    render(<ErrorMessage title="Error Title" />);

    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toHaveTextContent('Error Title');
  });

  it('should render message in paragraph', () => {
    const { container } = render(<ErrorMessage message="Test message" />);

    const paragraph = container.querySelector('p');
    expect(paragraph).toBeInTheDocument();
    expect(paragraph).toHaveTextContent('Test message');
  });

  it('should handle multiple retry button clicks', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<ErrorMessage onRetry={onRetry} />);

    const retryButton = screen.getByRole('button', { name: /retry/i });
    await user.click(retryButton);
    await user.click(retryButton);
    await user.click(retryButton);

    expect(onRetry).toHaveBeenCalledTimes(3);
  });

  it('should use default title when title prop is undefined', () => {
    render(<ErrorMessage message="Custom message" />);

    expect(screen.getByText('Oops, something went wrong!')).toBeInTheDocument();
  });

  it('should use default message when message prop is undefined', () => {
    render(<ErrorMessage title="Custom title" />);

    expect(screen.getByText('An unexpected error occurred. Please try again.')).toBeInTheDocument();
  });

  it('should render with all props provided', () => {
    const onRetry = vi.fn();
    render(
      <ErrorMessage
        title="Network Error"
        message="Failed to connect to the server."
        onRetry={onRetry}
      />
    );

    expect(screen.getByText('Network Error')).toBeInTheDocument();
    expect(screen.getByText('Failed to connect to the server.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('should have retry button with correct CSS class', () => {
    const onRetry = vi.fn();
    const { container } = render(<ErrorMessage onRetry={onRetry} />);

    expect(container.querySelector('.retry-btn')).toBeInTheDocument();
  });
});

