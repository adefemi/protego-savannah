import { PageVisit, PageMetrics, ChromeMessage, ChromeResponse, PaginatedResponse } from '../types';

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

export const getMetrics = (url: string): Promise<PageMetrics> => {
  return sendChromeMessage<PageMetrics>({
    type: 'GET_METRICS',
    url,
  });
};

export const getVisits = (url: string): Promise<PageVisit[]> => {
  return sendChromeMessage<PageVisit[]>({
    type: 'GET_VISITS',
    url,
  });
};

export const getVisitsPaginated = (url: string, page: number = 1, pageSize: number = 50): Promise<PaginatedResponse<PageVisit>> => {
  return sendChromeMessage<PaginatedResponse<PageVisit>>({
    type: 'GET_VISITS_PAGINATED',
    url,
    page,
    page_size: pageSize,
  });
};

export const deleteVisits = (url: string): Promise<{ deleted: number; url: string }> => {
  return sendChromeMessage<{ deleted: number; url: string }>({
    type: 'DELETE_VISITS',
    url,
  });
};

export const getCurrentTab = async (): Promise<chrome.tabs.Tab> => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab;
  } catch (error) {
    console.error('❌ getCurrentTab: Error querying tabs:', error);
    throw error;
  }
};

