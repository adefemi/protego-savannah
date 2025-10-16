// API Response Types
export interface PageVisit {
  id: number;
  url: string;
  datetime_visited: string;
  link_count: number;
  word_count: number;
  image_count: number;
}

export interface PageMetrics {
  link_count: number;
  word_count: number;
  image_count: number;
  last_visited: string | null;
}

export interface PageMetricsData {
  url: string;
  link_count: number;
  word_count: number;
  image_count: number;
}

// Chrome Message Types
export type MessageType = 'PAGE_METRICS' | 'GET_VISITS' | 'GET_METRICS';

export interface ChromeMessage {
  type: MessageType;
  data?: PageMetricsData;
  url?: string;
}

export interface ChromeResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

