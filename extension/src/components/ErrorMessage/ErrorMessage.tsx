/**
 * ErrorMessage Component
 * Displays error messages with a retry button
 */

import React from 'react';
import './ErrorMessage.scss';

interface ErrorMessageProps {
  message: string;
  onRetry: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => {
  return (
    <div className="error">
      <p>❌ {message}</p>
      <button onClick={onRetry} className="retry-btn">
        Retry
      </button>
    </div>
  );
};

