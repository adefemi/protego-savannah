/**
 * CurrentPage Component
 * Displays the current page URL
 */

import React from 'react';
import './CurrentPage.scss';

interface CurrentPageProps {
  url: string;
}

/**
 * Formats a full URL to show just hostname and pathname
 */
const formatUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname + urlObj.pathname;
  } catch {
    return url;
  }
};

export const CurrentPage: React.FC<CurrentPageProps> = ({ url }) => {
  return (
    <section className="current-page">
      <h2>Current Page</h2>
      <div className="url-display" title={url}>
        {formatUrl(url)}
      </div>
    </section>
  );
};

