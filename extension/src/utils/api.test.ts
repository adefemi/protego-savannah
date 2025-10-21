import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getMetrics, getVisits, getCurrentTab } from './api';
import { PageMetrics, PageVisit } from '../types';

describe('api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getMetrics', () => {
    it('should fetch metrics successfully', async () => {
      const mockMetrics: PageMetrics = {
        link_count: 10,
        word_count: 500,
        image_count: 5,
        last_visited: '2025-10-21T10:00:00',
      };

      const sendMessageMock = vi.fn((message, callback) => {
        callback({ success: true, data: mockMetrics });
      });

      chrome.runtime.sendMessage = sendMessageMock as any;
      chrome.runtime.lastError = undefined;

      const result = await getMetrics('https://example.com');

      expect(sendMessageMock).toHaveBeenCalledWith(
        {
          type: 'GET_METRICS',
          url: 'https://example.com',
        },
        expect.any(Function)
      );
      expect(result).toEqual(mockMetrics);
    });

    it('should reject on chrome runtime error', async () => {
      const mockError = { message: 'Chrome runtime error' };

      const sendMessageMock = vi.fn((message, callback) => {
        chrome.runtime.lastError = mockError;
        callback(null);
      });

      chrome.runtime.sendMessage = sendMessageMock as any;
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(getMetrics('https://example.com')).rejects.toEqual(mockError);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Chrome runtime error:', mockError);

      consoleErrorSpy.mockRestore();
      chrome.runtime.lastError = undefined;
    });

    it('should reject when no response received', async () => {
      const sendMessageMock = vi.fn((message, callback) => {
        callback(null);
      });

      chrome.runtime.sendMessage = sendMessageMock as any;
      chrome.runtime.lastError = undefined;
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(getMetrics('https://example.com')).rejects.toThrow(
        'No response from background script'
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith('No response received from background script');

      consoleErrorSpy.mockRestore();
    });

    it('should reject when response indicates failure', async () => {
      const sendMessageMock = vi.fn((message, callback) => {
        callback({ success: false, error: 'API error occurred' });
      });

      chrome.runtime.sendMessage = sendMessageMock as any;
      chrome.runtime.lastError = undefined;
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(getMetrics('https://example.com')).rejects.toThrow('API error occurred');

      expect(consoleErrorSpy).toHaveBeenCalledWith('API error:', 'API error occurred');

      consoleErrorSpy.mockRestore();
    });

    it('should handle response with no error message', async () => {
      const sendMessageMock = vi.fn((message, callback) => {
        callback({ success: false });
      });

      chrome.runtime.sendMessage = sendMessageMock as any;
      chrome.runtime.lastError = undefined;
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(getMetrics('https://example.com')).rejects.toThrow('Unknown error');

      consoleErrorSpy.mockRestore();
    });
  });

  describe('getVisits', () => {
    it('should fetch visits successfully', async () => {
      const mockVisits: PageVisit[] = [
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

      const sendMessageMock = vi.fn((message, callback) => {
        callback({ success: true, data: mockVisits });
      });

      chrome.runtime.sendMessage = sendMessageMock as any;
      chrome.runtime.lastError = undefined;

      const result = await getVisits('https://example.com');

      expect(sendMessageMock).toHaveBeenCalledWith(
        {
          type: 'GET_VISITS',
          url: 'https://example.com',
        },
        expect.any(Function)
      );
      expect(result).toEqual(mockVisits);
    });

    it('should return empty array when no visits', async () => {
      const sendMessageMock = vi.fn((message, callback) => {
        callback({ success: true, data: [] });
      });

      chrome.runtime.sendMessage = sendMessageMock as any;
      chrome.runtime.lastError = undefined;

      const result = await getVisits('https://example.com');

      expect(result).toEqual([]);
    });

    it('should reject on chrome runtime error', async () => {
      const mockError = { message: 'Chrome runtime error' };

      const sendMessageMock = vi.fn((message, callback) => {
        chrome.runtime.lastError = mockError;
        callback(null);
      });

      chrome.runtime.sendMessage = sendMessageMock as any;
      vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(getVisits('https://example.com')).rejects.toEqual(mockError);

      chrome.runtime.lastError = undefined;
    });

    it('should reject when response indicates failure', async () => {
      const sendMessageMock = vi.fn((message, callback) => {
        callback({ success: false, error: 'Failed to fetch visits' });
      });

      chrome.runtime.sendMessage = sendMessageMock as any;
      chrome.runtime.lastError = undefined;
      vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(getVisits('https://example.com')).rejects.toThrow('Failed to fetch visits');
    });
  });

  describe('getCurrentTab', () => {
    it('should get current active tab', async () => {
      const mockTab = {
        id: 1,
        url: 'https://example.com',
        active: true,
        windowId: 1,
      } as chrome.tabs.Tab;

      const queryMock = vi.fn().mockResolvedValue([mockTab]);
      chrome.tabs.query = queryMock;

      const result = await getCurrentTab();

      expect(queryMock).toHaveBeenCalledWith({ active: true, currentWindow: true });
      expect(result).toEqual(mockTab);
    });

    it('should return undefined when no active tab', async () => {
      const queryMock = vi.fn().mockResolvedValue([]);
      chrome.tabs.query = queryMock;

      const result = await getCurrentTab();

      expect(result).toBeUndefined();
    });

    it('should handle tab query errors', async () => {
      const mockError = new Error('Tab query failed');
      const queryMock = vi.fn().mockRejectedValue(mockError);
      chrome.tabs.query = queryMock;

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(getCurrentTab()).rejects.toThrow('Tab query failed');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '❌ getCurrentTab: Error querying tabs:',
        mockError
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle multiple tabs returned (edge case)', async () => {
      const mockTabs = [
        { id: 1, url: 'https://example.com', active: true },
        { id: 2, url: 'https://other.com', active: false },
      ] as chrome.tabs.Tab[];

      const queryMock = vi.fn().mockResolvedValue(mockTabs);
      chrome.tabs.query = queryMock;

      const result = await getCurrentTab();

      expect(result).toEqual(mockTabs[0]);
    });

    it('should handle tab without URL', async () => {
      const mockTab = {
        id: 1,
        active: true,
        windowId: 1,
      } as chrome.tabs.Tab;

      const queryMock = vi.fn().mockResolvedValue([mockTab]);
      chrome.tabs.query = queryMock;

      const result = await getCurrentTab();

      expect(result).toEqual(mockTab);
      expect(result.url).toBeUndefined();
    });
  });
});

