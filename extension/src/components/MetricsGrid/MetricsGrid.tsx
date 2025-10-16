/**
 * MetricsGrid Component
 * Displays page metrics in a grid layout (links, words, images)
 */

import React from 'react';
import { PageMetrics } from '../../types';
import { MetricCard } from './MetricCard';
import './MetricsGrid.scss';

interface MetricsGridProps {
  metrics: PageMetrics | null;
}

export const MetricsGrid: React.FC<MetricsGridProps> = ({ metrics }) => {
  return (
    <section className="metrics">
      <h2>Page Metrics</h2>
      <div className="metrics-grid">
        <MetricCard
          icon="🔗"
          value={metrics?.link_count || 0}
          label="Links"
        />
        <MetricCard
          icon="📝"
          value={metrics?.word_count || 0}
          label="Words"
        />
        <MetricCard
          icon="🖼️"
          value={metrics?.image_count || 0}
          label="Images"
        />
      </div>
    </section>
  );
};

