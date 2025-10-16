/**
 * VisitItem Component
 * Individual visit entry showing timestamp and metrics
 */

import React from 'react';
import { PageVisit } from '../../types';

interface VisitItemProps {
  visit: PageVisit;
}

/**
 * Formats a date string to localized string
 */
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString();
};

export const VisitItem: React.FC<VisitItemProps> = ({ visit }) => {
  return (
    <div className="visit-item">
      <div className="visit-date">
        {formatDate(visit.datetime_visited)}
      </div>
      <div className="visit-stats">
        <span title="Links">🔗 {visit.link_count}</span>
        <span title="Words">📝 {visit.word_count}</span>
        <span title="Images">🖼️ {visit.image_count}</span>
      </div>
    </div>
  );
};

