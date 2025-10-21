import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CurrentPage } from './CurrentPage';

describe('CurrentPage', () => {
  it('should render current page section with title', () => {
    render(<CurrentPage url="https://example.com" />);

    expect(screen.getByText('Current Page')).toBeInTheDocument();
  });

  it('should display formatted URL (hostname + pathname)', () => {
    render(<CurrentPage url="https://example.com/path/to/page" />);

    expect(screen.getByText('example.com/path/to/page')).toBeInTheDocument();
  });

  it('should have full URL in title attribute', () => {
    render(<CurrentPage url="https://example.com/path?query=test" />);

    const urlDisplay = screen.getByTitle('https://example.com/path?query=test');
    expect(urlDisplay).toBeInTheDocument();
  });

  it('should format URL without query parameters in display', () => {
    render(<CurrentPage url="https://example.com/page?query=test&other=value" />);

    expect(screen.getByText('example.com/page')).toBeInTheDocument();
  });

  it('should format URL without hash in display', () => {
    render(<CurrentPage url="https://example.com/page#section" />);

    expect(screen.getByText('example.com/page')).toBeInTheDocument();
  });

  it('should handle root URL correctly', () => {
    render(<CurrentPage url="https://example.com/" />);

    expect(screen.getByText('example.com/')).toBeInTheDocument();
  });

  it('should handle URL with port number', () => {
    render(<CurrentPage url="http://localhost:8000/api/test" />);

    expect(screen.getByText('localhost/api/test')).toBeInTheDocument();
  });

  it('should handle subdomain URLs', () => {
    render(<CurrentPage url="https://api.example.com/v1/users" />);

    expect(screen.getByText('api.example.com/v1/users')).toBeInTheDocument();
  });

  it('should return original URL when URL parsing fails', () => {
    render(<CurrentPage url="not-a-valid-url" />);

    expect(screen.getByText('not-a-valid-url')).toBeInTheDocument();
  });

  it('should handle empty string gracefully', () => {
    render(<CurrentPage url="" />);

    expect(screen.getByTitle('')).toBeInTheDocument();
  });

  it('should have correct CSS classes', () => {
    const { container } = render(<CurrentPage url="https://example.com" />);

    expect(container.querySelector('.current-page')).toBeInTheDocument();
    expect(container.querySelector('.url-display')).toBeInTheDocument();
  });

  it('should handle complex URLs with all components', () => {
    render(<CurrentPage url="https://user:pass@example.com:8080/path?query=1#hash" />);

    expect(screen.getByText('example.com/path')).toBeInTheDocument();
    expect(screen.getByTitle('https://user:pass@example.com:8080/path?query=1#hash')).toBeInTheDocument();
  });

  it('should handle URL with special characters in path', () => {
    render(<CurrentPage url="https://example.com/path/with%20spaces" />);

    expect(screen.getByText('example.com/path/with%20spaces')).toBeInTheDocument();
  });

  it('should handle invalid URL and display as-is', () => {
    render(<CurrentPage url="chrome://extensions" />);

    expect(screen.getByText('extensions')).toBeInTheDocument();
    expect(screen.getByTitle('chrome://extensions')).toBeInTheDocument();
  });
});

