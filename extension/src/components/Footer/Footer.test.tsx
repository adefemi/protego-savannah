import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from './Footer';

describe('Footer', () => {
  it('should render footer with version text', () => {
    render(<Footer />);

    expect(screen.getByText('Protego History Tracker v1.0')).toBeInTheDocument();
  });

  it('should render as footer element', () => {
    const { container } = render(<Footer />);

    expect(container.querySelector('footer')).toBeInTheDocument();
  });

  it('should have correct CSS class', () => {
    const { container } = render(<Footer />);

    expect(container.querySelector('.footer')).toBeInTheDocument();
  });

  it('should render text in paragraph element', () => {
    const { container } = render(<Footer />);

    const paragraph = container.querySelector('footer p');
    expect(paragraph).toBeInTheDocument();
    expect(paragraph).toHaveTextContent('Protego History Tracker v1.0');
  });
});

