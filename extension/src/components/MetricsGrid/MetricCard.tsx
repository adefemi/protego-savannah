/**
 * MetricCard Component
 * Individual metric card showing icon, value, and label
 */

import React from 'react';

interface MetricCardProps {
  icon: string;
  value: number;
  label: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({ icon, value, label }) => {
  return (
    <div className="metric-card">
      <div className="metric-icon" aria-hidden="true">{icon}</div>
      <div className="metric-value">{value.toLocaleString()}</div>
      <div className="metric-label">{label}</div>
    </div>
  );
};

