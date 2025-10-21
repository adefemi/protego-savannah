import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MetricCard } from './MetricCard';

describe('MetricCard', () => {
  it('should render metric card with icon, value, and label', () => {
    render(<MetricCard icon="🔗" value={10} label="Links" />);

    expect(screen.getByText('🔗')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('Links')).toBeInTheDocument();
  });

  it('should format large numbers with locale string', () => {
    render(<MetricCard icon="📝" value={1000} label="Words" />);

    expect(screen.getByText('1,000')).toBeInTheDocument();
  });

  it('should format very large numbers correctly', () => {
    render(<MetricCard icon="🔗" value={1234567} label="Links" />);

    expect(screen.getByText('1,234,567')).toBeInTheDocument();
  });

  it('should render zero value', () => {
    render(<MetricCard icon="🖼️" value={0} label="Images" />);

    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('should have correct CSS classes', () => {
    const { container } = render(<MetricCard icon="🔗" value={5} label="Test" />);

    expect(container.querySelector('.metric-card')).toBeInTheDocument();
    expect(container.querySelector('.metric-icon')).toBeInTheDocument();
    expect(container.querySelector('.metric-value')).toBeInTheDocument();
    expect(container.querySelector('.metric-label')).toBeInTheDocument();
  });

  it('should mark icon as aria-hidden', () => {
    const { container } = render(<MetricCard icon="🔗" value={5} label="Test" />);
    const icon = container.querySelector('.metric-icon');

    expect(icon).toHaveAttribute('aria-hidden', 'true');
  });

  it('should render different icons correctly', () => {
    const { rerender } = render(<MetricCard icon="🔗" value={1} label="Links" />);
    expect(screen.getByText('🔗')).toBeInTheDocument();

    rerender(<MetricCard icon="📝" value={1} label="Words" />);
    expect(screen.getByText('📝')).toBeInTheDocument();

    rerender(<MetricCard icon="🖼️" value={1} label="Images" />);
    expect(screen.getByText('🖼️')).toBeInTheDocument();
  });

  it('should handle decimal values by converting to locale string', () => {
    render(<MetricCard icon="📝" value={1234.56} label="Test" />);

    expect(screen.getByText(/1,234/)).toBeInTheDocument();
  });
});

