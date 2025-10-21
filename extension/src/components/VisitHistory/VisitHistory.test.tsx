import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VisitHistory } from './VisitHistory';
import { PageVisit } from '../../types';

describe('VisitHistory', () => {
  it('should render visit history section with title', () => {
    render(<VisitHistory visits={[]} />);

    expect(screen.getByText('Visit History')).toBeInTheDocument();
  });

  it('should display "No previous visits recorded" when visits array is empty', () => {
    render(<VisitHistory visits={[]} />);

    expect(screen.getByText('No previous visits recorded')).toBeInTheDocument();
  });

  it('should render list of visits when visits are provided', () => {
    const visits: PageVisit[] = [
      {
        id: 1,
        url: 'https://example.com',
        datetime_visited: '2025-10-21T10:00:00',
        link_count: 10,
        word_count: 500,
        image_count: 5,
      },
      {
        id: 2,
        url: 'https://example.com',
        datetime_visited: '2025-10-21T11:00:00',
        link_count: 12,
        word_count: 550,
        image_count: 6,
      },
    ];

    render(<VisitHistory visits={visits} />);

    expect(screen.getByText(/🔗 10/)).toBeInTheDocument();
    expect(screen.getByText(/🔗 12/)).toBeInTheDocument();
  });

  it('should not display empty message when visits exist', () => {
    const visits: PageVisit[] = [
      {
        id: 1,
        url: 'https://example.com',
        datetime_visited: '2025-10-21T10:00:00',
        link_count: 10,
        word_count: 500,
        image_count: 5,
      },
    ];

    render(<VisitHistory visits={visits} />);

    expect(screen.queryByText('No previous visits recorded')).not.toBeInTheDocument();
  });

  it('should render each visit with unique key', () => {
    const visits: PageVisit[] = [
      {
        id: 1,
        url: 'https://example.com',
        datetime_visited: '2025-10-21T10:00:00',
        link_count: 10,
        word_count: 500,
        image_count: 5,
      },
      {
        id: 2,
        url: 'https://example.com',
        datetime_visited: '2025-10-21T11:00:00',
        link_count: 12,
        word_count: 550,
        image_count: 6,
      },
      {
        id: 3,
        url: 'https://example.com',
        datetime_visited: '2025-10-21T12:00:00',
        link_count: 15,
        word_count: 600,
        image_count: 7,
      },
    ];

    const { container } = render(<VisitHistory visits={visits} />);
    const visitItems = container.querySelectorAll('.visit-item');

    expect(visitItems).toHaveLength(3);
  });

  it('should have correct CSS classes', () => {
    const { container } = render(<VisitHistory visits={[]} />);

    expect(container.querySelector('.visit-history')).toBeInTheDocument();
    expect(container.querySelector('.no-visits')).toBeInTheDocument();
  });

  it('should have visits-list class when visits exist', () => {
    const visits: PageVisit[] = [
      {
        id: 1,
        url: 'https://example.com',
        datetime_visited: '2025-10-21T10:00:00',
        link_count: 10,
        word_count: 500,
        image_count: 5,
      },
    ];

    const { container } = render(<VisitHistory visits={visits} />);

    expect(container.querySelector('.visits-list')).toBeInTheDocument();
  });

  it('should handle single visit', () => {
    const visits: PageVisit[] = [
      {
        id: 1,
        url: 'https://example.com',
        datetime_visited: '2025-10-21T10:00:00',
        link_count: 10,
        word_count: 500,
        image_count: 5,
      },
    ];

    const { container } = render(<VisitHistory visits={visits} />);
    const visitItems = container.querySelectorAll('.visit-item');

    expect(visitItems).toHaveLength(1);
  });

  it('should handle many visits', () => {
    const visits: PageVisit[] = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      url: 'https://example.com',
      datetime_visited: `2025-10-21T${10 + i}:00:00`,
      link_count: 10 + i,
      word_count: 500 + i * 10,
      image_count: 5 + i,
    }));

    const { container } = render(<VisitHistory visits={visits} />);
    const visitItems = container.querySelectorAll('.visit-item');

    expect(visitItems).toHaveLength(10);
  });
});

