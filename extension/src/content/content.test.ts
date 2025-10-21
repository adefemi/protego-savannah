import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('content script', () => {
  let sendMessageMock: any;
  let consoleErrorSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    document.body.innerHTML = '';
    
    sendMessageMock = vi.fn((message, callback) => {
      callback({ success: true });
    });
    chrome.runtime.sendMessage = sendMessageMock;
    chrome.runtime.lastError = undefined;

    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    delete (window as any).location;
    (window as any).location = { href: 'https://example.com' };
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    vi.resetModules();
  });

  const createTestDocument = (links: number, images: number, words: string) => {
    const container = document.createElement('div');
    
    for (let i = 0; i < links; i++) {
      const link = document.createElement('a');
      link.href = `https://example.com/link${i}`;
      container.appendChild(link);
    }
    
    for (let i = 0; i < images; i++) {
      const img = document.createElement('img');
      img.src = `image${i}.jpg`;
      container.appendChild(img);
    }
    
    const textNode = document.createTextNode(words);
    container.appendChild(textNode);
    
    document.body.appendChild(container);
  };

  it('should collect and send page metrics with correct counts', async () => {
    createTestDocument(5, 3, 'This is a test page with some words');

    Object.defineProperty(document, 'readyState', {
      value: 'complete',
      writable: true,
    });

    await import('./content');

    await vi.waitFor(() => {
      expect(sendMessageMock).toHaveBeenCalled();
    });

    expect(sendMessageMock).toHaveBeenCalledWith(
      {
        type: 'PAGE_METRICS',
        data: {
          url: 'https://example.com',
          link_count: 5,
          word_count: 8,
          image_count: 3,
        },
      },
      expect.any(Function)
    );
  });

  it('should count links correctly', async () => {
    createTestDocument(10, 0, 'Test');

    Object.defineProperty(document, 'readyState', {
      value: 'complete',
      writable: true,
    });

    await import('./content');

    await vi.waitFor(() => {
      expect(sendMessageMock).toHaveBeenCalled();
    });

    const callArgs = sendMessageMock.mock.calls[0][0];
    expect(callArgs.data.link_count).toBe(10);
  });

  it('should count images correctly', async () => {
    createTestDocument(0, 7, 'Test');

    Object.defineProperty(document, 'readyState', {
      value: 'complete',
      writable: true,
    });

    await import('./content');

    await vi.waitFor(() => {
      expect(sendMessageMock).toHaveBeenCalled();
    });

    const callArgs = sendMessageMock.mock.calls[0][0];
    expect(callArgs.data.image_count).toBe(7);
  });

  it('should count words correctly with multiple spaces', async () => {
    createTestDocument(0, 0, 'Word1   Word2    Word3     Word4');

    Object.defineProperty(document, 'readyState', {
      value: 'complete',
      writable: true,
    });

    await import('./content');

    await vi.waitFor(() => {
      expect(sendMessageMock).toHaveBeenCalled();
    });

    const callArgs = sendMessageMock.mock.calls[0][0];
    expect(callArgs.data.word_count).toBe(4);
  });

  it('should handle empty page', async () => {
    Object.defineProperty(document, 'readyState', {
      value: 'complete',
      writable: true,
    });

    await import('./content');

    await vi.waitFor(() => {
      expect(sendMessageMock).toHaveBeenCalled();
    });

    expect(sendMessageMock).toHaveBeenCalledWith(
      {
        type: 'PAGE_METRICS',
        data: {
          url: 'https://example.com',
          link_count: 0,
          word_count: 0,
          image_count: 0,
        },
      },
      expect.any(Function)
    );
  });

  it('should filter empty words', async () => {
    createTestDocument(0, 0, '   \n\t   word1   \n   word2   \t\t   ');

    Object.defineProperty(document, 'readyState', {
      value: 'complete',
      writable: true,
    });

    await import('./content');

    await vi.waitFor(() => {
      expect(sendMessageMock).toHaveBeenCalled();
    });

    const callArgs = sendMessageMock.mock.calls[0][0];
    expect(callArgs.data.word_count).toBe(2);
  });

  it('should use current URL from window.location', async () => {
    (window as any).location.href = 'https://different-site.com/path?query=test';
    createTestDocument(1, 1, 'Test');

    Object.defineProperty(document, 'readyState', {
      value: 'complete',
      writable: true,
    });

    await import('./content');

    await vi.waitFor(() => {
      expect(sendMessageMock).toHaveBeenCalled();
    });

    const callArgs = sendMessageMock.mock.calls[0][0];
    expect(callArgs.data.url).toBe('https://different-site.com/path?query=test');
  });

  it('should handle chrome runtime errors when sending message', async () => {
    const mockError = { message: 'Extension context invalidated' };
    
    sendMessageMock = vi.fn((message, callback) => {
      chrome.runtime.lastError = mockError;
      callback(null);
    });
    chrome.runtime.sendMessage = sendMessageMock;

    createTestDocument(1, 1, 'Test');

    Object.defineProperty(document, 'readyState', {
      value: 'complete',
      writable: true,
    });

    await import('./content');

    await vi.waitFor(() => {
      expect(sendMessageMock).toHaveBeenCalled();
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error sending metrics:', mockError);
  });

  it('should handle errors in metric collection gracefully', async () => {
    Object.defineProperty(document.body, 'innerText', {
      get: () => {
        throw new Error('Cannot access innerText');
      },
      configurable: true,
    });

    Object.defineProperty(document, 'readyState', {
      value: 'complete',
      writable: true,
    });

    await import('./content');

    await vi.waitFor(() => {
      expect(sendMessageMock).toHaveBeenCalled();
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '❌ Error collecting metrics:',
      expect.any(Error)
    );

    const callArgs = sendMessageMock.mock.calls[0][0];
    expect(callArgs.data).toEqual({
      url: 'https://example.com',
      link_count: 0,
      word_count: 0,
      image_count: 0,
    });
  });

  it('should use textContent when innerText is not available', async () => {
    createTestDocument(0, 0, '');
    
    Object.defineProperty(document.body, 'innerText', {
      value: '',
      writable: true,
      configurable: true,
    });
    
    Object.defineProperty(document.body, 'textContent', {
      value: 'text from textContent only',
      writable: true,
      configurable: true,
    });

    Object.defineProperty(document, 'readyState', {
      value: 'complete',
      writable: true,
    });

    await import('./content');

    await vi.waitFor(() => {
      expect(sendMessageMock).toHaveBeenCalled();
    });

    const callArgs = sendMessageMock.mock.calls[0][0];
    expect(callArgs.data.word_count).toBe(4);
  });

  it('should handle page with nested elements', async () => {
    const container = document.createElement('div');
    
    const nav = document.createElement('nav');
    for (let i = 0; i < 3; i++) {
      const link = document.createElement('a');
      link.href = `https://example.com/nav${i}`;
      nav.appendChild(link);
    }
    container.appendChild(nav);
    
    const article = document.createElement('article');
    article.textContent = 'This is article content with multiple words';
    for (let i = 0; i < 2; i++) {
      const img = document.createElement('img');
      img.src = `article${i}.jpg`;
      article.appendChild(img);
    }
    container.appendChild(article);
    
    document.body.appendChild(container);

    Object.defineProperty(document, 'readyState', {
      value: 'complete',
      writable: true,
    });

    await import('./content');

    await vi.waitFor(() => {
      expect(sendMessageMock).toHaveBeenCalled();
    });

    const callArgs = sendMessageMock.mock.calls[0][0];
    expect(callArgs.data.link_count).toBe(3);
    expect(callArgs.data.image_count).toBe(2);
    expect(callArgs.data.word_count).toBeGreaterThan(0);
  });
});

