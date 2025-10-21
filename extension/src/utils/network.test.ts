import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchWithRetry } from './network';

describe('fetchWithRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should return response on successful fetch', async () => {
    const mockResponse = new Response('{"data": "success"}', {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

    global.fetch = vi.fn().mockResolvedValue(mockResponse);

    const result = await fetchWithRetry('https://api.example.com/test');

    expect(result).toBe(mockResponse);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith('https://api.example.com/test', undefined);
  });

  it('should pass options to fetch', async () => {
    const mockResponse = new Response('{"data": "success"}', { status: 200 });
    global.fetch = vi.fn().mockResolvedValue(mockResponse);

    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: 'data' }),
    };

    await fetchWithRetry('https://api.example.com/test', options);

    expect(global.fetch).toHaveBeenCalledWith('https://api.example.com/test', options);
  });

  it('should not retry on 4xx client errors', async () => {
    vi.useRealTimers();
    
    const mockResponse = {
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: async () => ({ message: 'Bad request' }),
    } as any;

    global.fetch = vi.fn().mockResolvedValue(mockResponse);

    await expect(fetchWithRetry('https://api.example.com/test')).rejects.toThrow(
      'Client error: 400 Bad Request - Bad request'
    );

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('should handle 4xx error with unparseable response', async () => {
    vi.useRealTimers();
    
    const mockResponse = {
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: async () => { throw new Error('Invalid JSON'); },
    } as any;

    global.fetch = vi.fn().mockResolvedValue(mockResponse);

    await expect(fetchWithRetry('https://api.example.com/test')).rejects.toThrow(
      'Client error: 404 Not Found - Failed to parse error response'
    );

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('should retry on 5xx server errors with exponential backoff', async () => {
    const mockResponse = {
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    } as any;

    global.fetch = vi.fn().mockResolvedValue(mockResponse);
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const promise = fetchWithRetry('https://api.example.com/test', undefined, 3);
    promise.catch(() => {});

    await vi.advanceTimersByTimeAsync(1000);
    await vi.advanceTimersByTimeAsync(2000);

    await expect(promise).rejects.toThrow('Server error: 500 Internal Server Error');

    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect(consoleLogSpy).toHaveBeenCalledWith('Attempt 1 failed. Retrying in 1000ms...');
    expect(consoleLogSpy).toHaveBeenCalledWith('Attempt 2 failed. Retrying in 2000ms...');

    consoleLogSpy.mockRestore();
  });

  it('should succeed on retry after initial failure', async () => {
    const failResponse = {
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    } as any;
    const successResponse = new Response('{"data": "success"}', { status: 200 });

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(failResponse)
      .mockResolvedValueOnce(successResponse);

    const promise = fetchWithRetry('https://api.example.com/test', undefined, 3);

    await vi.advanceTimersByTimeAsync(1000);

    const result = await promise;

    expect(result).toBe(successResponse);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('should retry on network errors', async () => {
    global.fetch = vi
      .fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(new Response('{"data": "success"}', { status: 200 }));

    const promise = fetchWithRetry('https://api.example.com/test', undefined, 3);

    await vi.advanceTimersByTimeAsync(1000);

    const result = await promise;

    expect(result.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('should throw after exhausting all retries', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const promise = fetchWithRetry('https://api.example.com/test', undefined, 2);
    promise.catch(() => {});

    await vi.advanceTimersByTimeAsync(1000);

    await expect(promise).rejects.toThrow('Network error');
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('should use exponential backoff correctly', async () => {
    const mockResponse = {
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
    } as any;
    global.fetch = vi.fn().mockResolvedValue(mockResponse);
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const promise = fetchWithRetry('https://api.example.com/test', undefined, 4);
    promise.catch(() => {});

    await vi.advanceTimersByTimeAsync(1000);
    expect(consoleLogSpy).toHaveBeenCalledWith('Attempt 1 failed. Retrying in 1000ms...');

    await vi.advanceTimersByTimeAsync(2000);
    expect(consoleLogSpy).toHaveBeenCalledWith('Attempt 2 failed. Retrying in 2000ms...');

    await vi.advanceTimersByTimeAsync(4000);
    expect(consoleLogSpy).toHaveBeenCalledWith('Attempt 3 failed. Retrying in 4000ms...');

    await expect(promise).rejects.toThrow();

    expect(global.fetch).toHaveBeenCalledTimes(4);
    consoleLogSpy.mockRestore();
  });

  it('should handle response.ok = true correctly', async () => {
    const mockResponse = new Response('{"data": "success"}', { status: 201 });
    global.fetch = vi.fn().mockResolvedValue(mockResponse);

    const result = await fetchWithRetry('https://api.example.com/test');

    expect(result.status).toBe(201);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('should use custom retry count', async () => {
    const mockResponse = {
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    } as any;
    global.fetch = vi.fn().mockResolvedValue(mockResponse);

    const promise = fetchWithRetry('https://api.example.com/test', undefined, 1);

    await expect(promise).rejects.toThrow();
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
