import React, { useState, useMemo } from 'react';
import { PageVisit } from '../../types';
import { VisitItem } from './VisitItem';
import { exportVisitsAsJSON, exportVisitsAsCSV } from '../../utils/export';
import './VisitHistory.scss';

interface VisitHistoryProps {
  visits: PageVisit[];
  onDelete?: () => void;
}

type SortField = 'datetime_visited' | 'link_count' | 'word_count' | 'image_count';
type SortOrder = 'asc' | 'desc';

export const VisitHistory: React.FC<VisitHistoryProps> = ({ visits, onDelete }) => {
  const [sortField, setSortField] = useState<SortField>('datetime_visited');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filterText, setFilterText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredAndSortedVisits = useMemo(() => {
    let filtered = visits;

    if (filterText.trim()) {
      filtered = visits.filter(v => 
        v.url.toLowerCase().includes(filterText.toLowerCase())
      );
    }

    const sorted = [...filtered].sort((a, b) => {
      let aVal: number | string = a[sortField];
      let bVal: number | string = b[sortField];

      if (sortField === 'datetime_visited') {
        aVal = new Date(a.datetime_visited).getTime();
        bVal = new Date(b.datetime_visited).getTime();
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return sorted;
  }, [visits, filterText, sortField, sortOrder]);

  const totalPages = Math.ceil(filteredAndSortedVisits.length / itemsPerPage);
  const paginatedVisits = filteredAndSortedVisits.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  if (visits.length === 0) {
    return (
      <section className="visit-history">
        <h2>Visit History</h2>
        <p className="no-visits">No previous visits recorded</p>
      </section>
    );
  }

  return (
    <section className="visit-history">
      <div className="visit-history__header">
        <h2>Visit History</h2>
        <span className="visit-count">
          {filteredAndSortedVisits.length} visit{filteredAndSortedVisits.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="visit-history__controls">
        <input
          type="text"
          className="filter-input"
          placeholder="Filter by URL..."
          value={filterText}
          onChange={(e) => {
            setFilterText(e.target.value);
            setCurrentPage(1);
          }}
        />
        
        <div className="sort-controls">
          <select
            value={sortField}
            onChange={(e) => handleSort(e.target.value as SortField)}
            className="sort-select"
          >
            <option value="datetime_visited">Date</option>
            <option value="link_count">Links</option>
            <option value="word_count">Words</option>
            <option value="image_count">Images</option>
          </select>
          <button onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} className="sort-order">
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>

        <div className="action-buttons">
          <button onClick={() => exportVisitsAsJSON(filteredAndSortedVisits)} className="btn-export" title="Export as JSON">
            JSON
          </button>
          <button onClick={() => exportVisitsAsCSV(filteredAndSortedVisits)} className="btn-export" title="Export as CSV">
            CSV
          </button>
          {onDelete && (
            <button onClick={onDelete} className="btn-delete" title="Delete all history">
              Delete
            </button>
          )}
        </div>
      </div>

      <div className="visits-list">
        {paginatedVisits.map((visit) => (
          <VisitItem key={visit.id} visit={visit} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="pagination-btn"
          >
            ← Previous
          </button>
          <span className="pagination-info">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="pagination-btn"
          >
            Next →
          </button>
        </div>
      )}
    </section>
  );
};

