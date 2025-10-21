import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VisitItem } from './VisitItem';
import { PageVisit } from '../../types';

describe('VisitItem', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-10-21T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render visit item with date and metrics', () => {
    const visit: PageVisit = {
      id: 1,
      url: 'https://example.com',
      datetime_visited: '2025-10-21T10:00:00',
      link_count: 10,
      word_count: 500,
      image_count: 5,
    };

    render(<VisitItem visit={visit} />);

    expect(screen.getByText(/10\/21\/2025/)).toBeInTheDocument();
    expect(screen.getByText(/10:00/)).toBeInTheDocument();
  });

  it('should display all three metrics with icons', () => {
    const visit: PageVisit = {
      id: 1,
      url: 'https://example.com',
      datetime_visited: '2025-10-21T10:00:00',
      link_count: 15,
      word_count: 750,
      image_count: 8,
    };

    render(<VisitItem visit={visit} />);

    expect(screen.getByText(/🔗 15/)).toBeInTheDocument();
    expect(screen.getByText(/📝 750/)).toBeInTheDocument();
    expect(screen.getByText(/🖼️ 8/)).toBeInTheDocument();
  });

  it('should have title attributes for accessibility', () => {
    const visit: PageVisit = {
      id: 1,
      url: 'https://example.com',
      datetime_visited: '2025-10-21T10:00:00',
      link_count: 10,
      word_count: 500,
      image_count: 5,
    };

    render(<VisitItem visit={visit} />);

    expect(screen.getByTitle('Links')).toBeInTheDocument();
    expect(screen.getByTitle('Words')).toBeInTheDocument();
    expect(screen.getByTitle('Images')).toBeInTheDocument();
  });

  it('should display zero values correctly', () => {
    const visit: PageVisit = {
      id: 2,
      url: 'https://example.com',
      datetime_visited: '2025-10-21T10:00:00',
      link_count: 0,
      word_count: 0,
      image_count: 0,
    };

    render(<VisitItem visit={visit} />);

    expect(screen.getByText(/🔗 0/)).toBeInTheDocument();
    expect(screen.getByText(/📝 0/)).toBeInTheDocument();
    expect(screen.getByText(/🖼️ 0/)).toBeInTheDocument();
  });

  it('should format date using toLocaleString', () => {
    const visit: PageVisit = {
      id: 1,
      url: 'https://example.com',
      datetime_visited: '2025-10-21T10:30:45',
      link_count: 10,
      word_count: 500,
      image_count: 5,
    };

    render(<VisitItem visit={visit} />);

    const dateElement = screen.getByText((content, element) => {
      return element?.className === 'visit-date' && content.includes('10/21/2025');
    });

    expect(dateElement).toBeInTheDocument();
  });

  it('should have correct CSS classes', () => {
    const visit: PageVisit = {
      id: 1,
      url: 'https://example.com',
      datetime_visited: '2025-10-21T10:00:00',
      link_count: 10,
      word_count: 500,
      image_count: 5,
    };

    const { container } = render(<VisitItem visit={visit} />);

    expect(container.querySelector('.visit-item')).toBeInTheDocument();
    expect(container.querySelector('.visit-date')).toBeInTheDocument();
    expect(container.querySelector('.visit-stats')).toBeInTheDocument();
  });

  it('should render large metric values', () => {
    const visit: PageVisit = {
      id: 1,
      url: 'https://example.com',
      datetime_visited: '2025-10-21T10:00:00',
      link_count: 1000,
      word_count: 50000,
      image_count: 250,
    };

    render(<VisitItem visit={visit} />);

    expect(screen.getByText(/🔗 1000/)).toBeInTheDocument();
    expect(screen.getByText(/📝 50000/)).toBeInTheDocument();
    expect(screen.getByText(/🖼️ 250/)).toBeInTheDocument();
  });

  it('should handle different date formats', () => {
    const visit: PageVisit = {
      id: 1,
      url: 'https://example.com',
      datetime_visited: '2025-01-01T00:00:00',
      link_count: 10,
      word_count: 500,
      image_count: 5,
    };

    render(<VisitItem visit={visit} />);

    expect(screen.getByText(/1\/1\/2025/)).toBeInTheDocument();
  });
});

