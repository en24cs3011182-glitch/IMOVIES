export function Loader({ label = 'Loading…' }) {
  return <div className="loader-wrap" role="status"><span className="spinner-border spinner-border-sm text-primary" aria-hidden="true" /> <span>{label}</span></div>;
}
export function EmptyState({ title = 'Nothing here yet', detail = 'Try changing your filters.' }) {
  return <div className="empty-state text-center"><div className="empty-icon">?</div><h3>{title}</h3><p className="text-secondary mb-0">{detail}</p></div>;
}
export function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;
  const start = Math.max(1, Math.min(page - 2, pages - 4));
  const shown = Array.from({ length: Math.min(5, pages) }, (_, index) => start + index);
  return <nav aria-label="Movie pages" className="mt-4"><ul className="pagination justify-content-center">
    <li className={`page-item${page === 1 ? ' disabled' : ''}`}><button className="page-link" onClick={() => onChange(page - 1)} aria-label="Previous page">‹</button></li>
    {shown.map((item) => <li key={item} className={`page-item${page === item ? ' active' : ''}`}><button className="page-link" onClick={() => onChange(item)}>{item}</button></li>)}
    <li className={`page-item${page === pages ? ' disabled' : ''}`}><button className="page-link" onClick={() => onChange(page + 1)} aria-label="Next page">›</button></li>
  </ul></nav>;
}
