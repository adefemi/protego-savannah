/**
 * ErrorMessage Component
 * Displays error messages with a retry button
 */

import React from 'react';
import './ErrorMessage.scss';

interface ErrorMessageProps {
  message?: string;
  onRetry?: () => void;
  title?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  message = 'An unexpected error occurred. Please try again.', 
  onRetry,
  title = 'Oops, something went wrong!',
}) => {
  return (
    <div className="error">
      <h3>{title}</h3>
      <p>{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="retry-btn">
          Retry
        </button>
      )}
    </div>
  );
};

