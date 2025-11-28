import { fetchWithRetry } from './network';
import { API_BASE_URL } from './config';
import { PageMetrics, PageMetricsData, PageVisit, PaginatedResponse } from '../types';
import { 
  isPageVisit, 
  isPageVisitArray, 
  isPageMetrics, 
  isPageMetricsData,
  validateOrThrow 
} from './validators';

export async function makeApiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    const url = `${API_BASE_URL}/${endpoint.startsWith('/') ? endpoint.substring(1) : endpoint}`;
    const response = await fetchWithRetry(url, options);
    return await response.json();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown API error';
    console.error(`API request failed for endpoint "${endpoint}": ${errorMessage}`);
    throw error;
  }
}

export async function savePageVisit(data: PageMetricsData): Promise<PageVisit> {
  validateOrThrow(data, isPageMetricsData, 'Invalid page metrics data');
  
  const result = await makeApiRequest<unknown>('api/visits', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  return validateOrThrow(result, isPageVisit, 'Invalid API response for savePageVisit');
}

export async function getVisits(url: string): Promise<PageVisit[]> {
  if (!url || typeof url !== 'string') {
    throw new Error('Invalid URL parameter');
  }
  
  const result = await makeApiRequest<unknown>(`api/visits?url=${encodeURIComponent(url)}`);
  return validateOrThrow(result, isPageVisitArray, 'Invalid API response for getVisits');
}

export async function getVisitsPaginated(
  url: string, 
  page: number = 1, 
  pageSize: number = 50
): Promise<PaginatedResponse<PageVisit>> {
  if (!url || typeof url !== 'string') {
    throw new Error('Invalid URL parameter');
  }
  
  const result = await makeApiRequest<PaginatedResponse<PageVisit>>(
    `api/visits/paginated?url=${encodeURIComponent(url)}&page=${page}&page_size=${pageSize}`
  );
  
  return result;
}

export async function deleteVisits(url: string): Promise<{ deleted: number; url: string }> {
  if (!url || typeof url !== 'string') {
    throw new Error('Invalid URL parameter');
  }
  
  const result = await makeApiRequest<{ deleted: number; url: string }>(
    `api/visits?url=${encodeURIComponent(url)}`,
    { method: 'DELETE' }
  );
  
  return result;
}

export async function getMetrics(url: string): Promise<PageMetrics> {
  if (!url || typeof url !== 'string') {
    throw new Error('Invalid URL parameter');
  }
  
  const result = await makeApiRequest<unknown>(`api/metrics/current?url=${encodeURIComponent(url)}`);
  return validateOrThrow(result, isPageMetrics, 'Invalid API response for getMetrics');
}

export async function exportVisitsAsJSON(visits: PageVisit[]): Promise<string> {
  return JSON.stringify(visits, null, 2);
}

export async function exportVisitsAsCSV(visits: PageVisit[]): Promise<string> {
  if (visits.length === 0) return '';
  
  const headers = ['ID', 'URL', 'Date Visited', 'Links', 'Words', 'Images'];
  const rows = visits.map(v => [
    v.id,
    v.url,
    new Date(v.datetime_visited).toLocaleString(),
    v.link_count,
    v.word_count,
    v.image_count
  ]);
  
  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  
  return csv;
}
