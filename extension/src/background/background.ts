/**
 * Background Service Worker
 * Handles communication between content scripts, side panel, and the FastAPI backend
 */

import { ChromeMessage, ChromeResponse, PageMetricsData, PageVisit, PageMetrics } from '../types';

// Backend API base URL
const API_BASE_URL = 'http://localhost:8000';

/**
 * Listens for messages from content scripts and side panel
 */
chrome.runtime.onMessage.addListener((
  message: ChromeMessage,
  _sender: chrome.runtime.MessageSender,
  sendResponse: (response: ChromeResponse) => void
) => {
  // Handle page metrics from content script
  if (message.type === 'PAGE_METRICS' && message.data) {
    savePageVisit(message.data)
      .then(response => {
        sendResponse({ success: true, data: response });
      })
      .catch(error => {
        console.error('Error saving page visit:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep message channel open for async response
  }

  // Handle request for visit history
  if (message.type === 'GET_VISITS' && message.url) {
    getVisits(message.url)
      .then(response => {
        sendResponse({ success: true, data: response });
      })
      .catch(error => {
        console.error('❌ Error fetching visits:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  // Handle request for current metrics
  if (message.type === 'GET_METRICS' && message.url) {
    getMetrics(message.url)
      .then(response => {
        sendResponse({ success: true, data: response });
      })
      .catch(error => {
        console.error('❌ Error fetching metrics:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  return false;
});

/**
 * Saves a page visit to the backend API
 * @param data - Page metrics data to save
 * @returns Promise with the saved visit data
 */
async function savePageVisit(data: PageMetricsData): Promise<PageVisit> {
  const response = await fetch(`${API_BASE_URL}/api/visits`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}

/**
 * Fetches all visits for a given URL from the backend API
 * @param url - The URL to fetch visits for
 * @returns Promise with array of visits
 */
async function getVisits(url: string): Promise<PageVisit[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/visits?url=${encodeURIComponent(url)}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch visits:', error);
    throw error;
  }
}

/**
 * Fetches current metrics for a given URL from the backend API
 * @param url - The URL to fetch metrics for
 * @returns Promise with page metrics
 */
async function getMetrics(url: string): Promise<PageMetrics> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/metrics/current?url=${encodeURIComponent(url)}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch metrics:', error);
    throw error;
  }
}

/**
 * Opens the side panel when the extension icon is clicked
 */
chrome.action.onClicked.addListener((tab: chrome.tabs.Tab) => {
  if (tab.windowId) {
    chrome.sidePanel.open({ windowId: tab.windowId });
  }
});

