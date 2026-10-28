import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';
import api, { API_HOST, getErrorMessage } from '../api/http';
import { clearHold, setHold, setSelectedSeats } from '../features/booking/bookingSlice';
import SeatMap from '../components/SeatMap';
import BookingSummary from '../components/BookingSummary';
import HoldCountdown from '../components/HoldCountdown';
import { Loader } from '../components/Feedback';

export default function SeatSelectionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { token, user } = useSelector((state) => state.auth);
  const selected = useSelector((state) => state.booking.selectedSeats);
  const [show, setShow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [releaseBusy, setReleaseBusy] = useState(false);
  const [holdUntil, setHoldUntil] = useState(null);
  const [hasHold, setHasHold] = useState(false);
  const holdRef = useRef(false);
  const proceedRef = useRef(false);
  const selectedRef = useRef(selected);
  const releaseInFlightRef = useRef(false);
  const holdRequestRef = useRef(false);
  const mountedRef = useRef(false);

  useEffect(() => { selectedRef.current = selected; }, [selected]);

  const refreshShow = useCallback(async () => {
    const { data } = await api.get(`/shows/${id}`);
    setShow(data.data);
    return data.data;
  }, [id]);

  useEffect(() => {
    let active = true;
    mountedRef.current = true;
    dispatch(clearHold());
    setLoading(true);
    api.get(`/shows/${id}`).then(({ data }) => {
      if (!active) return;
      const current = data.data;
      setShow(current);
      const mine = current.seats.filter((seat) => seat.status === 'held' && String(seat.heldBy) === String(user?._id) && new Date(seat.heldUntil) > new Date()).slice(0, 6);
      if (mine.length) {
        const labels = mine.map(({ label }) => label);
        selectedRef.current = labels;
        dispatch(setSelectedSeats(labels));
        dispatch(setHold({ showId: id, seats: labels, until: Math.min(...mine.map(({ heldUntil }) => new Date(heldUntil).getTime())) }));
        setHasHold(true);
        holdRef.current = true;
        setHoldUntil(Math.min(...mine.map(({ heldUntil }) => new Date(heldUntil).getTime())));
      }
    }).catch((error) => toast.error(getErrorMessage(error))).finally(() => { if (active) setLoading(false); });

    const socket = io(API_HOST, { auth: { token }, transports: ['websocket'] });
    let connectedOnce = false;
    const join = async () => {
      socket.emit('show:join', { showId: id });
      if (connectedOnce) {
        try { await refreshShow(); } catch { /* a later reconnect will try again */ }
      }
      connectedOnce = true;
    };
    socket.on('connect', join);
    socket.on('seats:updated', async (event) => {
      if (String(event.showId) !== String(id)) return;
      try {
        const latest = await refreshShow();
        const validSelection = selectedRef.current.filter((label) => {
          const seat = latest.seats.find((item) => item.label === label);
          return seat && (seat.status === 'available' || (seat.status === 'held' && String(seat.heldBy) === String(user?._id)));
        });
        if (validSelection.length !== selectedRef.current.length) {
          dispatch(setSelectedSeats(validSelection));
          toast.info('A selected seat is no longer available.');
        }
      } catch { /* the next socket update or reconnect will refresh the map */ }
    });

    return () => {
      active = false;
      mountedRef.current = false;
      socket.emit('show:leave', { showId: id });
      socket.disconnect();
      if (holdRef.current && !holdRequestRef.current && !proceedRef.current && !releaseInFlightRef.current) {
        releaseInFlightRef.current = true;
        api.delete(`/shows/${id}/hold`, { data: { seats: selectedRef.current } }).catch(() => {});
      }
    };
  }, [id, token, user?._id, dispatch, refreshShow]);

  async function releaseSeatLabels(labels, { announce = true } = {}) {
    if (!labels.length || releaseInFlightRef.current) return false;
    releaseInFlightRef.current = true;
    setReleaseBusy(true);
    try {
      await api.delete(`/shows/${id}/hold`, { data: { seats: labels } });
      const remaining = selectedRef.current.filter((label) => !labels.includes(label));
      selectedRef.current = remaining;
      dispatch(setSelectedSeats(remaining));
      setShow((current) => current && ({ ...current, seats: current.seats.map((seat) => labels.includes(seat.label) ? { ...seat, status: 'available', heldBy: null, heldUntil: null } : seat) }));
      holdRef.current = remaining.length > 0;
      setHasHold(remaining.length > 0);
      if (remaining.length) dispatch(setHold({ showId: id, seats: remaining, until: holdUntil }));
      else {
        dispatch(clearHold());
        setHoldUntil(null);
      }
      if (announce) toast.success('Seats released');
      await refreshShow().catch(() => {});
      return true;
    } catch (error) {
      // The shared axios interceptor displays the server error toast.
      return false;
    } finally {
      releaseInFlightRef.current = false;
      setReleaseBusy(false);
    }
  }

  const toggleSeat = (seat) => {
    const isMine = seat.status === 'held' && String(seat.heldBy) === String(user?._id);
    if (seat.status !== 'available' && !isMine) return;
    if (selected.includes(seat.label)) {
      if (hasHold) void releaseSeatLabels([seat.label], { announce: false });
      else dispatch(setSelectedSeats(selected.filter((label) => label !== seat.label)));
    }
    else if (selected.length >= 6) toast.info('Choose up to 6 seats.');
    else dispatch(setSelectedSeats([...selected, seat.label]));
  };

  async function confirmHold() {
    if (!selected.length || working) return;
    setWorking(true);
    try {
      selectedRef.current = [...selected];
      const mine = show.seats.filter((seat) => selected.includes(seat.label) && seat.status === 'held' && String(seat.heldBy) === String(user?._id));
      if (mine.length === selected.length) {
        holdRef.current = true;
        setHasHold(true);
        setHoldUntil(Math.min(...mine.map(({ heldUntil }) => new Date(heldUntil).getTime())));
      } else {
        holdRequestRef.current = true;
        const { data } = await api.post(`/shows/${id}/hold`, { seats: selected });
        holdRequestRef.current = false;
        if (!mountedRef.current) {
          await api.delete(`/shows/${id}/hold`, { data: { seats: selected } }).catch(() => {});
          return;
        }
        setShow((current) => ({ ...current, seats: current.seats.map((seat) => selected.includes(seat.label) ? { ...seat, status: 'held', heldBy: user._id } : seat) }));
        holdRef.current = true;
        selectedRef.current = [...selected];
        setHasHold(true);
        const until = Date.parse(data.data.heldUntil) || Date.now() + 5 * 60 * 1000;
        setHoldUntil(until);
        dispatch(setHold({ showId: id, seats: selected, until }));
        toast.success('Seats are held for 5 minutes.');
      }
    } catch {
      if (mountedRef.current) await refreshShow().catch(() => {});
    } finally {
      holdRequestRef.current = false;
      if (mountedRef.current) setWorking(false);
    }
  }

  const expireHold = useCallback(async () => {
    if (!holdRef.current || releaseInFlightRef.current) return;
    holdRef.current = false;
    setHasHold(false);
    releaseInFlightRef.current = true;
    try { await api.delete(`/shows/${id}/hold`, { data: { seats: selectedRef.current } }); } catch { /* the hold may already have expired */ }
    releaseInFlightRef.current = false;
    dispatch(clearHold());
    setHoldUntil(null);
    await refreshShow().catch(() => {});
    toast.info('Hold expired. Choose your seats again.');
  }, [dispatch, id, refreshShow]);

  async function checkout() {
    if (releaseBusy || working) return;
    proceedRef.current = true;
    navigate('/checkout', { state: { showId: id, seats: selected, show, heldUntil: holdUntil } });
  }

  if (loading) return <div className="container py-5"><Loader label="Loading seat map…" /></div>;
  if (!show) return <div className="container py-5"><p className="text-secondary">Show unavailable.</p><Link to="/">Back to movies</Link></div>;

  return <main className="container py-4 py-lg-5">
    <Link to={`/movies/${show.movie?._id}`} className="back-link">← {show.movie?.title || 'Movie'}</Link>
    <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-end gap-3 my-4">
      <div><p className="eyebrow mb-2">PICK YOUR SEATS</p><h1 className="h2 mb-1">{show.movie?.title}</h1><p className="text-secondary mb-0">{show.theatre?.name} · {new Date(show.startTime).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</p></div>
      {hasHold && holdUntil && <div className="d-flex align-items-center gap-2 flex-wrap"><HoldCountdown until={holdUntil} onExpire={expireHold} /><button type="button" className="btn btn-outline-light btn-sm" disabled={releaseBusy || working} onClick={() => void releaseSeatLabels(selectedRef.current)}>{releaseBusy ? 'Releasing…' : 'Release seats'}</button></div>}
    </div>
    <div className="row g-4">
      <div className="col-lg-8"><div className="seat-panel"><SeatMap seats={show.seats} selected={selected} onToggle={toggleSeat} userId={user?._id} /></div></div>
      <aside className="col-lg-4"><div className="checkout-card"><h2 className="h5">Your selection</h2><p className="small text-secondary">Choose up to six seats for this show.</p><BookingSummary seats={show.seats} selectedLabels={selected} />
        {!hasHold ? <button className="btn btn-primary w-100 mt-3" disabled={!selected.length || working || releaseBusy} onClick={confirmHold}>{working ? 'Holding seats…' : 'Continue'}</button> : <button className="btn btn-primary w-100 mt-3" disabled={!selected.length || working || releaseBusy} onClick={checkout}>Continue to checkout</button>}
        <p className="small text-secondary mt-3 mb-0">Seat availability updates live while you choose.</p>
      </div></aside>
    </div>
  </main>;
}
