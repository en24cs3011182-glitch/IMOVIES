import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../features/auth/authSlice';
export default function Navbar() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const navClass = ({ isActive }) => `nav-link${isActive ? ' active' : ''}`;
  const signOut = () => { dispatch(logout()); navigate('/'); };
  return (
    <nav className="navbar navbar-expand-lg navbar-dark site-nav sticky-top">
      <div className="container py-1">
        <Link className="navbar-brand d-flex align-items-center gap-2" to="/"><span className="brand-mark">i</span><span>IMOVIES</span></Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNavbar" aria-controls="mainNavbar" aria-expanded="false" aria-label="Toggle navigation"><span className="navbar-toggler-icon" /></button>
        <div className="collapse navbar-collapse" id="mainNavbar">
          <div className="navbar-nav ms-auto align-items-lg-center gap-lg-2">
            <NavLink className={navClass} to="/">Movies</NavLink>
            {user && <NavLink className={navClass} to="/my-bookings">My bookings</NavLink>}
            {user?.role === 'admin' && <NavLink className={navClass} to="/admin">Admin</NavLink>}
            {user ? <div className="d-flex align-items-center gap-2 ms-lg-2">
              <span className="navbar-text text-light">{user.name}</span>
              <button className="btn btn-outline-light btn-sm" onClick={signOut}>Logout</button>
            </div> : <div className="d-flex align-items-center gap-2 ms-lg-2">
              <NavLink className="btn btn-outline-light btn-sm" to="/login">Login</NavLink>
              <NavLink className="btn btn-primary btn-sm px-3" to="/register">Register</NavLink>
            </div>}
          </div>
        </div>
      </div>
    </nav>
  );
}
