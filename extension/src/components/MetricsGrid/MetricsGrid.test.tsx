import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MetricsGrid } from './MetricsGrid';
import { PageMetrics } from '../../types';

describe('MetricsGrid', () => {
  it('should render metrics section with title', () => {
    const metrics: PageMetrics = {
      link_count: 10,
      word_count: 500,
      image_count: 5,
      last_visited: '2025-10-21T10:00:00',
    };

    render(<MetricsGrid metrics={metrics} />);

    expect(screen.getByText('Page Metrics')).toBeInTheDocument();
  });

  it('should render all three metric cards', () => {
    const metrics: PageMetrics = {
      link_count: 10,
      word_count: 500,
      image_count: 5,
      last_visited: '2025-10-21T10:00:00',
    };

    render(<MetricsGrid metrics={metrics} />);

    expect(screen.getByText('Links')).toBeInTheDocument();
    expect(screen.getByText('Words')).toBeInTheDocument();
    expect(screen.getByText('Images')).toBeInTheDocument();
  });

  it('should display correct metric values', () => {
    const metrics: PageMetrics = {
      link_count: 15,
      word_count: 750,
      image_count: 8,
      last_visited: '2025-10-21T10:00:00',
    };

    render(<MetricsGrid metrics={metrics} />);

    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('750')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
  });

  it('should display correct icons', () => {
    const metrics: PageMetrics = {
      link_count: 10,
      word_count: 500,
      image_count: 5,
      last_visited: '2025-10-21T10:00:00',
    };

    render(<MetricsGrid metrics={metrics} />);

    expect(screen.getByText('🔗')).toBeInTheDocument();
    expect(screen.getByText('📝')).toBeInTheDocument();
    expect(screen.getByText('🖼️')).toBeInTheDocument();
  });

  it('should display zeros when metrics is null', () => {
    render(<MetricsGrid metrics={null} />);

    const zeros = screen.getAllByText('0');
    expect(zeros).toHaveLength(3);
  });

  it('should handle missing metric values gracefully', () => {
    const metrics = {
      link_count: undefined,
      word_count: undefined,
      image_count: undefined,
      last_visited: null,
    } as any;

    render(<MetricsGrid metrics={metrics} />);

    const zeros = screen.getAllByText('0');
    expect(zeros).toHaveLength(3);
  });

  it('should use logical OR operator for default values', () => {
    const metrics: PageMetrics = {
      link_count: 0,
      word_count: 0,
      image_count: 0,
      last_visited: null,
    };

    render(<MetricsGrid metrics={metrics} />);

    const zeros = screen.getAllByText('0');
    expect(zeros).toHaveLength(3);
  });

  it('should format large numbers with locale string', () => {
    const metrics: PageMetrics = {
      link_count: 1000,
      word_count: 50000,
      image_count: 250,
      last_visited: '2025-10-21T10:00:00',
    };

    render(<MetricsGrid metrics={metrics} />);

    expect(screen.getByText('1,000')).toBeInTheDocument();
    expect(screen.getByText('50,000')).toBeInTheDocument();
    expect(screen.getByText('250')).toBeInTheDocument();
  });

  it('should have correct CSS structure', () => {
    const metrics: PageMetrics = {
      link_count: 10,
      word_count: 500,
      image_count: 5,
      last_visited: '2025-10-21T10:00:00',
    };

    const { container } = render(<MetricsGrid metrics={metrics} />);

    expect(container.querySelector('.metrics')).toBeInTheDocument();
    expect(container.querySelector('.metrics-grid')).toBeInTheDocument();
  });
});

