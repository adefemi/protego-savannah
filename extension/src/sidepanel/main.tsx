/**
 * Entry point for the side panel React application
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from '../components/ErrorBoundary/ErrorBoundary';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

