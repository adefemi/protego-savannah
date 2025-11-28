import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import * as api from '../utils/api';
import * as offlineCache from '../utils/offlineCache';
import { PageMetrics, PageVisit } from '../types';

vi.mock('../utils/api');
vi.mock('../utils/offlineCache');

describe('App', () => {
  const mockTab: chrome.tabs.Tab = {
    id: 1,
    url: 'https://example.com',
    active: true,
    windowId: 1,
    highlighted: false,
    incognito: false,
    pinned: false,
    selected: false,
    discarded: false,
    autoDiscardable: true,
    groupId: -1,
    index: 0,
  };

  const mockMetrics: PageMetrics = {
    link_count: 10,
    word_count: 500,
    image_count: 5,
    last_visited: '2025-10-21T10:00:00',
  };

  const mockVisits: PageVisit[] = [
    {
      id: 1,
      url: 'https://example.com',
      datetime_visited: '2025-10-21T10:00:00',
      link_count: 10,
      word_count: 500,
      image_count: 5,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    chrome.tabs.onUpdated.addListener = vi.fn();
    chrome.tabs.onUpdated.removeListener = vi.fn();
    chrome.tabs.onActivated.addListener = vi.fn();
    chrome.tabs.onActivated.removeListener = vi.fn();
    
    // Mock offline cache functions
    vi.mocked(offlineCache.getCachedMetrics).mockReturnValue(null);
    vi.mocked(offlineCache.getCachedVisits).mockReturnValue(null);
    vi.mocked(offlineCache.cacheMetrics).mockImplementation(() => {});
    vi.mocked(offlineCache.cacheVisits).mockImplementation(() => {});
    vi.mocked(offlineCache.clearCache).mockImplementation(() => {});
  });

  it('should render app with header and footer', async () => {
    vi.spyOn(api, 'getCurrentTab').mockResolvedValue(mockTab);
    vi.spyOn(api, 'getMetrics').mockResolvedValue(mockMetrics);
    vi.spyOn(api, 'getVisits').mockResolvedValue(mockVisits);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('📊 Page History')).toBeInTheDocument();
      expect(screen.getByText('Protego History Tracker v1.0')).toBeInTheDocument();
    });
  });

  it('should show loading state initially', () => {
    vi.spyOn(api, 'getCurrentTab').mockImplementation(() => new Promise(() => {}));
    vi.spyOn(api, 'getMetrics').mockImplementation(() => new Promise(() => {}));
    vi.spyOn(api, 'getVisits').mockImplementation(() => new Promise(() => {}));

    render(<App />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should load and display metrics and visits on mount', async () => {
    vi.spyOn(api, 'getCurrentTab').mockResolvedValue(mockTab);
    vi.spyOn(api, 'getMetrics').mockResolvedValue(mockMetrics);
    vi.spyOn(api, 'getVisits').mockResolvedValue(mockVisits);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Page Metrics')).toBeInTheDocument();
      expect(screen.getByText('Visit History')).toBeInTheDocument();
      expect(screen.getByText(/example\.com/)).toBeInTheDocument();
    });

    expect(api.getCurrentTab).toHaveBeenCalled();
    expect(api.getMetrics).toHaveBeenCalledWith('https://example.com');
    expect(api.getVisits).toHaveBeenCalledWith('https://example.com');
  });

  it('should handle error when tab URL is not available', async () => {
    const tabWithoutUrl = { ...mockTab, url: undefined };
    vi.spyOn(api, 'getCurrentTab').mockResolvedValue(tabWithoutUrl);
    vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Unable to get current tab URL.')).toBeInTheDocument();
    });
  });

  it('should handle Chrome internal pages', async () => {
    const chromeTab = { ...mockTab, url: 'chrome://extensions' };
    vi.spyOn(api, 'getCurrentTab').mockResolvedValue(chromeTab);
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Unsupported Page')).toBeInTheDocument();
      expect(
        screen.getByText(/Cannot track Chrome internal or extension pages/)
      ).toBeInTheDocument();
    });
  });

  it('should handle edge:// URLs', async () => {
    const edgeTab = { ...mockTab, url: 'edge://settings' };
    vi.spyOn(api, 'getCurrentTab').mockResolvedValue(edgeTab);
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Unsupported Page')).toBeInTheDocument();
    });
  });

  it('should handle chrome-extension:// URLs', async () => {
    const extensionTab = { ...mockTab, url: 'chrome-extension://abc123/page.html' };
    vi.spyOn(api, 'getCurrentTab').mockResolvedValue(extensionTab);
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Unsupported Page')).toBeInTheDocument();
    });
  });

  it('should handle about: URLs', async () => {
    const aboutTab = { ...mockTab, url: 'about:blank' };
    vi.spyOn(api, 'getCurrentTab').mockResolvedValue(aboutTab);
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Unsupported Page')).toBeInTheDocument();
    });
  });

  it('should handle network error when fetching data', async () => {
    vi.spyOn(api, 'getCurrentTab').mockResolvedValue(mockTab);
    vi.spyOn(api, 'getMetrics').mockRejectedValue(new Error('Network error'));
    vi.spyOn(api, 'getVisits').mockRejectedValue(new Error('Network error'));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Network Error')).toBeInTheDocument();
      expect(
        screen.getByText(/Network error.*Please check your connection/)
      ).toBeInTheDocument();
    });
  });

  it('should show retry button on retriable errors', async () => {
    vi.spyOn(api, 'getCurrentTab').mockResolvedValue(mockTab);
    vi.spyOn(api, 'getMetrics').mockRejectedValue(new Error('Server error'));
    vi.spyOn(api, 'getVisits').mockRejectedValue(new Error('Server error'));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });
  });

  it('should not show retry button on non-retriable errors', async () => {
    const tabWithoutUrl = { ...mockTab, url: undefined };
    vi.spyOn(api, 'getCurrentTab').mockResolvedValue(tabWithoutUrl);
    vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<App />);

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
    });
  });

  it('should refresh data when refresh button is clicked', async () => {
    const user = userEvent.setup();
    vi.spyOn(api, 'getCurrentTab').mockResolvedValue(mockTab);
    vi.spyOn(api, 'getMetrics').mockResolvedValue(mockMetrics);
    vi.spyOn(api, 'getVisits').mockResolvedValue(mockVisits);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Page Metrics')).toBeInTheDocument();
    });

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    await user.click(refreshButton);

    expect(api.getCurrentTab).toHaveBeenCalledTimes(2);
  });

  it('should retry when retry button is clicked after error', async () => {
    const user = userEvent.setup();
    vi.spyOn(api, 'getCurrentTab')
      .mockRejectedValueOnce(new Error('Failed'))
      .mockResolvedValueOnce(mockTab);
    vi.spyOn(api, 'getMetrics').mockResolvedValue(mockMetrics);
    vi.spyOn(api, 'getVisits').mockResolvedValue(mockVisits);
    vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    const retryButton = screen.getByRole('button', { name: /retry/i });
    await user.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText('Page Metrics')).toBeInTheDocument();
    });
  });

  it('should display empty visits message when no visits', async () => {
    vi.spyOn(api, 'getCurrentTab').mockResolvedValue(mockTab);
    vi.spyOn(api, 'getMetrics').mockResolvedValue(mockMetrics);
    vi.spyOn(api, 'getVisits').mockResolvedValue([]);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('No previous visits recorded')).toBeInTheDocument();
    });
  });

  it('should register tab update listener', async () => {
    vi.spyOn(api, 'getCurrentTab').mockResolvedValue(mockTab);
    vi.spyOn(api, 'getMetrics').mockResolvedValue(mockMetrics);
    vi.spyOn(api, 'getVisits').mockResolvedValue(mockVisits);

    render(<App />);

    await waitFor(() => {
      expect(chrome.tabs.onUpdated.addListener).toHaveBeenCalled();
    });
  });

  it('should register tab activated listener', async () => {
    vi.spyOn(api, 'getCurrentTab').mockResolvedValue(mockTab);
    vi.spyOn(api, 'getMetrics').mockResolvedValue(mockMetrics);
    vi.spyOn(api, 'getVisits').mockResolvedValue(mockVisits);

    render(<App />);

    await waitFor(() => {
      expect(chrome.tabs.onActivated.addListener).toHaveBeenCalled();
    });
  });

  it('should cleanup listeners on unmount', async () => {
    vi.spyOn(api, 'getCurrentTab').mockResolvedValue(mockTab);
    vi.spyOn(api, 'getMetrics').mockResolvedValue(mockMetrics);
    vi.spyOn(api, 'getVisits').mockResolvedValue(mockVisits);

    const { unmount } = render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Page Metrics')).toBeInTheDocument();
    });

    unmount();

    expect(chrome.tabs.onUpdated.removeListener).toHaveBeenCalled();
    expect(chrome.tabs.onActivated.removeListener).toHaveBeenCalled();
  });

  it('should fetch data in parallel for performance', async () => {
    vi.spyOn(api, 'getCurrentTab').mockResolvedValue(mockTab);
    const getMetricsSpy = vi.spyOn(api, 'getMetrics').mockResolvedValue(mockMetrics);
    const getVisitsSpy = vi.spyOn(api, 'getVisits').mockResolvedValue(mockVisits);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Page Metrics')).toBeInTheDocument();
    });

    expect(getMetricsSpy).toHaveBeenCalled();
    expect(getVisitsSpy).toHaveBeenCalled();
  });

  it('should handle unknown error type', async () => {
    vi.spyOn(api, 'getCurrentTab').mockResolvedValue(mockTab);
    vi.spyOn(api, 'getMetrics').mockRejectedValue('String error');
    vi.spyOn(api, 'getVisits').mockRejectedValue('String error');
    vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/An unknown error occurred/)).toBeInTheDocument();
    });
  });

  it('should clear error state when refresh succeeds after error', async () => {
    const user = userEvent.setup();
    vi.spyOn(api, 'getCurrentTab').mockResolvedValue(mockTab);
    vi.spyOn(api, 'getMetrics')
      .mockRejectedValueOnce(new Error('Error'))
      .mockResolvedValueOnce(mockMetrics);
    vi.spyOn(api, 'getVisits')
      .mockRejectedValueOnce(new Error('Error'))
      .mockResolvedValueOnce(mockVisits);
    vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Network Error')).toBeInTheDocument();
    });

    const retryButton = screen.getByRole('button', { name: /retry/i });
    await user.click(retryButton);

    await waitFor(() => {
      expect(screen.queryByText('Network Error')).not.toBeInTheDocument();
      expect(screen.getByText('Page Metrics')).toBeInTheDocument();
    });
  });
});

