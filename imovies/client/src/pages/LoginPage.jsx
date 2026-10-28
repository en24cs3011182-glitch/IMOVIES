import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import api, { getErrorMessage } from '../api/http';
import { setCredentials } from '../features/auth/authSlice';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  async function submit(event) {
    event.preventDefault(); setError(''); setBusy(true);
    try {
      const { data } = await api.post('/auth/login', form);
      dispatch(setCredentials(data.data));
      toast.success(`Welcome back, ${data.data.user.name}`);
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (requestError) { setError(getErrorMessage(requestError)); }
    finally { setBusy(false); }
  }

  return <div className="auth-shell container py-5"><div className="auth-card mx-auto">
    <div className="auth-icon">?</div><p className="eyebrow">WELCOME BACK</p><h1 className="h2 mb-2">Sign in</h1><p className="text-secondary mb-4">Your next great movie night is waiting.</p>
    {error && <div className="alert alert-danger py-2">{error}</div>}
    <form onSubmit={submit}>
      <div className="mb-3"><label className="form-label" htmlFor="email">Email</label><input id="email" className="form-control" type="email" autoComplete="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
      <div className="mb-4"><label className="form-label" htmlFor="password">Password</label><input id="password" className="form-control" type="password" autoComplete="current-password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
      <button className="btn btn-primary w-100 btn-lg" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
    </form>
    <p className="text-secondary text-center mt-4 mb-0">New to IMovies? <Link to="/register">Create an account</Link></p>
  </div></div>;
}
