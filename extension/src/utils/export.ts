import { PageVisit } from '../types';

export const exportVisitsAsJSON = (visits: PageVisit[]): void => {
  const json = JSON.stringify(visits, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `protego-history-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const exportVisitsAsCSV = (visits: PageVisit[]): void => {
  if (visits.length === 0) {
    console.warn('No visits to export');
    return;
  }

  const headers = ['ID', 'URL', 'Date Visited', 'Links', 'Words', 'Images'];
  const rows = visits.map(v => [
    v.id,
    v.url,
    new Date(v.datetime_visited).toLocaleString(),
    v.link_count,
    v.word_count,
    v.image_count
  ]);

  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `protego-history-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

