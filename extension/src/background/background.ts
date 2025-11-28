import { ChromeResponse } from '../types';
import { savePageVisit, getVisits, getMetrics, getVisitsPaginated, deleteVisits } from '../utils/apiService';
import { isChromeMessage } from '../utils/validators';

//Listens for messages from content scripts and side panel
chrome.runtime.onMessage.addListener((
  message: unknown,
  _sender: chrome.runtime.MessageSender,
  sendResponse: (response: ChromeResponse) => void
) => {
  // Validate message structure
  if (!isChromeMessage(message)) {
    console.error('Invalid message format:', message);
    sendResponse({ 
      success: false, 
      error: 'Invalid message format' 
    });
    return false;
  }

  // Handle page metrics from content script
  if (message.type === 'PAGE_METRICS' && message.data) {
    savePageVisit(message.data)
      .then(response => {
        sendResponse({ success: true, data: response });
      })
      .catch(error => {
        const errorMessage = error instanceof Error 
          ? error.message 
          : 'Failed to save page visit. Please check your connection.';
        console.error('Error saving page visit:', error);
        sendResponse({ success: false, error: errorMessage });
      });
    return true;
  }

  // Handle request for visit history
  if (message.type === 'GET_VISITS' && message.url) {
    getVisits(message.url)
      .then(response => {
        sendResponse({ success: true, data: response });
      })
      .catch(error => {
        const errorMessage = error instanceof Error 
          ? error.message 
          : 'Failed to fetch visit history. Please check your connection.';
        console.error('❌ Error fetching visits:', error);
        sendResponse({ success: false, error: errorMessage });
      });
    return true;
  }

  // Handle request for paginated visit history
  if (message.type === 'GET_VISITS_PAGINATED' && message.url) {
    getVisitsPaginated(message.url, message.page || 1, message.page_size || 50)
      .then(response => {
        sendResponse({ success: true, data: response });
      })
      .catch(error => {
        const errorMessage = error instanceof Error 
          ? error.message 
          : 'Failed to fetch visit history. Please check your connection.';
        console.error('❌ Error fetching paginated visits:', error);
        sendResponse({ success: false, error: errorMessage });
      });
    return true;
  }

  // Handle request to delete visits
  if (message.type === 'DELETE_VISITS' && message.url) {
    deleteVisits(message.url)
      .then(response => {
        sendResponse({ success: true, data: response });
      })
      .catch(error => {
        const errorMessage = error instanceof Error 
          ? error.message 
          : 'Failed to delete visits. Please check your connection.';
        console.error('❌ Error deleting visits:', error);
        sendResponse({ success: false, error: errorMessage });
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
        const errorMessage = error instanceof Error 
          ? error.message 
          : 'Failed to fetch metrics. Please check your connection.';
        console.error('❌ Error fetching metrics:', error);
        sendResponse({ success: false, error: errorMessage });
      });
    return true;
  }

  return false;
});

//Opens the side panel when the extension icon is clicked
chrome.action.onClicked.addListener((tab: chrome.tabs.Tab) => {
  if (tab.windowId) {
    chrome.sidePanel.open({ windowId: tab.windowId })
      .catch(error => {
        console.error('Failed to open side panel:', error);
      });
  }
});

