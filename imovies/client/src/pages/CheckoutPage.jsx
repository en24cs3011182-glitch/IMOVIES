import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api, { getErrorMessage } from '../api/http';
import { useDispatch } from 'react-redux';
import { clearHold } from '../features/booking/bookingSlice';
import HoldCountdown from '../components/HoldCountdown';
import { Loader } from '../components/Feedback';

export default function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const selection = location.state;
  const initialized = useRef(false);
  const expiryStarted = useRef(false);
  const releaseTimer = useRef(null);
  const releaseInFlight = useRef(false);
  const holdActive = useRef(Boolean(selection?.showId && selection?.seats?.length));
  const paymentCompleted = useRef(false);
  const [checkout, setCheckout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [releaseBusy, setReleaseBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!selection?.showId || !selection?.seats?.length || initialized.current) { setLoading(false); return; }
    initialized.current = true;
    api.post('/payments/initiate', { showId: selection.showId, seats: selection.seats })
      .then(({ data }) => setCheckout(data.data))
      .catch((requestError) => setError(getErrorMessage(requestError)))
      .finally(() => setLoading(false));
  }, [selection]);

  useEffect(() => {
    holdActive.current = Boolean(selection?.showId && selection?.seats?.length);
    return () => {
      // Defer one tick so React StrictMode's development remount does not release the hold.
      releaseTimer.current = setTimeout(() => {
        if (!holdActive.current || paymentCompleted.current || releaseInFlight.current) return;
        holdActive.current = false;
        releaseInFlight.current = true;
        api.delete(`/shows/${selection.showId}/hold`, { data: { seats: selection.seats } })
          .catch(() => {})
          .finally(() => { releaseInFlight.current = false; });
        dispatch(clearHold());
      }, 0);
    };
  }, [dispatch, selection?.showId]);

  useEffect(() => {
    if (releaseTimer.current) clearTimeout(releaseTimer.current);
  });

  async function releaseAndReturn() {
    if (!selection?.showId || !selection?.seats?.length || releaseBusy || busy || releaseInFlight.current) return;
    releaseInFlight.current = true;
    setReleaseBusy(true);
    try {
      await api.delete(`/shows/${selection.showId}/hold`, { data: { seats: selection.seats } });
      holdActive.current = false;
      dispatch(clearHold());
      toast.success('Seats released');
      navigate(`/shows/${selection.showId}`, { replace: true });
    } catch (requestError) {
      // The shared axios interceptor displays the server error toast.
    } finally {
      releaseInFlight.current = false;
      setReleaseBusy(false);
    }
  }

  const expireHold = useCallback(async () => {
    if (expiryStarted.current || !selection?.showId) return;
    expiryStarted.current = true;
    holdActive.current = false;
    if (releaseInFlight.current) return;
    releaseInFlight.current = true;
    try { await api.delete(`/shows/${selection.showId}/hold`, { data: { seats: selection.seats } }); } catch { /* the hold may already have expired */ }
    releaseInFlight.current = false;
    dispatch(clearHold());
    toast.info('Hold expired. Choose your seats again.');
    navigate(`/shows/${selection.showId}`, { replace: true });
  }, [dispatch, navigate, selection]);

  async function pay(result) {
    if (!checkout || busy) return;
    setBusy(true);
    setError('');
    try {
      const paymentId = checkout.paymentId || checkout.payment?._id;
      const { data } = await api.post('/payments/verify', { paymentId, result });
      holdActive.current = false;
      paymentCompleted.current = data.data.payment.status === 'success';
      dispatch(clearHold());
      const paymentData = data.data;
      if (paymentData.payment.status !== 'success') {
        toast.error('Payment failed. Your seats have been released.');
        navigate(`/shows/${selection.showId}`, { replace: true });
        return;
      }
      toast.success('Payment complete. Your seats are booked.');
      navigate(`/booking/${paymentData.booking._id}/confirmation`, { state: paymentData, replace: true });
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="container py-5"><Loader label="Preparing secure checkout…" /></div>;
  if (!selection?.showId || !selection?.seats?.length) return <main className="container py-5"><div className="empty-state"><h1 className="h3">Your seat selection has expired</h1><p className="text-secondary">Choose a show and seats before checking out.</p><Link className="btn btn-primary" to="/">Browse movies</Link></div></main>;
  if (error && !checkout) return <main className="container py-5"><div className="alert alert-danger">{error}</div><Link className="btn btn-outline-light" to={`/shows/${selection.showId}`}>Return to seat map</Link></main>;

  const amount = checkout?.amount ?? checkout?.booking?.amount ?? 0;
  return <main className="container py-4 py-lg-5">
    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
      <button type="button" className="btn btn-outline-light" disabled={releaseBusy || busy} onClick={() => void releaseAndReturn()}>← Back / Cancel</button>
      {selection.heldUntil && <HoldCountdown until={selection.heldUntil} onExpire={expireHold} />}
    </div>
    <div className="checkout-page row justify-content-center g-4 mt-2">
      <div className="col-lg-7"><p className="eyebrow">MOCK PAYMENT</p><h1 className="h2 mb-2">Complete your booking</h1><p className="text-secondary">This demo simulates a payment result. No card details are collected.</p>
        {error && <div className="alert alert-danger">{error}</div>}
        <section className="checkout-card mt-4" aria-label="Payment simulation">
          <button type="button" className="btn btn-success btn-lg w-100" disabled={busy || releaseBusy || !checkout} onClick={() => pay('success')}>{busy ? 'Processing…' : `Pay success · ₹${Number(amount).toLocaleString('en-IN')}`}</button>
          <button type="button" className="btn btn-outline-danger btn-lg w-100 mt-3" disabled={busy || releaseBusy || !checkout} onClick={() => pay('failure')}>Simulate failure</button>
          <p className="tiny-note text-center mt-3 mb-0">Protected demo checkout · Total set by the server</p>
        </section>
      </div>
      <aside className="col-lg-4"><div className="checkout-card booking-summary-card"><p className="eyebrow">ORDER SUMMARY</p><h2 className="h5">{selection.show?.movie?.title || 'Cinema booking'}</h2><p className="small text-secondary">{selection.show?.theatre?.name} · {selection.show?.startTime ? new Date(selection.show.startTime).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : ''}</p><hr /><div className="d-flex justify-content-between"><span className="text-secondary">Seats</span><strong>{selection.seats.join(', ')}</strong></div><div className="d-flex justify-content-between mt-3"><span className="text-secondary">Total</span><strong className="summary-total">₹{Number(amount).toLocaleString('en-IN')}</strong></div></div></aside>
    </div>
  </main>;
}
