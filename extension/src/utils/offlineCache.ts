import { PageVisit, PageMetrics } from '../types';

const CACHE_KEY_PREFIX = 'protego_cache_';
const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

interface CachedData<T> {
  data: T;
  timestamp: number;
}

export const cacheVisits = (url: string, visits: PageVisit[]): void => {
  try {
    const cacheData: CachedData<PageVisit[]> = {
      data: visits,
      timestamp: Date.now(),
    };
    localStorage.setItem(`${CACHE_KEY_PREFIX}visits_${url}`, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Failed to cache visits:', error);
  }
};

export const getCachedVisits = (url: string): PageVisit[] | null => {
  try {
    const cached = localStorage.getItem(`${CACHE_KEY_PREFIX}visits_${url}`);
    if (!cached) return null;

    const cacheData: CachedData<PageVisit[]> = JSON.parse(cached);
    
    // Check if cache is expired
    if (Date.now() - cacheData.timestamp > CACHE_EXPIRY_MS) {
      localStorage.removeItem(`${CACHE_KEY_PREFIX}visits_${url}`);
      return null;
    }

    return cacheData.data;
  } catch (error) {
    console.error('Failed to get cached visits:', error);
    return null;
  }
};

export const cacheMetrics = (url: string, metrics: PageMetrics): void => {
  try {
    const cacheData: CachedData<PageMetrics> = {
      data: metrics,
      timestamp: Date.now(),
    };
    localStorage.setItem(`${CACHE_KEY_PREFIX}metrics_${url}`, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Failed to cache metrics:', error);
  }
};

export const getCachedMetrics = (url: string): PageMetrics | null => {
  try {
    const cached = localStorage.getItem(`${CACHE_KEY_PREFIX}metrics_${url}`);
    if (!cached) return null;

    const cacheData: CachedData<PageMetrics> = JSON.parse(cached);
    
    if (Date.now() - cacheData.timestamp > CACHE_EXPIRY_MS) {
      localStorage.removeItem(`${CACHE_KEY_PREFIX}metrics_${url}`);
      return null;
    }

    return cacheData.data;
  } catch (error) {
    console.error('Failed to get cached metrics:', error);
    return null;
  }
};

export const clearCache = (url?: string): void => {
  try {
    if (url) {
      localStorage.removeItem(`${CACHE_KEY_PREFIX}visits_${url}`);
      localStorage.removeItem(`${CACHE_KEY_PREFIX}metrics_${url}`);
    } else {
      // Clear all cache
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(CACHE_KEY_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    }
  } catch (error) {
    console.error('Failed to clear cache:', error);
  }
};

