import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { makeApiRequest, savePageVisit, getVisits, getMetrics } from './apiService';
import * as network from './network';
import { PageMetricsData } from '../types';

vi.mock('./network');
vi.mock('./config', () => ({
  API_BASE_URL: 'http://localhost:8000',
}));

describe('apiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('makeApiRequest', () => {
    it('should make successful API request', async () => {
      const mockData = { test: 'data' };
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockData),
      } as any;

      vi.spyOn(network, 'fetchWithRetry').mockResolvedValue(mockResponse);

      const result = await makeApiRequest('api/test');

      expect(network.fetchWithRetry).toHaveBeenCalledWith('http://localhost:8000/api/test', undefined);
      expect(result).toEqual(mockData);
    });

    it('should handle endpoint with leading slash', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ data: 'test' }),
      } as any;

      vi.spyOn(network, 'fetchWithRetry').mockResolvedValue(mockResponse);

      await makeApiRequest('/api/test');

      expect(network.fetchWithRetry).toHaveBeenCalledWith('http://localhost:8000/api/test', undefined);
    });

    it('should pass options to fetchWithRetry', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ data: 'test' }),
      } as any;

      vi.spyOn(network, 'fetchWithRetry').mockResolvedValue(mockResponse);

      const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{"test": "data"}',
      };

      await makeApiRequest('api/test', options);

      expect(network.fetchWithRetry).toHaveBeenCalledWith('http://localhost:8000/api/test', options);
    });

    it('should log and re-throw errors from fetch', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const testError = new Error('Network error');

      vi.spyOn(network, 'fetchWithRetry').mockRejectedValue(testError);

      await expect(makeApiRequest('api/test')).rejects.toThrow('Network error');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'API request failed for endpoint "api/test": Network error'
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle unknown errors', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      vi.spyOn(network, 'fetchWithRetry').mockRejectedValue('Unknown error');

      await expect(makeApiRequest('api/test')).rejects.toEqual('Unknown error');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'API request failed for endpoint "api/test": Unknown API error'
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle JSON parsing errors', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
      } as any;

      vi.spyOn(network, 'fetchWithRetry').mockResolvedValue(mockResponse);

      await expect(makeApiRequest('api/test')).rejects.toThrow('Invalid JSON');
    });
  });

  describe('savePageVisit', () => {
    it('should save page visit successfully', async () => {
      const visitData: PageMetricsData = {
        url: 'https://example.com',
        link_count: 10,
        word_count: 500,
        image_count: 5,
      };

      const mockResponse = {
        id: 1,
        ...visitData,
        datetime_visited: '2025-10-21T10:00:00',
      };

      const mockResponseObj = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      } as any;

      vi.spyOn(network, 'fetchWithRetry').mockResolvedValue(mockResponseObj);

      const result = await savePageVisit(visitData);

      expect(network.fetchWithRetry).toHaveBeenCalledWith('http://localhost:8000/api/visits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(visitData),
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle save errors', async () => {
      const visitData: PageMetricsData = {
        url: 'https://example.com',
        link_count: 10,
        word_count: 500,
        image_count: 5,
      };

      vi.spyOn(network, 'fetchWithRetry').mockRejectedValue(new Error('Server error'));
      vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(savePageVisit(visitData)).rejects.toThrow('Server error');
    });
  });

  describe('getVisits', () => {
    it('should fetch visits for a URL', async () => {
      const mockVisits = [
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

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockVisits),
      } as any;

      vi.spyOn(network, 'fetchWithRetry').mockResolvedValue(mockResponse);

      const result = await getVisits('https://example.com');

      expect(network.fetchWithRetry).toHaveBeenCalledWith(
        'http://localhost:8000/api/visits?url=https%3A%2F%2Fexample.com',
        undefined
      );
      expect(result).toEqual(mockVisits);
    });

    it('should properly encode URL parameter', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue([]),
      } as any;

      vi.spyOn(network, 'fetchWithRetry').mockResolvedValue(mockResponse);

      await getVisits('https://example.com/path?query=test&other=value');

      expect(network.fetchWithRetry).toHaveBeenCalledWith(
        'http://localhost:8000/api/visits?url=https%3A%2F%2Fexample.com%2Fpath%3Fquery%3Dtest%26other%3Dvalue',
        undefined
      );
    });

    it('should handle fetch errors', async () => {
      vi.spyOn(network, 'fetchWithRetry').mockRejectedValue(new Error('Network error'));
      vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(getVisits('https://example.com')).rejects.toThrow('Network error');
    });

    it('should return empty array when no visits found', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue([]),
      } as any;

      vi.spyOn(network, 'fetchWithRetry').mockResolvedValue(mockResponse);

      const result = await getVisits('https://example.com');

      expect(result).toEqual([]);
    });
  });

  describe('getMetrics', () => {
    it('should fetch metrics for a URL', async () => {
      const mockMetrics = {
        link_count: 10,
        word_count: 500,
        image_count: 5,
        last_visited: '2025-10-21T10:00:00',
      };

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockMetrics),
      } as any;

      vi.spyOn(network, 'fetchWithRetry').mockResolvedValue(mockResponse);

      const result = await getMetrics('https://example.com');

      expect(network.fetchWithRetry).toHaveBeenCalledWith(
        'http://localhost:8000/api/metrics/current?url=https%3A%2F%2Fexample.com',
        undefined
      );
      expect(result).toEqual(mockMetrics);
    });

    it('should properly encode URL parameter', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ link_count: 0, word_count: 0, image_count: 0, last_visited: null }),
      } as any;

      vi.spyOn(network, 'fetchWithRetry').mockResolvedValue(mockResponse);

      await getMetrics('https://example.com/special?param=value#hash');

      expect(network.fetchWithRetry).toHaveBeenCalledWith(
        'http://localhost:8000/api/metrics/current?url=https%3A%2F%2Fexample.com%2Fspecial%3Fparam%3Dvalue%23hash',
        undefined
      );
    });

    it('should handle fetch errors', async () => {
      vi.spyOn(network, 'fetchWithRetry').mockRejectedValue(new Error('Server error'));
      vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(getMetrics('https://example.com')).rejects.toThrow('Server error');
    });

    it('should handle metrics with null last_visited', async () => {
      const mockMetrics = {
        link_count: 0,
        word_count: 0,
        image_count: 0,
        last_visited: null,
      };

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockMetrics),
      } as any;

      vi.spyOn(network, 'fetchWithRetry').mockResolvedValue(mockResponse);

      const result = await getMetrics('https://newsite.com');

      expect(result).toEqual(mockMetrics);
      expect(result.last_visited).toBeNull();
    });
  });
});

