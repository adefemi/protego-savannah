/**
 * Main App Component
 * Orchestrates all child components and manages application state
 */

import React, { useEffect, useState } from 'react';
import {
  CurrentPage,
  ErrorBoundary,
  ErrorMessage,
  Footer,
  Header,
  Loading,
  MetricsGrid,
  VisitHistory,
} from '../components';
import { PageMetrics, PageVisit } from '../types';
import { deleteVisits, getCurrentTab, getMetrics, getVisits } from '../utils/api';
import { cacheMetrics, cacheVisits, getCachedMetrics, getCachedVisits } from '../utils/offlineCache';
import './App.scss';

interface ErrorState {
  title: string;
  message: string;
  isRetriable: boolean;
}

const App: React.FC = () => {
  // State management
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [metrics, setMetrics] = useState<PageMetrics | null>(null);
  const [visits, setVisits] = useState<PageVisit[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<ErrorState | null>(null);

  /**
   * Sets the error state
   */
  const handleError = (
    title: string,
    message: string,
    isRetriable: boolean
  ) => {
    setError({ title, message, isRetriable });
    setLoading(false);
  };

  /**
   * Loads the current tab and fetches its data
   */
  const loadCurrentTab = async (): Promise<void> => {
    try {
      const tab = await getCurrentTab();

      if (!tab?.url) {
        console.error('❌ No tab URL found');
        handleError('Error', 'Unable to get current tab URL.', false);
        return;
      }

      // Check if URL is a Chrome internal page
      if (tab.url.startsWith('chrome://') || 
          tab.url.startsWith('chrome-extension://') ||
          tab.url.startsWith('edge://') ||
          tab.url.startsWith('about:')) {
        console.warn('⚠️ Chrome internal page detected');
        setCurrentUrl(tab.url);
        handleError(
          'Unsupported Page',
          'Cannot track Chrome internal or extension pages. Please navigate to a regular website.',
          false
        );
        return;
      }
      
      setCurrentUrl(tab.url);
      await loadData(tab.url);
    } catch (err) {
      console.error('❌ Error in loadCurrentTab:', err);
      handleError('Error', 'Failed to get current tab information.', true);
    }
  };

  /**
   * Fetches metrics and visit history for a given URL
   * @param url - The URL to fetch data for
   */
  const loadData = async (url: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      // Try to get from cache first
      const cachedMetrics = getCachedMetrics(url);
      const cachedVisits = getCachedVisits(url);

      if (cachedMetrics && cachedVisits) {
        setMetrics(cachedMetrics);
        setVisits(cachedVisits);
        setLoading(false);
        
        // Fetch fresh data in background
        Promise.all([getMetrics(url), getVisits(url)])
          .then(([metricsResponse, visitsResponse]) => {
            setMetrics(metricsResponse);
            setVisits(visitsResponse);
            cacheMetrics(url, metricsResponse);
            cacheVisits(url, visitsResponse);
          })
          .catch(() => {});
        return;
      }

      const [metricsResponse, visitsResponse] = await Promise.all([
        getMetrics(url),
        getVisits(url),
      ]);

      setMetrics(metricsResponse);
      setVisits(visitsResponse);
      
      // Cache the results
      cacheMetrics(url, metricsResponse);
      cacheVisits(url, visitsResponse);
    } catch (err) {
      console.error('❌ Error in loadData:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'An unknown error occurred';
      handleError(
        'Network Error',
        `${errorMessage}. Please check your connection and ensure the backend is running.`,
        true
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!currentUrl) return;
    
    if (!confirm(`Delete all visit history for this page?\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      await deleteVisits(currentUrl);
      setVisits([]);
      setMetrics(null);
    } catch (err) {
      console.error('❌ Error deleting visits:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete history';
      handleError('Delete Error', errorMessage, true);
    }
  };

  /**
   * Refreshes data for the current page
   */
  const handleRefresh = (): void => {
    loadCurrentTab();
  };

  // Load data on component mount
  useEffect(() => {
    loadCurrentTab();

    // Listen for tab updates (URL changes, page navigation, etc.)
    const handleTabUpdate = (
      _tabId: number,
      changeInfo: chrome.tabs.TabChangeInfo,
      tab: chrome.tabs.Tab
    ) => {
      // Only reload if the URL changed and it's the active tab
      if (changeInfo.url && tab.active) {
        loadCurrentTab();
      }
    };

    // Listen for when a different tab becomes active
    const handleTabActivated = (_activeInfo: chrome.tabs.TabActiveInfo) => {
      loadCurrentTab();
    };

    chrome.tabs.onUpdated.addListener(handleTabUpdate);
    chrome.tabs.onActivated.addListener(handleTabActivated);

    // Cleanup listeners on unmount
    return () => {
      chrome.tabs.onUpdated.removeListener(handleTabUpdate);
      chrome.tabs.onActivated.removeListener(handleTabActivated);
    };
  }, []);

  return (
    <ErrorBoundary>
      <div className="app">
        <Header onRefresh={handleRefresh} />

        {/* Loading state */}
        {loading && <Loading />}

        {/* Error state */}
        {error && !loading && (
          <ErrorMessage
            title={error.title}
            message={error.message}
            onRetry={error.isRetriable ? handleRefresh : undefined}
          />
        )}

        {/* Main content - only show when not loading and no errors */}
        {!loading && !error && (
        <>
          <CurrentPage url={currentUrl} />
          <MetricsGrid metrics={metrics} />
          <VisitHistory visits={visits} onDelete={handleDelete} />
        </>
        )}

        <Footer />
      </div>
    </ErrorBoundary>
  );
};

export default App;

