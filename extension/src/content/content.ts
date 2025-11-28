/**
 * Content Script
 * Runs on every webpage to collect page metrics (links, words, images)
 * and sends them to the background service worker
 */

import { PageMetricsData } from '../types';
import { normalizeUrl, isChromeInternalUrl } from '../utils/urlNormalizer';
import { DEBOUNCE_DELAY } from '../utils/config';

let metricsTimeout: number | null = null;
let lastSentUrl: string | null = null;

/**
 * Collects metrics from the current page
 * @returns Object containing page URL and metrics
 */
const collectPageMetrics = (): PageMetricsData | null => {
  try {
    const currentUrl = window.location.href;
    
    // Skip Chrome internal pages
    if (isChromeInternalUrl(currentUrl)) {
      return null;
    }

    // Normalize URL to prevent duplicates
    const normalizedUrl = normalizeUrl(currentUrl);
    
    // Count all anchor tags on the page
    const linkCount = document.querySelectorAll('a').length;
    
    // Count only visible images on the page
    const allImages = document.querySelectorAll('img');
    
    // Extract visible text and count words
    const bodyText = document.body.innerText || document.body.textContent || '';
    const wordCount = bodyText
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0).length;

    const metrics = {
      url: normalizedUrl,
      link_count: linkCount,
      word_count: wordCount,
      image_count: allImages.length,
    };

    return metrics;
  } catch (error) {
    console.error('❌ Error collecting metrics:', error);
    return null;
  }
};

/**
 * Sends collected metrics to the background service worker
 * Implements debouncing to prevent duplicate sends
 */
const sendMetricsToBackground = (): void => {
  // Clear any pending timeout
  if (metricsTimeout !== null) {
    clearTimeout(metricsTimeout);
  }

  // Debounce the metrics collection
  metricsTimeout = window.setTimeout(() => {
    const metrics = collectPageMetrics();
    
    if (!metrics) {
      return;
    }

    // Skip if we've already sent metrics for this URL
    if (lastSentUrl === metrics.url) {
      return;
    }

    lastSentUrl = metrics.url;
    
    chrome.runtime.sendMessage(
      {
        type: 'PAGE_METRICS',
        data: metrics,
      },
      (_response) => {
        if (chrome.runtime.lastError) {
          console.error('Error sending metrics:', chrome.runtime.lastError);
          // Reset lastSentUrl on error so we can retry
          lastSentUrl = null;
        }
      }
    );
  }, DEBOUNCE_DELAY);
};

// Send metrics when DOM is fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', sendMetricsToBackground);
} else {
  // DOM is already loaded
  sendMetricsToBackground();
}

