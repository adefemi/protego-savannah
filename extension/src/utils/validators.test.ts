/**
 * Tests for runtime validation utilities
 */

import { describe, it, expect } from 'vitest';
import {
  isPageVisit,
  isPageVisitArray,
  isPageMetrics,
  isPageMetricsData,
  isChromeMessage,
  validateOrThrow,
} from './validators';
import { PageVisit, PageMetrics, PageMetricsData } from '../types';

describe('isPageVisit', () => {
  it('validates a valid PageVisit object', () => {
    const visit: PageVisit = {
      id: 1,
      url: 'https://example.com',
      datetime_visited: '2024-01-01T00:00:00Z',
      link_count: 10,
      word_count: 100,
      image_count: 5,
    };
    expect(isPageVisit(visit)).toBe(true);
  });

  it('rejects object with missing id', () => {
    const visit = {
      url: 'https://example.com',
      datetime_visited: '2024-01-01T00:00:00Z',
      link_count: 10,
      word_count: 100,
      image_count: 5,
    };
    expect(isPageVisit(visit)).toBe(false);
  });

  it('rejects object with wrong id type', () => {
    const visit = {
      id: '1',
      url: 'https://example.com',
      datetime_visited: '2024-01-01T00:00:00Z',
      link_count: 10,
      word_count: 100,
      image_count: 5,
    };
    expect(isPageVisit(visit)).toBe(false);
  });

  it('rejects object with missing url', () => {
    const visit = {
      id: 1,
      datetime_visited: '2024-01-01T00:00:00Z',
      link_count: 10,
      word_count: 100,
      image_count: 5,
    };
    expect(isPageVisit(visit)).toBe(false);
  });

  it('rejects null', () => {
    expect(isPageVisit(null)).toBe(false);
  });

  it('rejects undefined', () => {
    expect(isPageVisit(undefined)).toBe(false);
  });

  it('rejects string', () => {
    expect(isPageVisit('not an object')).toBe(false);
  });

  it('rejects number', () => {
    expect(isPageVisit(123)).toBe(false);
  });

  it('rejects array', () => {
    expect(isPageVisit([])).toBe(false);
  });
});

describe('isPageVisitArray', () => {
  it('validates an array of valid PageVisits', () => {
    const visits: PageVisit[] = [
      {
        id: 1,
        url: 'https://example.com',
        datetime_visited: '2024-01-01T00:00:00Z',
        link_count: 10,
        word_count: 100,
        image_count: 5,
      },
      {
        id: 2,
        url: 'https://example.org',
        datetime_visited: '2024-01-02T00:00:00Z',
        link_count: 20,
        word_count: 200,
        image_count: 10,
      },
    ];
    expect(isPageVisitArray(visits)).toBe(true);
  });

  it('validates an empty array', () => {
    expect(isPageVisitArray([])).toBe(true);
  });

  it('rejects an array with one invalid item', () => {
    const visits = [
      {
        id: 1,
        url: 'https://example.com',
        datetime_visited: '2024-01-01T00:00:00Z',
        link_count: 10,
        word_count: 100,
        image_count: 5,
      },
      {
        id: 2,
        // Missing url
        datetime_visited: '2024-01-02T00:00:00Z',
        link_count: 20,
        word_count: 200,
        image_count: 10,
      },
    ];
    expect(isPageVisitArray(visits)).toBe(false);
  });

  it('rejects non-array', () => {
    expect(isPageVisitArray('not an array')).toBe(false);
  });

  it('rejects null', () => {
    expect(isPageVisitArray(null)).toBe(false);
  });
});

describe('isPageMetrics', () => {
  it('validates a valid PageMetrics object', () => {
    const metrics: PageMetrics = {
      link_count: 10,
      word_count: 100,
      image_count: 5,
      last_visited: '2024-01-01T00:00:00Z',
    };
    expect(isPageMetrics(metrics)).toBe(true);
  });

  it('validates PageMetrics with null last_visited', () => {
    const metrics: PageMetrics = {
      link_count: 10,
      word_count: 100,
      image_count: 5,
      last_visited: null,
    };
    expect(isPageMetrics(metrics)).toBe(true);
  });

  it('rejects object with missing link_count', () => {
    const metrics = {
      word_count: 100,
      image_count: 5,
      last_visited: '2024-01-01T00:00:00Z',
    };
    expect(isPageMetrics(metrics)).toBe(false);
  });

  it('rejects object with wrong type for last_visited', () => {
    const metrics = {
      link_count: 10,
      word_count: 100,
      image_count: 5,
      last_visited: 123,
    };
    expect(isPageMetrics(metrics)).toBe(false);
  });

  it('rejects null', () => {
    expect(isPageMetrics(null)).toBe(false);
  });

  it('rejects undefined', () => {
    expect(isPageMetrics(undefined)).toBe(false);
  });
});

describe('isPageMetricsData', () => {
  it('validates a valid PageMetricsData object', () => {
    const data: PageMetricsData = {
      url: 'https://example.com',
      link_count: 10,
      word_count: 100,
      image_count: 5,
    };
    expect(isPageMetricsData(data)).toBe(true);
  });

  it('rejects object with empty url', () => {
    const data = {
      url: '',
      link_count: 10,
      word_count: 100,
      image_count: 5,
    };
    expect(isPageMetricsData(data)).toBe(false);
  });

  it('rejects object with negative link_count', () => {
    const data = {
      url: 'https://example.com',
      link_count: -1,
      word_count: 100,
      image_count: 5,
    };
    expect(isPageMetricsData(data)).toBe(false);
  });

  it('rejects object with negative word_count', () => {
    const data = {
      url: 'https://example.com',
      link_count: 10,
      word_count: -1,
      image_count: 5,
    };
    expect(isPageMetricsData(data)).toBe(false);
  });

  it('rejects object with negative image_count', () => {
    const data = {
      url: 'https://example.com',
      link_count: 10,
      word_count: 100,
      image_count: -1,
    };
    expect(isPageMetricsData(data)).toBe(false);
  });

  it('accepts object with zero counts', () => {
    const data = {
      url: 'https://example.com',
      link_count: 0,
      word_count: 0,
      image_count: 0,
    };
    expect(isPageMetricsData(data)).toBe(true);
  });

  it('rejects null', () => {
    expect(isPageMetricsData(null)).toBe(false);
  });
});

describe('isChromeMessage', () => {
  it('validates a valid PAGE_METRICS message', () => {
    const message = {
      type: 'PAGE_METRICS',
      data: {
        url: 'https://example.com',
        link_count: 10,
        word_count: 100,
        image_count: 5,
      },
    };
    expect(isChromeMessage(message)).toBe(true);
  });

  it('validates a valid GET_VISITS message', () => {
    const message = {
      type: 'GET_VISITS',
      url: 'https://example.com',
    };
    expect(isChromeMessage(message)).toBe(true);
  });

  it('validates a valid GET_METRICS message', () => {
    const message = {
      type: 'GET_METRICS',
      url: 'https://example.com',
    };
    expect(isChromeMessage(message)).toBe(true);
  });

  it('rejects message with invalid type', () => {
    const message = {
      type: 'INVALID_TYPE',
      url: 'https://example.com',
    };
    expect(isChromeMessage(message)).toBe(false);
  });

  it('rejects PAGE_METRICS message without data', () => {
    const message = {
      type: 'PAGE_METRICS',
    };
    expect(isChromeMessage(message)).toBe(false);
  });

  it('rejects PAGE_METRICS message with invalid data', () => {
    const message = {
      type: 'PAGE_METRICS',
      data: {
        url: '',
        link_count: -1,
      },
    };
    expect(isChromeMessage(message)).toBe(false);
  });

  it('rejects GET_VISITS message without url', () => {
    const message = {
      type: 'GET_VISITS',
    };
    expect(isChromeMessage(message)).toBe(false);
  });

  it('rejects GET_METRICS message with empty url', () => {
    const message = {
      type: 'GET_METRICS',
      url: '',
    };
    expect(isChromeMessage(message)).toBe(false);
  });

  it('rejects message without type', () => {
    const message = {
      url: 'https://example.com',
    };
    expect(isChromeMessage(message)).toBe(false);
  });

  it('rejects null', () => {
    expect(isChromeMessage(null)).toBe(false);
  });

  it('rejects undefined', () => {
    expect(isChromeMessage(undefined)).toBe(false);
  });

  it('rejects string', () => {
    expect(isChromeMessage('not an object')).toBe(false);
  });
});

describe('validateOrThrow', () => {
  it('returns data if validation passes', () => {
    const data: PageMetrics = {
      link_count: 10,
      word_count: 100,
      image_count: 5,
      last_visited: null,
    };
    const result = validateOrThrow(data, isPageMetrics, 'Invalid metrics');
    expect(result).toBe(data);
  });

  it('throws error if validation fails', () => {
    const data = {
      invalid: 'data',
    };
    expect(() => {
      validateOrThrow(data, isPageMetrics, 'Invalid metrics');
    }).toThrow('Invalid metrics');
  });

  it('throws custom error message', () => {
    const data = null;
    expect(() => {
      validateOrThrow(data, isPageVisit, 'Custom error message');
    }).toThrow('Custom error message');
  });

  it('works with different validators', () => {
    const visits: PageVisit[] = [
      {
        id: 1,
        url: 'https://example.com',
        datetime_visited: '2024-01-01T00:00:00Z',
        link_count: 10,
        word_count: 100,
        image_count: 5,
      },
    ];
    const result = validateOrThrow(visits, isPageVisitArray, 'Invalid visits array');
    expect(result).toBe(visits);
  });
});

