import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Header } from './Header';

describe('Header', () => {
  it('should render header with title', () => {
    const onRefresh = vi.fn();
    render(<Header onRefresh={onRefresh} />);

    expect(screen.getByText('📊 Page History')).toBeInTheDocument();
  });

  it('should render refresh button', () => {
    const onRefresh = vi.fn();
    render(<Header onRefresh={onRefresh} />);

    expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
  });

  it('should call onRefresh when button is clicked', async () => {
    const user = userEvent.setup();
    const onRefresh = vi.fn();
    render(<Header onRefresh={onRefresh} />);

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    await user.click(refreshButton);

    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('should have refresh button with correct title attribute', () => {
    const onRefresh = vi.fn();
    render(<Header onRefresh={onRefresh} />);

    const refreshButton = screen.getByTitle('Refresh');
    expect(refreshButton).toBeInTheDocument();
  });

  it('should have refresh button with aria-label', () => {
    const onRefresh = vi.fn();
    render(<Header onRefresh={onRefresh} />);

    expect(screen.getByLabelText('Refresh page data')).toBeInTheDocument();
  });

  it('should have correct CSS classes', () => {
    const onRefresh = vi.fn();
    const { container } = render(<Header onRefresh={onRefresh} />);

    expect(container.querySelector('.header')).toBeInTheDocument();
    expect(container.querySelector('.refresh-btn')).toBeInTheDocument();
  });

  it('should call onRefresh multiple times on multiple clicks', async () => {
    const user = userEvent.setup();
    const onRefresh = vi.fn();
    render(<Header onRefresh={onRefresh} />);

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    await user.click(refreshButton);
    await user.click(refreshButton);
    await user.click(refreshButton);

    expect(onRefresh).toHaveBeenCalledTimes(3);
  });

  it('should display refresh icon', () => {
    const onRefresh = vi.fn();
    render(<Header onRefresh={onRefresh} />);

    expect(screen.getByText('🔄')).toBeInTheDocument();
  });

  it('should render as header element', () => {
    const onRefresh = vi.fn();
    const { container } = render(<Header onRefresh={onRefresh} />);

    expect(container.querySelector('header')).toBeInTheDocument();
  });

  it('should render h1 for title', () => {
    const onRefresh = vi.fn();
    render(<Header onRefresh={onRefresh} />);

    const title = screen.getByRole('heading', { level: 1 });
    expect(title).toHaveTextContent('📊 Page History');
  });
});

