import { MAX_URL_LENGTH } from './config';

//Normalizes a URL to a consistent format
export const normalizeUrl = (url: string): string => {
  if (!url || !url.trim()) {
    throw new Error('URL cannot be empty');
  }

  url = url.trim();

  if (url.length > MAX_URL_LENGTH) {
    throw new Error(`URL too long: maximum ${MAX_URL_LENGTH} characters`);
  }

  try {
    const urlObj = new URL(url);

    // Normalize scheme and host to lowercase
    urlObj.protocol = urlObj.protocol.toLowerCase();
    urlObj.hostname = urlObj.hostname.toLowerCase();

    // Remove default ports
    if (
      (urlObj.protocol === 'http:' && urlObj.port === '80') ||
      (urlObj.protocol === 'https:' && urlObj.port === '443')
    ) {
      urlObj.port = '';
    }

    // Normalize pathname (remove trailing slash unless it's the root)
    if (urlObj.pathname && urlObj.pathname !== '/' && urlObj.pathname.endsWith('/')) {
      urlObj.pathname = urlObj.pathname.slice(0, -1);
    }
    if (!urlObj.pathname) {
      urlObj.pathname = '/';
    }

    // Sort query parameters alphabetically
    if (urlObj.search) {
      const params = new URLSearchParams(urlObj.search);
      const sortedParams = new URLSearchParams();
      
      // Sort parameters by key
      Array.from(params.keys())
        .sort()
        .forEach(key => {
          const values = params.getAll(key);
          values.forEach(value => sortedParams.append(key, value));
        });
      
      urlObj.search = sortedParams.toString();
    }

    // Remove fragment (hash)
    urlObj.hash = '';

    return urlObj.toString();
  } catch (error) {
    throw new Error(`Invalid URL format: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

//Validates that a URL is a standard web URL
export const isValidWebUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};

//Checks if a URL is a Chrome internal page

export const isChromeInternalUrl = (url: string): boolean => {
  return (
    url.startsWith('chrome://') ||
    url.startsWith('chrome-extension://') ||
    url.startsWith('edge://') ||
    url.startsWith('about:')
  );
};

