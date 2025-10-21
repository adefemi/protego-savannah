/**
 * Background Service Worker
 * Handles communication between content scripts, side panel, and the FastAPI backend
 */

import { ChromeMessage, ChromeResponse } from '../types';
import { savePageVisit, getVisits, getMetrics } from '../utils/apiService';

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
 * Opens the side panel when the extension icon is clicked
 */
chrome.action.onClicked.addListener((tab: chrome.tabs.Tab) => {
  if (tab.windowId) {
    chrome.sidePanel.open({ windowId: tab.windowId });
  }
});

