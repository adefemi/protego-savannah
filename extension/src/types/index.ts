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

export interface PaginationMeta {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// Chrome Message Types
export type MessageType = 'PAGE_METRICS' | 'GET_VISITS' | 'GET_METRICS' | 'GET_VISITS_PAGINATED' | 'DELETE_VISITS';

export interface ChromeMessage {
  type: MessageType;
  data?: PageMetricsData;
  url?: string;
  page?: number;
  page_size?: number;
}

export interface ChromeResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

