import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../api/http';
import { EmptyState, Loader } from '../components/Feedback';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';

const empty = { title: '', description: '', genres: '', languages: '', durationMins: '', rating: 'UA', releaseDate: '', posterUrl: '', trailerUrl: '', cast: '' };
const csv = (value) => value.split(',').map((item) => item.trim()).filter(Boolean);
function toPayload(form) {
  return { title: form.title, description: form.description, genres: csv(form.genres), languages: csv(form.languages), durationMins: Number(form.durationMins), rating: form.rating, releaseDate: form.releaseDate, posterUrl: form.posterUrl || undefined, trailerUrl: form.trailerUrl || undefined, cast: csv(form.cast) };
}

export default function AdminMoviesPage() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    try { const { data } = await api.get('/movies', { params: { limit: 50 } }); setItems(data.data.items); }
    catch { /* shared interceptor shows API errors */ }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const set = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  function create() { setEditing(null); setForm(empty); setModalOpen(true); }
  function edit(movie) {
    setEditing(movie._id);
    setForm({ ...empty, ...movie, genres: (movie.genres || []).join(', '), languages: (movie.languages || []).join(', '), cast: (movie.cast || []).join(', '), releaseDate: movie.releaseDate?.slice(0, 10) || '' });
    setModalOpen(true);
  }
  function closeModal() { if (busy) return; setModalOpen(false); setEditing(null); setForm(empty); }
  async function submit(event) {
    event.preventDefault(); if (busy) return; setBusy(true);
    try {
      if (editing) await api.put(`/movies/${editing}`, toPayload(form)); else await api.post('/movies', toPayload(form));
      toast.success(editing ? 'Movie updated.' : 'Movie added.');
      setModalOpen(false); setEditing(null); setForm(empty); await load();
    } catch { /* shared interceptor shows the server message */ }
    finally { setBusy(false); }
  }
  async function remove() {
    if (!deleteTarget || busy) return; setBusy(true);
    try { await api.delete(`/movies/${deleteTarget._id}`); toast.success('Movie removed.'); setDeleteTarget(null); await load(); }
    catch { /* shared interceptor shows the server message */ }
    finally { setBusy(false); }
  }

  return <div>
    <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3"><div><h2 className="h4 mb-1">Movies</h2><p className="small text-secondary mb-0">Add and maintain your film catalogue.</p></div><div className="d-flex align-items-center gap-2"><span className="admin-count">{items.length} titles</span><button className="btn btn-primary btn-sm" onClick={create}>Create movie</button></div></div>
    {loading ? <Loader label="Loading movies…" /> : items.length ? <div className="table-responsive admin-table-wrap"><table className="table admin-table responsive-admin-table align-middle"><thead><tr><th>Title</th><th>Genres</th><th>Duration</th><th>Release</th><th className="text-end">Actions</th></tr></thead><tbody>{items.map((movie) => <tr key={movie._id}><td data-label="Title"><strong>{movie.title}</strong><small>{movie.languages?.join(', ')}</small></td><td data-label="Genres">{movie.genres?.join(', ') || '—'}</td><td data-label="Duration">{movie.durationMins} min</td><td data-label="Release">{new Date(movie.releaseDate).toLocaleDateString()}</td><td data-label="Actions" className="admin-actions"><button className="btn btn-sm btn-outline-light" onClick={() => edit(movie)}>Edit</button><button className="btn btn-sm btn-outline-danger" onClick={() => setDeleteTarget(movie)}>Delete</button></td></tr>)}</tbody></table></div> : <EmptyState title="No movies yet" detail="Create a movie to add it to the catalogue." />}
    <Modal open={modalOpen} title={editing ? 'Edit movie' : 'Create movie'} onClose={closeModal} size="modal-wide"><form onSubmit={submit}><div className="row g-3">
      <div className="col-md-8"><label htmlFor="movie-title" className="form-label">Title</label><input id="movie-title" className="form-control" required value={form.title} onChange={set('title')} /></div><div className="col-md-4"><label htmlFor="movie-rating" className="form-label">Rating</label><select id="movie-rating" className="form-select" value={form.rating} onChange={set('rating')}><option>U</option><option>UA</option><option>A</option><option>S</option></select></div>
      <div className="col-12"><label htmlFor="movie-description" className="form-label">Description</label><textarea id="movie-description" className="form-control" rows="2" value={form.description || ''} onChange={set('description')} /></div>
      <div className="col-md-6"><label htmlFor="movie-genres" className="form-label">Genres (comma separated)</label><input id="movie-genres" className="form-control" value={form.genres} onChange={set('genres')} /></div><div className="col-md-6"><label htmlFor="movie-languages" className="form-label">Languages (comma separated)</label><input id="movie-languages" className="form-control" value={form.languages} onChange={set('languages')} /></div>
      <div className="col-md-4"><label htmlFor="movie-duration" className="form-label">Duration (minutes)</label><input id="movie-duration" type="number" min="1" required className="form-control" value={form.durationMins} onChange={set('durationMins')} /></div><div className="col-md-4"><label htmlFor="movie-release" className="form-label">Release date</label><input id="movie-release" type="date" required className="form-control" value={form.releaseDate} onChange={set('releaseDate')} /></div><div className="col-md-4"><label htmlFor="movie-cast" className="form-label">Cast (comma separated)</label><input id="movie-cast" className="form-control" value={form.cast} onChange={set('cast')} /></div>
      <div className="col-md-6"><label htmlFor="movie-poster" className="form-label">Poster URL</label><input id="movie-poster" type="url" className="form-control" value={form.posterUrl || ''} onChange={set('posterUrl')} /></div><div className="col-md-6"><label htmlFor="movie-trailer" className="form-label">Trailer URL</label><input id="movie-trailer" type="url" className="form-control" value={form.trailerUrl || ''} onChange={set('trailerUrl')} /></div>
      <div className="col-12 d-flex justify-content-end gap-2"><button type="button" className="btn btn-outline-light" onClick={closeModal} disabled={busy}>Close</button><button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Create movie'}</button></div>
    </div></form></Modal>
    <ConfirmModal open={Boolean(deleteTarget)} title="Delete movie?" message={deleteTarget ? `Delete “${deleteTarget.title}” from the catalogue?` : ''} confirmLabel="Delete movie" busy={busy} onConfirm={remove} onCancel={() => !busy && setDeleteTarget(null)} />
  </div>;
}
