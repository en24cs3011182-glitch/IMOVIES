import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../api/http';
import { EmptyState, Loader } from '../components/Feedback';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';

const asLocalInput = (value) => { const date = new Date(value); date.setMinutes(date.getMinutes() - date.getTimezoneOffset()); return date.toISOString().slice(0, 16); };
const empty = { movie: '', theatre: '', screenId: '', language: '', startTime: '', endTime: '' };
const regularPrice = Number(import.meta.env.VITE_SEAT_PRICE_REGULAR || 100);
const premiumPrice = Number(import.meta.env.VITE_SEAT_PRICE_PREMIUM || 150);
export default function AdminShowsPage() {
  const [movies, setMovies] = useState([]); const [theatres, setTheatres] = useState([]); const [shows, setShows] = useState([]);
  const [form, setForm] = useState(empty); const [editing, setEditing] = useState(null); const [modalOpen, setModalOpen] = useState(false); const [deleteTarget, setDeleteTarget] = useState(null);
  const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [movieResponse, theatreResponse, showResponse] = await Promise.all([
        api.get('/movies', { params: { limit: 50 } }), api.get('/theatres', { params: { limit: 50 } }), api.get('/shows', { params: { limit: 50 } }),
      ]);
      setMovies(movieResponse.data.data.items); setTheatres(theatreResponse.data.data.items); setShows(showResponse.data.data.items);
    } catch { /* shared interceptor shows API errors */ }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const selectedMovie = movies.find((movie) => movie._id === form.movie);
  const selectedTheatre = theatres.find((theatre) => theatre._id === form.theatre);
  const set = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  function create() { setEditing(null); setForm({ ...empty, language: '' }); setModalOpen(true); }
  function edit(show) {
    setEditing(show._id);
    setForm({ ...empty, movie: show.movie?._id || '', theatre: show.theatre?._id || '', screenId: show.screenId || '', language: show.language, startTime: asLocalInput(show.startTime), endTime: asLocalInput(show.endTime) });
    setModalOpen(true);
  }
  function closeModal() { if (busy) return; setModalOpen(false); setEditing(null); setForm(empty); }
  async function submit(event) {
    event.preventDefault(); if (busy) return; setBusy(true);
    try {
      if (editing) {
        await api.put(`/shows/${editing}`, { movie: form.movie, language: form.language, startTime: new Date(form.startTime).toISOString(), endTime: new Date(form.endTime).toISOString() });
        toast.success('Show updated.');
      } else {
        await api.post('/shows', { movie: form.movie, theatre: form.theatre, screenId: form.screenId, language: form.language, startTime: new Date(form.startTime).toISOString(), endTime: new Date(form.endTime).toISOString() });
        toast.success('Show created. The server generated its seats and configured prices.');
      }
      setModalOpen(false); setEditing(null); setForm(empty); await load();
    } catch { /* shared interceptor shows the server message */ }
    finally { setBusy(false); }
  }
  async function remove() {
    if (!deleteTarget || busy) return; setBusy(true);
    try { await api.delete(`/shows/${deleteTarget._id}`); toast.success('Show deleted.'); setDeleteTarget(null); await load(); }
    catch { /* shared interceptor shows the server message */ }
    finally { setBusy(false); }
  }

  return <div>
    <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3"><div><h2 className="h4 mb-1">Shows</h2><p className="small text-secondary mb-0">Schedule screenings; the server generates the seat map.</p></div><div className="d-flex align-items-center gap-2"><span className="admin-count">{shows.length} screenings</span><button className="btn btn-primary btn-sm" onClick={create}>Create show</button></div></div>
    {loading ? <Loader label="Loading shows…" /> : shows.length ? <div className="table-responsive admin-table-wrap"><table className="table admin-table responsive-admin-table align-middle"><thead><tr><th>Movie</th><th>Theatre</th><th>Screening</th><th>Seats</th><th className="text-end">Actions</th></tr></thead><tbody>{shows.map((show) => <tr key={show._id}><td data-label="Movie"><strong>{show.movie?.title || 'Movie'}</strong><small>{show.language}</small></td><td data-label="Theatre">{show.theatre?.name || 'Theatre'}{show.theatre?.city ? ` · ${show.theatre.city}` : ''}</td><td data-label="Screening">{new Date(show.startTime).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</td><td data-label="Seats">{show.seats?.length || 0}</td><td data-label="Actions" className="admin-actions"><button className="btn btn-sm btn-outline-light" onClick={() => edit(show)}>Edit</button><button className="btn btn-sm btn-outline-danger" onClick={() => setDeleteTarget(show)}>Delete</button></td></tr>)}</tbody></table></div> : <EmptyState title="No shows scheduled" detail="Create a show to make a movie available to book." />}
    <Modal open={modalOpen} title={editing ? 'Edit show' : 'Create show'} onClose={closeModal} size="modal-wide"><form onSubmit={submit}><div className="row g-3">
      <div className="col-md-6"><label htmlFor="show-movie" className="form-label">Movie</label><select id="show-movie" className="form-select" required value={form.movie} onChange={(event) => { const movie = movies.find((item) => item._id === event.target.value); setForm((current) => ({ ...current, movie: event.target.value, language: movie?.languages?.[0] || '' })); }}><option value="">Select a movie</option>{movies.map((movie) => <option key={movie._id} value={movie._id}>{movie.title}</option>)}</select></div>
      <div className="col-md-6"><label htmlFor="show-theatre" className="form-label">Theatre</label><select id="show-theatre" className="form-select" required disabled={Boolean(editing)} value={form.theatre} onChange={(event) => setForm((current) => ({ ...current, theatre: event.target.value, screenId: '' }))}><option value="">Select a theatre</option>{theatres.map((theatre) => <option key={theatre._id} value={theatre._id}>{theatre.name} · {theatre.city}</option>)}</select></div>
      <div className="col-md-6"><label htmlFor="show-screen" className="form-label">Screen</label><select id="show-screen" className="form-select" required disabled={Boolean(editing) || !selectedTheatre} value={form.screenId} onChange={(event) => set('screenId', event.target.value)}><option value="">Select a screen</option>{selectedTheatre?.screens.map((screen) => <option key={screen._id} value={screen._id}>{screen.name}</option>)}</select></div>
      <div className="col-md-6"><label htmlFor="show-language" className="form-label">Language</label><select id="show-language" className="form-select" required value={form.language} onChange={(event) => set('language', event.target.value)}><option value="">Select a language</option>{(selectedMovie?.languages?.length ? selectedMovie.languages : form.language ? [form.language] : []).map((language) => <option key={language} value={language}>{language}</option>)}</select></div>
      <div className="col-md-6"><label htmlFor="show-start" className="form-label">Start time</label><input id="show-start" type="datetime-local" required className="form-control" value={form.startTime} onChange={(event) => set('startTime', event.target.value)} /></div><div className="col-md-6"><label htmlFor="show-end" className="form-label">End time</label><input id="show-end" type="datetime-local" required className="form-control" value={form.endTime} onChange={(event) => set('endTime', event.target.value)} /></div>
      {!editing && <><div className="col-md-6"><label htmlFor="regular-price" className="form-label">Regular seat price (server default)</label><input id="regular-price" type="number" className="form-control" value={regularPrice} readOnly /></div><div className="col-md-6"><label htmlFor="premium-price" className="form-label">Premium seat price (server default)</label><input id="premium-price" type="number" className="form-control" value={premiumPrice} readOnly /></div><div className="col-12"><p className="form-text mb-0">These values are a preview. The server configuration sets every generated seat price.</p></div></>}
      <div className="col-12 d-flex justify-content-end gap-2"><button type="button" className="btn btn-outline-light" onClick={closeModal} disabled={busy}>Close</button><button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Create show'}</button></div>
    </div></form></Modal>
    <ConfirmModal open={Boolean(deleteTarget)} title="Delete show?" message={deleteTarget ? `Delete the ${deleteTarget.movie?.title || 'movie'} screening at ${deleteTarget.theatre?.name || 'this theatre'}?` : ''} confirmLabel="Delete show" busy={busy} onConfirm={remove} onCancel={() => !busy && setDeleteTarget(null)} />
  </div>;
}
