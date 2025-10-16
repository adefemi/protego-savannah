/**
 * VisitHistory Component
 * Displays a list of previous visits to the current page
 */

import React from 'react';
import { PageVisit } from '../../types';
import { VisitItem } from './VisitItem';
import './VisitHistory.scss';

interface VisitHistoryProps {
  visits: PageVisit[];
}

export const VisitHistory: React.FC<VisitHistoryProps> = ({ visits }) => {
  return (
    <section className="visit-history">
      <h2>Visit History</h2>
      {visits.length === 0 ? (
        <p className="no-visits">No previous visits recorded</p>
      ) : (
        <div className="visits-list">
          {visits.map((visit) => (
            <VisitItem key={visit.id} visit={visit} />
          ))}
        </div>
      )}
    </section>
  );
};

