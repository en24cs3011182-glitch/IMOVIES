import { Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { AdminRoute, ProtectedRoute } from './components/RouteGuards';
import AdminLayout from './components/AdminLayout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MovieDetailsPage from './pages/MovieDetailsPage';
import SeatSelectionPage from './pages/SeatSelectionPage';
import CheckoutPage from './pages/CheckoutPage';
import ConfirmationPage from './pages/ConfirmationPage';
import MyBookingsPage from './pages/MyBookingsPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminMoviesPage from './pages/AdminMoviesPage';
import AdminTheatresPage from './pages/AdminTheatresPage';
import AdminShowsPage from './pages/AdminShowsPage';

const protectedPage = (Page) => <ProtectedRoute><Page /></ProtectedRoute>;
const adminPage = (children) => <AdminRoute>{children}</AdminRoute>;
export default function App() {
  return <div className="app-shell"><Navbar /><div className="page-content"><Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/movies/:id" element={<MovieDetailsPage />} />
    <Route path="/shows/:id" element={protectedPage(SeatSelectionPage)} />
    <Route path="/checkout" element={protectedPage(CheckoutPage)} />
    <Route path="/booking/:id/confirmation" element={protectedPage(ConfirmationPage)} />
    <Route path="/my-bookings" element={protectedPage(MyBookingsPage)} />
    <Route path="/admin" element={adminPage(<AdminDashboardPage />)} />
    <Route path="/admin/movies" element={adminPage(<AdminMoviesPage />)} />
    <Route path="/admin/theatres" element={adminPage(<AdminTheatresPage />)} />
    <Route path="/admin/shows" element={adminPage(<AdminShowsPage />)} />
    <Route path="*" element={<main className="container py-5"><h1 className="h3">Page not found</h1><a href="/">Return home</a></main>} />
  </Routes></div><Footer /></div>;
}
