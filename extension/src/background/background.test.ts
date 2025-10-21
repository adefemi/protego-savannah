import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as apiService from '../utils/apiService';
import { PageMetricsData, PageVisit, PageMetrics } from '../types';

vi.mock('../utils/apiService');

describe('background script', () => {
  let messageListener: any;
  let actionListener: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();

    messageListener = null;
    actionListener = null;

    chrome.runtime.onMessage.addListener = vi.fn((listener) => {
      messageListener = listener;
    });

    chrome.action.onClicked.addListener = vi.fn((listener) => {
      actionListener = listener;
    });

    chrome.sidePanel.open = vi.fn();

    vi.spyOn(console, 'error').mockImplementation(() => {});

    await import('./background');
  });

  describe('PAGE_METRICS message', () => {
    it('should save page visit successfully', async () => {
      const mockData: PageMetricsData = {
        url: 'https://example.com',
        link_count: 10,
        word_count: 500,
        image_count: 5,
      };

      const mockResponse: PageVisit = {
        id: 1,
        ...mockData,
        datetime_visited: '2025-10-21T10:00:00',
      };

      vi.spyOn(apiService, 'savePageVisit').mockResolvedValue(mockResponse);

      const sendResponse = vi.fn();
      const result = messageListener(
        { type: 'PAGE_METRICS', data: mockData },
        {},
        sendResponse
      );

      expect(result).toBe(true);

      await vi.waitFor(() => {
        expect(apiService.savePageVisit).toHaveBeenCalledWith(mockData);
        expect(sendResponse).toHaveBeenCalledWith({
          success: true,
          data: mockResponse,
        });
      });
    });

    it('should handle save page visit error', async () => {
      const mockData: PageMetricsData = {
        url: 'https://example.com',
        link_count: 10,
        word_count: 500,
        image_count: 5,
      };

      const mockError = new Error('Network error');
      vi.spyOn(apiService, 'savePageVisit').mockRejectedValue(mockError);

      const sendResponse = vi.fn();
      const result = messageListener(
        { type: 'PAGE_METRICS', data: mockData },
        {},
        sendResponse
      );

      expect(result).toBe(true);

      await vi.waitFor(() => {
        expect(console.error).toHaveBeenCalledWith('Error saving page visit:', mockError);
        expect(sendResponse).toHaveBeenCalledWith({
          success: false,
          error: 'Network error',
        });
      });
    });

    it('should return false when data is missing', () => {
      const sendResponse = vi.fn();
      const result = messageListener({ type: 'PAGE_METRICS' }, {}, sendResponse);

      expect(result).toBe(false);
      expect(sendResponse).not.toHaveBeenCalled();
    });
  });

  describe('GET_VISITS message', () => {
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

      vi.spyOn(apiService, 'getVisits').mockResolvedValue(mockVisits);

      const sendResponse = vi.fn();
      const result = messageListener(
        { type: 'GET_VISITS', url: 'https://example.com' },
        {},
        sendResponse
      );

      expect(result).toBe(true);

      await vi.waitFor(() => {
        expect(apiService.getVisits).toHaveBeenCalledWith('https://example.com');
        expect(sendResponse).toHaveBeenCalledWith({
          success: true,
          data: mockVisits,
        });
      });
    });

    it('should handle fetch visits error', async () => {
      const mockError = new Error('Failed to fetch');
      vi.spyOn(apiService, 'getVisits').mockRejectedValue(mockError);

      const sendResponse = vi.fn();
      const result = messageListener(
        { type: 'GET_VISITS', url: 'https://example.com' },
        {},
        sendResponse
      );

      expect(result).toBe(true);

      await vi.waitFor(() => {
        expect(console.error).toHaveBeenCalledWith('❌ Error fetching visits:', mockError);
        expect(sendResponse).toHaveBeenCalledWith({
          success: false,
          error: 'Failed to fetch',
        });
      });
    });

    it('should return false when url is missing', () => {
      const sendResponse = vi.fn();
      const result = messageListener({ type: 'GET_VISITS' }, {}, sendResponse);

      expect(result).toBe(false);
      expect(sendResponse).not.toHaveBeenCalled();
    });

    it('should return empty array when no visits found', async () => {
      vi.spyOn(apiService, 'getVisits').mockResolvedValue([]);

      const sendResponse = vi.fn();
      const result = messageListener(
        { type: 'GET_VISITS', url: 'https://newsite.com' },
        {},
        sendResponse
      );

      expect(result).toBe(true);

      await vi.waitFor(() => {
        expect(sendResponse).toHaveBeenCalledWith({
          success: true,
          data: [],
        });
      });
    });
  });

  describe('GET_METRICS message', () => {
    it('should fetch metrics successfully', async () => {
      const mockMetrics: PageMetrics = {
        link_count: 10,
        word_count: 500,
        image_count: 5,
        last_visited: '2025-10-21T10:00:00',
      };

      vi.spyOn(apiService, 'getMetrics').mockResolvedValue(mockMetrics);

      const sendResponse = vi.fn();
      const result = messageListener(
        { type: 'GET_METRICS', url: 'https://example.com' },
        {},
        sendResponse
      );

      expect(result).toBe(true);

      await vi.waitFor(() => {
        expect(apiService.getMetrics).toHaveBeenCalledWith('https://example.com');
        expect(sendResponse).toHaveBeenCalledWith({
          success: true,
          data: mockMetrics,
        });
      });
    });

    it('should handle fetch metrics error', async () => {
      const mockError = new Error('Server error');
      vi.spyOn(apiService, 'getMetrics').mockRejectedValue(mockError);

      const sendResponse = vi.fn();
      const result = messageListener(
        { type: 'GET_METRICS', url: 'https://example.com' },
        {},
        sendResponse
      );

      expect(result).toBe(true);

      await vi.waitFor(() => {
        expect(console.error).toHaveBeenCalledWith('❌ Error fetching metrics:', mockError);
        expect(sendResponse).toHaveBeenCalledWith({
          success: false,
          error: 'Server error',
        });
      });
    });

    it('should return false when url is missing', () => {
      const sendResponse = vi.fn();
      const result = messageListener({ type: 'GET_METRICS' }, {}, sendResponse);

      expect(result).toBe(false);
      expect(sendResponse).not.toHaveBeenCalled();
    });

    it('should handle metrics with null last_visited', async () => {
      const mockMetrics: PageMetrics = {
        link_count: 0,
        word_count: 0,
        image_count: 0,
        last_visited: null,
      };

      vi.spyOn(apiService, 'getMetrics').mockResolvedValue(mockMetrics);

      const sendResponse = vi.fn();
      messageListener(
        { type: 'GET_METRICS', url: 'https://newsite.com' },
        {},
        sendResponse
      );

      await vi.waitFor(() => {
        expect(sendResponse).toHaveBeenCalledWith({
          success: true,
          data: mockMetrics,
        });
      });
    });
  });

  describe('Unknown message type', () => {
    it('should return false for unknown message types', () => {
      const sendResponse = vi.fn();
      const result = messageListener({ type: 'UNKNOWN_TYPE' as any }, {}, sendResponse);

      expect(result).toBe(false);
      expect(sendResponse).not.toHaveBeenCalled();
    });

    it('should return false for empty message', () => {
      const sendResponse = vi.fn();
      const result = messageListener({}, {}, sendResponse);

      expect(result).toBe(false);
      expect(sendResponse).not.toHaveBeenCalled();
    });
  });

  describe('Action click listener', () => {
    it('should open side panel when extension icon is clicked', () => {
      const mockTab = {
        id: 1,
        windowId: 123,
        url: 'https://example.com',
      } as chrome.tabs.Tab;

      expect(actionListener).toBeDefined();
      actionListener(mockTab);

      expect(chrome.sidePanel.open).toHaveBeenCalledWith({ windowId: 123 });
    });

    it('should not open side panel when tab has no windowId', () => {
      const mockTab = {
        id: 1,
        url: 'https://example.com',
      } as chrome.tabs.Tab;

      actionListener(mockTab);

      expect(chrome.sidePanel.open).not.toHaveBeenCalled();
    });

    it('should handle windowId of 0 correctly', () => {
      const mockTab = {
        id: 1,
        windowId: 0,
        url: 'https://example.com',
      } as chrome.tabs.Tab;

      actionListener(mockTab);

      expect(chrome.sidePanel.open).not.toHaveBeenCalled();
    });
  });
});

