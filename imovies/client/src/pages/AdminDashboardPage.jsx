import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/http';
import { Loader } from '../components/Feedback';

export default function AdminDashboardPage() {
  const [counts, setCounts] = useState(null);
  useEffect(() => { Promise.all(['/movies', '/theatres', '/shows'].map((path) => api.get(path, { params: { limit: 1 } })))
    .then((responses) => setCounts(responses.map((response) => response.data.data.pagination.total)))
    .catch(() => setCounts([0, 0, 0])); }, []);
  if (!counts) return <Loader label="Opening the studio…" />;
  const cards = [
    { title: 'Movies', count: counts[0], to: '/admin/movies', detail: 'Titles in your catalogue' },
    { title: 'Theatres', count: counts[1], to: '/admin/theatres', detail: 'Cinema locations' },
    { title: 'Shows', count: counts[2], to: '/admin/shows', detail: 'Scheduled screenings' },
  ];
  return <div><h2 className="h4 mb-3">Your catalogue</h2><div className="row g-3">{cards.map((card) => <div className="col-md-4" key={card.title}><Link className="admin-stat-card" to={card.to}><span className="text-secondary small">{card.title}</span><strong>{card.count}</strong><span className="small text-secondary">{card.detail} ?</span></Link></div>)}</div><div className="admin-note mt-4"><span className="note-icon">?</span><div><strong>Ready for a new release?</strong><p className="mb-0 text-secondary small">Add a movie, set up its showtimes, and your audience can book right away.</p></div><Link className="btn btn-primary btn-sm ms-auto" to="/admin/movies">Add a movie</Link></div></div>;
}
