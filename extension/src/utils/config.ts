/**
 * Configuration settings for the extension
 * Uses environment variables with fallbacks
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const MAX_URL_LENGTH = 2048;
export const MAX_RETRIES = 3;
export const RETRY_DELAY = 1000;
export const DEBOUNCE_DELAY = 2000;
