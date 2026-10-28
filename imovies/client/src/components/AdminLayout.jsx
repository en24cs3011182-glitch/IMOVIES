import { Outlet, NavLink } from 'react-router-dom';
export default function AdminLayout() {
  return <div className="container py-4 py-lg-5"><div className="admin-heading d-flex flex-wrap justify-content-between align-items-end gap-3"><div><p className="eyebrow mb-2">CONTROL ROOM</p><h1 className="h2 mb-0">Admin studio</h1></div><span className="text-secondary small">Manage what’s playing and where.</span></div>
    <div className="admin-layout mt-4"><aside className="admin-sidebar"><NavLink end to="/admin">Overview</NavLink><NavLink to="/admin/movies">Movies</NavLink><NavLink to="/admin/theatres">Theatres</NavLink><NavLink to="/admin/shows">Shows</NavLink></aside><section className="admin-content"><Outlet /></section></div>
  </div>;
}
