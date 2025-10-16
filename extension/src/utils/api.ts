/**
 * API utility functions for communicating with Chrome runtime
 */

import { PageVisit, PageMetrics, ChromeMessage, ChromeResponse } from '../types';

/**
 * Sends a message to the Chrome runtime and returns the response
 * @param message - The message to send
 * @returns Promise with the response data
 */
const sendChromeMessage = <T>(message: ChromeMessage): Promise<T> => {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response: ChromeResponse<T>) => {
      if (chrome.runtime.lastError) {
        console.error('Chrome runtime error:', chrome.runtime.lastError);
        reject(chrome.runtime.lastError);
      } else if (!response) {
        console.error('No response received from background script');
        reject(new Error('No response from background script'));
      } else if (response.success) {
        resolve(response.data as T);
      } else {
        console.error('API error:', response.error);
        reject(new Error(response.error || 'Unknown error'));
      }
    });
  });
};

/**
 * Fetches metrics for a given URL
 * @param url - The URL to fetch metrics for
 * @returns Promise with page metrics
 */
export const getMetrics = (url: string): Promise<PageMetrics> => {
  return sendChromeMessage<PageMetrics>({
    type: 'GET_METRICS',
    url,
  });
};

/**
 * Fetches visit history for a given URL
 * @param url - The URL to fetch visits for
 * @returns Promise with array of page visits
 */
export const getVisits = (url: string): Promise<PageVisit[]> => {
  return sendChromeMessage<PageVisit[]>({
    type: 'GET_VISITS',
    url,
  });
};

/**
 * Gets the currently active tab
 * @returns Promise with the active tab
 */
export const getCurrentTab = async (): Promise<chrome.tabs.Tab> => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab;
  } catch (error) {
    console.error('❌ getCurrentTab: Error querying tabs:', error);
    throw error;
  }
};

