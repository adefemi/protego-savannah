import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Loading } from './Loading';

describe('Loading', () => {
  it('should render loading component', () => {
    render(<Loading />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render spinner element', () => {
    const { container } = render(<Loading />);

    expect(container.querySelector('.spinner')).toBeInTheDocument();
  });

  it('should have spinner with aria-label', () => {
    render(<Loading />);

    expect(screen.getByLabelText('Loading')).toBeInTheDocument();
  });

  it('should have correct CSS classes', () => {
    const { container } = render(<Loading />);

    expect(container.querySelector('.loading')).toBeInTheDocument();
    expect(container.querySelector('.spinner')).toBeInTheDocument();
  });

  it('should render loading text in paragraph', () => {
    const { container } = render(<Loading />);

    const paragraph = container.querySelector('.loading p');
    expect(paragraph).toBeInTheDocument();
    expect(paragraph).toHaveTextContent('Loading...');
  });
});

