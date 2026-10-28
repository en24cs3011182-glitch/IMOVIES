import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
export function ProtectedRoute({ children }) {
  const { token } = useSelector((state) => state.auth);
  const location = useLocation();
  return token ? children : <Navigate to="/login" replace state={{ from: location }} />;
}
export function AdminRoute({ children }) {
  const { token, user } = useSelector((state) => state.auth);
  const location = useLocation();
  if (!token) return <Navigate to="/login" replace state={{ from: location }} />;
  return user?.role === 'admin' ? children : <Navigate to="/" replace />;
}
