
import { PageVisit, PageMetrics, PageMetricsData, ChromeMessage } from '../types';
//Validates a PageVisit object
export const isPageVisit = (data: unknown): data is PageVisit => {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const visit = data as Partial<PageVisit>;
  
  return (
    typeof visit.id === 'number' &&
    typeof visit.url === 'string' &&
    typeof visit.datetime_visited === 'string' &&
    typeof visit.link_count === 'number' &&
    typeof visit.word_count === 'number' &&
    typeof visit.image_count === 'number'
  );
};

//Validates an array of PageVisit objects
export const isPageVisitArray = (data: unknown): data is PageVisit[] => {
  if (!Array.isArray(data)) {
    return false;
  }
  
  return data.every(isPageVisit);
};

//Validates a PageMetrics object
export const isPageMetrics = (data: unknown): data is PageMetrics => {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const metrics = data as Partial<PageMetrics>;
  
  return (
    typeof metrics.link_count === 'number' &&
    typeof metrics.word_count === 'number' &&
    typeof metrics.image_count === 'number' &&
    (metrics.last_visited === null || typeof metrics.last_visited === 'string')
  );
};

/**
 * Validates PageMetricsData (from content script)
 * @param data - Data to validate
 * @returns true if valid PageMetricsData
 */
export const isPageMetricsData = (data: unknown): data is PageMetricsData => {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const metrics = data as Partial<PageMetricsData>;
  
  return (
    typeof metrics.url === 'string' &&
    metrics.url.length > 0 &&
    typeof metrics.link_count === 'number' &&
    metrics.link_count >= 0 &&
    typeof metrics.word_count === 'number' &&
    metrics.word_count >= 0 &&
    typeof metrics.image_count === 'number' &&
    metrics.image_count >= 0
  );
};

/**
 * Validates a Chrome message
 * @param message - Message to validate
 * @returns true if valid ChromeMessage
 */
export const isChromeMessage = (message: unknown): message is ChromeMessage => {
  if (!message || typeof message !== 'object') {
    return false;
  }

  const msg = message as Partial<ChromeMessage>;
  
  if (!msg.type || typeof msg.type !== 'string') {
    return false;
  }

  const validTypes = ['PAGE_METRICS', 'GET_VISITS', 'GET_METRICS'];
  if (!validTypes.includes(msg.type)) {
    return false;
  }

  // Validate based on message type
  if (msg.type === 'PAGE_METRICS') {
    return msg.data !== undefined && isPageMetricsData(msg.data);
  }

  if (msg.type === 'GET_VISITS' || msg.type === 'GET_METRICS') {
    return typeof msg.url === 'string' && msg.url.length > 0;
  }

  return false;
};

/**
 * Safely validates and returns data, throwing an error if invalid
 * @param data - Data to validate
 * @param validator - Validation function
 * @param errorMessage - Error message if validation fails
 * @returns Validated data
 * @throws Error if validation fails
 */
export const validateOrThrow = <T>(
  data: unknown,
  validator: (data: unknown) => data is T,
  errorMessage: string
): T => {
  if (!validator(data)) {
    throw new Error(errorMessage);
  }
  return data;
};

