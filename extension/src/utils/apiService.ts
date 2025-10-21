import { fetchWithRetry } from './network';
import { API_BASE_URL } from './config';
import { PageMetrics, PageMetricsData, PageVisit } from '../types';

/**
 * A wrapper around fetchWithRetry to handle API requests to the backend.
 * It automatically prepends the base API URL and parses the JSON response.
 * @param endpoint - The API endpoint to call (e.g., 'api/visits').
 * @param options - RequestInit options for fetch.
 * @returns A promise that resolves with the JSON response data.
 */
export async function makeApiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    const url = `${API_BASE_URL}/${endpoint.startsWith('/') ? endpoint.substring(1) : endpoint}`;
    const response = await fetchWithRetry(url, options);
    return await response.json();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown API error';
    console.error(`API request failed for endpoint "${endpoint}": ${errorMessage}`);
    // Re-throw the original error to be handled by the caller.
    throw error;
  }
}

/**
 * Saves a page visit to the backend API.
 * @param data - Page metrics data to save.
 * @returns Promise with the saved visit data.
 */
export async function savePageVisit(data: PageMetricsData): Promise<PageVisit> {
  return makeApiRequest<PageVisit>('api/visits', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}

/**
 * Fetches all visits for a given URL from the backend API.
 * @param url - The URL to fetch visits for.
 * @returns Promise with an array of visits.
 */
export async function getVisits(url: string): Promise<PageVisit[]> {
  return makeApiRequest<PageVisit[]>(`api/visits?url=${encodeURIComponent(url)}`);
}

/**
 * Fetches current metrics for a given URL from the backend API.
 * @param url - The URL to fetch metrics for.
 * @returns Promise with page metrics.
 */
export async function getMetrics(url: string): Promise<PageMetrics> {
  return makeApiRequest<PageMetrics>(`api/metrics/current?url=${encodeURIComponent(url)}`);
}
