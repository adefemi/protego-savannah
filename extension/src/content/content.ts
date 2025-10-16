/**
 * Content Script
 * Runs on every webpage to collect page metrics (links, words, images)
 * and sends them to the background service worker
 */

import { PageMetricsData } from '../types';

/**
 * Collects metrics from the current page
 * @returns Object containing page URL and metrics
 */
const collectPageMetrics = (): PageMetricsData => {
  try {
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
      url: window.location.href,
      link_count: linkCount,
      word_count: wordCount,
      image_count: allImages.length,
    };

    return metrics;
  } catch (error) {
    console.error('❌ Error collecting metrics:', error);
    // Return default values if there's an error
    return {
      url: window.location.href,
      link_count: 0,
      word_count: 0,
      image_count: 0,
    };
  }
};

/**
 * Sends collected metrics to the background service worker
 */
const sendMetricsToBackground = (): void => {
  const metrics = collectPageMetrics();
  
  chrome.runtime.sendMessage(
    {
      type: 'PAGE_METRICS',
      data: metrics,
    },
    (_response) => {
      if (chrome.runtime.lastError) {
        console.error('Error sending metrics:', chrome.runtime.lastError);
      }
    }
  );
};

// Send metrics when DOM is fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', sendMetricsToBackground);
} else {
  // DOM is already loaded
  sendMetricsToBackground();
}

// Also send metrics after page fully loads (including images)
window.addEventListener('load', () => {
  // Delay to ensure dynamic content is loaded
  setTimeout(sendMetricsToBackground, 1000);
});

