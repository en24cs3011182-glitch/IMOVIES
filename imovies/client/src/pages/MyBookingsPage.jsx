import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/http';
import { EmptyState, Loader } from '../components/Feedback';
import ConfirmModal from '../components/ConfirmModal';

const PAGE_SIZE = 10;
export default function MyBookingsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('upcoming');
  const [page, setPage] = useState(1);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const first = await api.get('/bookings/me', { params: { page: 1, limit: PAGE_SIZE } });
      const result = first.data.data;
      const pages = result.pagination?.pages || 1;
      const rest = pages > 1 ? await Promise.all(Array.from({ length: pages - 1 }, (_, index) =>
        api.get('/bookings/me', { params: { page: index + 2, limit: PAGE_SIZE } })
      )) : [];
      setItems([...result.items, ...rest.flatMap((response) => response.data.data.items)]);
    } catch { /* the shared API interceptor reports the server message */ }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const visible = useMemo(() => {
    const now = Date.now();
    return items.filter((booking) => {
      const startsAt = booking.show?.startTime ? new Date(booking.show.startTime).getTime() : 0;
      const completed = ['cancelled', 'failed'].includes(booking.status);
      return tab === 'upcoming' ? startsAt >= now && !completed : startsAt < now || completed;
    }).sort((a, b) => {
      const timeA = new Date(a.show?.startTime || a.createdAt).getTime();
      const timeB = new Date(b.show?.startTime || b.createdAt).getTime();
      return tab === 'upcoming' ? timeA - timeB : timeB - timeA;
    });
  }, [items, tab]);
  const pages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const pageItems = visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function changeTab(value) { setTab(value); setPage(1); }
  async function confirmCancel() {
    if (!cancelTarget || busy) return;
    setBusy(true);
    try {
      await api.post(`/bookings/${cancelTarget._id}/cancel`);
      toast.success('Booking cancelled.');
      setCancelTarget(null);
      await load();
    } catch { /* the shared API interceptor displays the server rejection message */ }
    finally { setBusy(false); }
  }

  return <main className="container py-5">
    <p className="eyebrow">YOUR CINEMA PLANS</p>
    <div className="d-flex flex-wrap justify-content-between align-items-end gap-3"><div><h1 className="h2 mb-1">My bookings</h1><p className="text-secondary mb-0">Your tickets, all in one place.</p></div><Link className="btn btn-outline-light" to="/">Find a movie</Link></div>
    <div className="booking-tabs mt-4" role="tablist" aria-label="Booking history">
      <button type="button" role="tab" aria-selected={tab === 'upcoming'} className={tab === 'upcoming' ? 'active' : ''} onClick={() => changeTab('upcoming')}>Upcoming</button>
      <button type="button" role="tab" aria-selected={tab === 'past'} className={tab === 'past' ? 'active' : ''} onClick={() => changeTab('past')}>Past</button>
    </div>
    {loading ? <Loader label="Loading your bookings…" /> : pageItems.length ? <div className="booking-list mt-3">{pageItems.map((booking) => {
      const show = booking.show || {}; const movie = show.movie || {}; const theatre = show.theatre || {};
      const canCancel = booking.status === 'confirmed' && new Date(show.startTime) > new Date();
      return <article className="booking-card" key={booking._id}>
        <div className="booking-card-art">{movie.posterUrl ? <img src={movie.posterUrl} alt={`${movie.title || 'Movie'} poster`} /> : <span>IM</span>}</div>
        <div className="booking-card-main">
          <div className="d-flex flex-wrap justify-content-between gap-2"><div><p className="eyebrow mb-1">{booking.status}</p><h2 className="h5 mb-1">{movie.title || 'Movie booking'}</h2></div><span className="booking-id">#{booking._id.slice(-8).toUpperCase()}</span></div>
          <p className="small text-secondary mb-2">{theatre.name || 'Theatre'}{theatre.city ? ` · ${theatre.city}` : ''}</p>
          <div className="booking-card-meta"><span>{show.startTime ? new Date(show.startTime).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Showtime unavailable'}</span><span>Seats: {booking.seats?.join(', ') || '—'}</span><strong>₹{Number(booking.amount || 0).toLocaleString('en-IN')}</strong></div>
          <div className="d-flex flex-wrap gap-2 mt-3">{booking.status === 'confirmed' && <Link className="btn btn-sm btn-outline-light" to={`/booking/${booking._id}/confirmation`} state={{ booking }}>View ticket</Link>}{canCancel && <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => setCancelTarget(booking)}>Cancel booking</button>}</div>
        </div>
      </article>;
    })}</div> : <EmptyState title={tab === 'upcoming' ? 'No upcoming movie nights' : 'No past bookings'} detail="When you book a show, it will appear here." />}
    {!loading && pages > 1 && <nav className="mt-4" aria-label="Booking pages"><ul className="pagination justify-content-center"><li className={`page-item${page <= 1 ? ' disabled' : ''}`}><button type="button" className="page-link" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button></li><li className="page-item disabled"><span className="page-link">{page} / {pages}</span></li><li className={`page-item${page >= pages ? ' disabled' : ''}`}><button type="button" className="page-link" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button></li></ul></nav>}
    <ConfirmModal open={Boolean(cancelTarget)} title="Cancel this booking?" message={cancelTarget ? `Cancel seats ${cancelTarget.seats?.join(', ')}? The cancellation cutoff is enforced by the cinema.` : ''} confirmLabel="Cancel booking" busy={busy} onConfirm={confirmCancel} onCancel={() => !busy && setCancelTarget(null)} />
  </main>;
}
