/**
 * Tests for URL normalization utilities
 */

import { describe, it, expect } from 'vitest';
import { normalizeUrl, isValidWebUrl, isChromeInternalUrl } from './urlNormalizer';

describe('normalizeUrl', () => {
  it('normalizes a basic URL', () => {
    const url = 'https://example.com/path';
    const result = normalizeUrl(url);
    expect(result).toBe('https://example.com/path');
  });

  it('removes trailing slashes', () => {
    const url = 'https://example.com/path/';
    const result = normalizeUrl(url);
    expect(result).toBe('https://example.com/path');
  });

  it('keeps root slash', () => {
    const url = 'https://example.com/';
    const result = normalizeUrl(url);
    expect(result).toBe('https://example.com/');
  });

  it('converts scheme to lowercase', () => {
    const url = 'HTTPS://example.com/path';
    const result = normalizeUrl(url);
    expect(result).toBe('https://example.com/path');
  });

  it('converts domain to lowercase', () => {
    const url = 'https://EXAMPLE.COM/path';
    const result = normalizeUrl(url);
    expect(result).toBe('https://example.com/path');
  });

  it('removes default HTTP port 80', () => {
    const url = 'http://example.com:80/path';
    const result = normalizeUrl(url);
    expect(result).toBe('http://example.com/path');
  });

  it('removes default HTTPS port 443', () => {
    const url = 'https://example.com:443/path';
    const result = normalizeUrl(url);
    expect(result).toBe('https://example.com/path');
  });

  it('keeps custom ports', () => {
    const url = 'https://example.com:8080/path';
    const result = normalizeUrl(url);
    expect(result).toBe('https://example.com:8080/path');
  });

  it('sorts query parameters alphabetically', () => {
    const url = 'https://example.com/path?z=1&a=2&m=3';
    const result = normalizeUrl(url);
    expect(result).toBe('https://example.com/path?a=2&m=3&z=1');
  });

  it('handles multiple values for same parameter', () => {
    const url = 'https://example.com/path?tag=python&tag=django';
    const result = normalizeUrl(url);
    expect(result).toContain('tag=python');
    expect(result).toContain('tag=django');
  });

  it('removes fragment identifiers', () => {
    const url = 'https://example.com/path#section';
    const result = normalizeUrl(url);
    expect(result).toBe('https://example.com/path');
    expect(result).not.toContain('#');
  });

  it('adds root slash if missing', () => {
    const url = 'https://example.com';
    const result = normalizeUrl(url);
    expect(result).toBe('https://example.com/');
  });

  it('throws error for empty URL', () => {
    expect(() => normalizeUrl('')).toThrow('URL cannot be empty');
  });

  it('throws error for whitespace-only URL', () => {
    expect(() => normalizeUrl('   ')).toThrow('URL cannot be empty');
  });

  it('throws error for invalid URL', () => {
    expect(() => normalizeUrl('not a url')).toThrow('Invalid URL format');
  });

  it('throws error for URL without scheme', () => {
    expect(() => normalizeUrl('example.com')).toThrow('Invalid URL format');
  });

  it('throws error for URL exceeding max length', () => {
    const longUrl = 'https://example.com/' + 'a'.repeat(2048);
    expect(() => normalizeUrl(longUrl)).toThrow('URL too long');
  });

  it('normalizes complex URLs correctly', () => {
    const url = 'HTTPS://EXAMPLE.COM:443/Path/?z=1&a=2#fragment';
    const result = normalizeUrl(url);
    expect(result).toBe('https://example.com/Path?a=2&z=1');
  });

  it('strips leading and trailing whitespace', () => {
    const url = '  https://example.com/path  ';
    const result = normalizeUrl(url);
    expect(result).toBe('https://example.com/path');
  });

  it('handles URLs with authentication', () => {
    const url = 'https://user:pass@example.com/path';
    const result = normalizeUrl(url);
    expect(result).toContain('user:pass@example.com');
  });

  it('handles URLs with unicode characters', () => {
    const url = 'https://example.com/path/ñoño';
    const result = normalizeUrl(url);
    expect(result).toBeTruthy();
  });

  it('handles URLs with encoded characters', () => {
    const url = 'https://example.com/path%20with%20spaces';
    const result = normalizeUrl(url);
    expect(result).toBeTruthy();
  });
});

describe('isValidWebUrl', () => {
  it('returns true for valid HTTP URL', () => {
    const url = 'http://example.com';
    expect(isValidWebUrl(url)).toBe(true);
  });

  it('returns true for valid HTTPS URL', () => {
    const url = 'https://example.com';
    expect(isValidWebUrl(url)).toBe(true);
  });

  it('returns false for FTP URL', () => {
    const url = 'ftp://example.com';
    expect(isValidWebUrl(url)).toBe(false);
  });

  it('returns false for file URL', () => {
    const url = 'file:///path/to/file';
    expect(isValidWebUrl(url)).toBe(false);
  });

  it('returns false for chrome:// URL', () => {
    const url = 'chrome://settings';
    expect(isValidWebUrl(url)).toBe(false);
  });

  it('returns false for invalid URL', () => {
    const url = 'not a url';
    expect(isValidWebUrl(url)).toBe(false);
  });

  it('returns false for empty string', () => {
    const url = '';
    expect(isValidWebUrl(url)).toBe(false);
  });

  it('returns true for URL with port', () => {
    const url = 'https://example.com:8080';
    expect(isValidWebUrl(url)).toBe(true);
  });

  it('returns true for URL with path', () => {
    const url = 'https://example.com/path/to/resource';
    expect(isValidWebUrl(url)).toBe(true);
  });

  it('returns true for URL with query parameters', () => {
    const url = 'https://example.com?foo=bar';
    expect(isValidWebUrl(url)).toBe(true);
  });
});

describe('isChromeInternalUrl', () => {
  it('returns true for chrome:// URL', () => {
    const url = 'chrome://settings';
    expect(isChromeInternalUrl(url)).toBe(true);
  });

  it('returns true for chrome-extension:// URL', () => {
    const url = 'chrome-extension://abc123/page.html';
    expect(isChromeInternalUrl(url)).toBe(true);
  });

  it('returns true for edge:// URL', () => {
    const url = 'edge://settings';
    expect(isChromeInternalUrl(url)).toBe(true);
  });

  it('returns true for about: URL', () => {
    const url = 'about:blank';
    expect(isChromeInternalUrl(url)).toBe(true);
  });

  it('returns false for HTTP URL', () => {
    const url = 'http://example.com';
    expect(isChromeInternalUrl(url)).toBe(false);
  });

  it('returns false for HTTPS URL', () => {
    const url = 'https://example.com';
    expect(isChromeInternalUrl(url)).toBe(false);
  });

  it('returns false for FTP URL', () => {
    const url = 'ftp://example.com';
    expect(isChromeInternalUrl(url)).toBe(false);
  });

  it('returns false for empty string', () => {
    const url = '';
    expect(isChromeInternalUrl(url)).toBe(false);
  });

  it('returns false for URL containing chrome but not starting with it', () => {
    const url = 'https://chrome.google.com';
    expect(isChromeInternalUrl(url)).toBe(false);
  });
});

