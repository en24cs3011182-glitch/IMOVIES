import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/http';
import { Loader } from '../components/Feedback';

export default function ConfirmationPage() {
  const { id } = useParams();
  const location = useLocation();
  const [booking, setBooking] = useState(location.state?.booking || null);
  const [payment, setPayment] = useState(location.state?.payment || null);
  const [loading, setLoading] = useState(!location.state?.booking?.show?.movie);

  useEffect(() => {
    if (booking?.show?.movie) return;
    let active = true;
    api.get(`/bookings/${id}`).then(({ data }) => {
      if (active) setBooking(data.data);
    }).catch(() => toast.error('Could not load booking details')).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [booking?.show?.movie, id]);

  if (loading) return <div className="container py-5"><Loader label="Loading your ticket…" /></div>;
  const success = booking?.status === 'confirmed' || payment?.status === 'success';
  return <main className="container py-5"><div className={`confirmation-card mx-auto${success ? ' is-success' : ' is-failed'}`}>
    <div className="confirmation-icon">{success ? '✓' : '×'}</div><p className="eyebrow">{success ? 'YOU’RE ALL SET' : 'PAYMENT NOT COMPLETED'}</p><h1 className="h2">{success ? 'Your movie night is booked.' : 'Your seats are available again.'}</h1><p className="text-secondary">{success ? 'Show this booking at the cinema.' : 'No payment was taken. You can choose seats and try again.'}</p>
    {booking ? <div className="ticket-details text-start mt-4"><div className="d-flex justify-content-between gap-3"><span>Booking ID</span><strong className="text-break">{booking._id || id}</strong></div><div className="d-flex justify-content-between mt-3"><span>Seats</span><strong>{booking.seats?.join(', ') || '—'}</strong></div><div className="d-flex justify-content-between mt-3"><span>Amount</span><strong>₹{Number(booking.amount || 0).toLocaleString('en-IN')}</strong></div>{booking.show?.movie?.title && <div className="d-flex justify-content-between mt-3"><span>Movie</span><strong>{booking.show.movie.title}</strong></div>}{booking.show?.startTime && <div className="d-flex justify-content-between mt-3"><span>Showtime</span><strong>{new Date(booking.show.startTime).toLocaleString()}</strong></div>}</div> : <p className="small text-secondary">Booking reference: {id}</p>}
    <div className="d-flex flex-wrap gap-2 mt-4 justify-content-center"><Link className="btn btn-primary" to="/my-bookings">My bookings</Link><Link className="btn btn-outline-light" to="/">Browse more movies</Link></div>
  </div></main>;
}
