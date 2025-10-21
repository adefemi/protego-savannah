const MAX_RETRIES = 3;
const INITIAL_BACKOFF = 1000; // 1 second

export const fetchWithRetry = async (url: string, options?: RequestInit, retries = MAX_RETRIES): Promise<Response> => {
  let attempt = 0;
  while (attempt < retries) {
    try {
      const response = await fetch(url, options);
      if (response.ok) {
        return response;
      }
      // Don't retry on client errors (4xx)
      if (response.status >= 400 && response.status < 500) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response' }));
        throw new Error(`Client error: ${response.status} ${response.statusText} - ${errorData.message || 'No additional error info'}`);
      }
      // Retry on server errors (5xx) or network issues
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    } catch (error) {
      attempt++;
      if (attempt >= retries) {
        throw error;
      }
      const backoffTime = INITIAL_BACKOFF * Math.pow(2, attempt - 1);
      console.log(`Attempt ${attempt} failed. Retrying in ${backoffTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, backoffTime));
    }
  }
  // This should not be reached, but typescript needs it.
  throw new Error('Exhausted all retries.');
};
