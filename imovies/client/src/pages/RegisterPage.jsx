import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import api, { getErrorMessage } from '../api/http';
import { setCredentials } from '../features/auth/authSlice';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  async function submit(event) {
    event.preventDefault(); setError('');
    if (form.password.length < 8) return setError('Use at least 8 characters for your password.');
    if (form.password !== form.confirmPassword) return setError('Those passwords do not match.');
    setBusy(true);
    try {
      const { confirmPassword, ...payload } = form;
      const { data } = await api.post('/auth/register', payload);
      dispatch(setCredentials(data.data));
      toast.success('Your account is ready.');
      navigate('/');
    } catch (requestError) { setError(getErrorMessage(requestError)); }
    finally { setBusy(false); }
  }

  return <div className="auth-shell container py-5"><div className="auth-card mx-auto">
    <div className="auth-icon">?</div><p className="eyebrow">JOIN THE SHOW</p><h1 className="h2 mb-2">Create your account</h1><p className="text-secondary mb-4">A seat with your name on it is just a few steps away.</p>
    {error && <div className="alert alert-danger py-2">{error}</div>}
    <form onSubmit={submit}>
      <div className="mb-3"><label className="form-label" htmlFor="name">Full name</label><input id="name" className="form-control" autoComplete="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
      <div className="mb-3"><label className="form-label" htmlFor="email">Email</label><input id="email" className="form-control" type="email" autoComplete="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
      <div className="mb-3"><label className="form-label" htmlFor="phone">Phone <span className="text-secondary">(optional)</span></label><input id="phone" className="form-control" type="tel" autoComplete="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
      <div className="mb-3"><label className="form-label" htmlFor="password">Password</label><input id="password" className="form-control" type="password" autoComplete="new-password" minLength={8} required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
      <div className="mb-4"><label className="form-label" htmlFor="confirm-password">Confirm password</label><input id="confirm-password" className="form-control" type="password" autoComplete="new-password" required value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} /></div>
      <button className="btn btn-primary w-100 btn-lg" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>
    </form>
    <p className="text-secondary text-center mt-4 mb-0">Already have an account? <Link to="/login">Sign in</Link></p>
  </div></div>;
}
