/**
 * Loading Component
 * Displays a loading spinner and message
 */

import React from 'react';
import './Loading.scss';

export const Loading: React.FC = () => {
  return (
    <div className="loading">
      <div className="spinner" aria-label="Loading"></div>
      <p>Loading...</p>
    </div>
  );
};

