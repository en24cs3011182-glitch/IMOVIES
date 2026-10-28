import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../api/http';
import { EmptyState, Loader } from '../components/Feedback';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';

const empty = { name: '', city: '', address: '', screens: 'Screen 1 | A:10:regular,B:8:premium' };
function parseScreens(text) {
  return text.split(';').map((part) => {
    const [namePart, rowsPart] = part.split('|');
    const rows = (rowsPart || '').split(',').map((rowText) => {
      const [row, count, type = 'regular'] = rowText.trim().split(':');
      return { row: row?.trim(), seatCount: Number(count), type: type.trim() };
    }).filter((row) => row.row && Number.isInteger(row.seatCount) && row.seatCount > 0);
    return { name: namePart?.trim(), rows };
  }).filter((screen) => screen.name && screen.rows.length);
}
function formatScreens(screens = []) {
  return screens.map((screen) => `${screen.name} | ${screen.rows.map((row) => `${row.row}:${row.seatCount}:${row.type}`).join(',')}`).join('; ');
}

export default function AdminTheatresPage() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    try { const { data } = await api.get('/theatres', { params: { limit: 50 } }); setItems(data.data.items); }
    catch { /* shared interceptor shows API errors */ }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const set = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  function create() { setEditing(null); setForm(empty); setModalOpen(true); }
  function edit(item) { setEditing(item._id); setForm({ name: item.name, city: item.city, address: item.address || '', screens: formatScreens(item.screens) }); setModalOpen(true); }
  function closeModal() { if (busy) return; setModalOpen(false); setEditing(null); setForm(empty); }
  async function submit(event) {
    event.preventDefault(); if (busy) return;
    const screens = parseScreens(form.screens);
    if (!screens.length) { toast.error('Enter at least one screen and a valid row layout.'); return; }
    setBusy(true);
    try {
      const payload = { name: form.name.trim(), city: form.city.trim(), address: form.address.trim(), screens };
      if (editing) await api.put(`/theatres/${editing}`, payload); else await api.post('/theatres', payload);
      toast.success(editing ? 'Theatre updated.' : 'Theatre added.'); setModalOpen(false); setEditing(null); setForm(empty); await load();
    } catch { /* shared interceptor shows the server message */ }
    finally { setBusy(false); }
  }
  async function remove() {
    if (!deleteTarget || busy) return; setBusy(true);
    try { await api.delete(`/theatres/${deleteTarget._id}`); toast.success('Theatre removed.'); setDeleteTarget(null); await load(); }
    catch { /* shared interceptor shows the server message */ }
    finally { setBusy(false); }
  }

  return <div>
    <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3"><div><h2 className="h4 mb-1">Theatres</h2><p className="small text-secondary mb-0">Locations, screens, and seating layouts.</p></div><div className="d-flex align-items-center gap-2"><span className="admin-count">{items.length} locations</span><button className="btn btn-primary btn-sm" onClick={create}>Create theatre</button></div></div>
    {loading ? <Loader label="Loading theatres…" /> : items.length ? <div className="table-responsive admin-table-wrap"><table className="table admin-table responsive-admin-table align-middle"><thead><tr><th>Theatre</th><th>City</th><th>Screens</th><th>Seats</th><th className="text-end">Actions</th></tr></thead><tbody>{items.map((item) => <tr key={item._id}><td data-label="Theatre"><strong>{item.name}</strong><small>{item.address || 'No address'}</small></td><td data-label="City">{item.city}</td><td data-label="Screens">{item.screens?.length || 0}</td><td data-label="Seats">{item.screens?.reduce((sum, screen) => sum + screen.rows.reduce((count, row) => count + row.seatCount, 0), 0) || 0}</td><td data-label="Actions" className="admin-actions"><button className="btn btn-sm btn-outline-light" onClick={() => edit(item)}>Edit</button><button className="btn btn-sm btn-outline-danger" onClick={() => setDeleteTarget(item)}>Delete</button></td></tr>)}</tbody></table></div> : <EmptyState title="No theatres yet" detail="Create a theatre to schedule screenings." />}
    <Modal open={modalOpen} title={editing ? 'Edit theatre' : 'Create theatre'} onClose={closeModal} size="modal-wide"><form onSubmit={submit}><div className="row g-3">
      <div className="col-md-6"><label htmlFor="theatre-name" className="form-label">Theatre name</label><input id="theatre-name" required className="form-control" value={form.name} onChange={set('name')} /></div><div className="col-md-6"><label htmlFor="theatre-city" className="form-label">City</label><input id="theatre-city" required className="form-control" value={form.city} onChange={set('city')} /></div>
      <div className="col-12"><label htmlFor="theatre-address" className="form-label">Address</label><input id="theatre-address" className="form-control" value={form.address} onChange={set('address')} /></div>
      <div className="col-12"><label htmlFor="theatre-screens" className="form-label">Screens and row layouts</label><textarea id="theatre-screens" className="form-control font-monospace" rows="3" required value={form.screens} onChange={set('screens')} /><div className="form-text">Format: <code>Screen 1 | A:10:regular,B:8:premium</code>. Separate screens with semicolons.</div></div>
      <div className="col-12 d-flex justify-content-end gap-2"><button type="button" className="btn btn-outline-light" onClick={closeModal} disabled={busy}>Close</button><button disabled={busy} className="btn btn-primary">{busy ? 'Saving…' : editing ? 'Save theatre' : 'Create theatre'}</button></div>
    </div></form></Modal>
    <ConfirmModal open={Boolean(deleteTarget)} title="Delete theatre?" message={deleteTarget ? `Delete ${deleteTarget.name}? The server will prevent removal while shows use it.` : ''} confirmLabel="Delete theatre" busy={busy} onConfirm={remove} onCancel={() => !busy && setDeleteTarget(null)} />
  </div>;
}
