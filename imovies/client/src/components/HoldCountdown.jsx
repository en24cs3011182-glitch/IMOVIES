import { useEffect, useState } from 'react';
export default function HoldCountdown({ until, onExpire }) {
  const [seconds, setSeconds] = useState(() => Math.max(0, Math.ceil((until - Date.now()) / 1000)));
  useEffect(() => {
    const tick = () => {
      const left = Math.max(0, Math.ceil((until - Date.now()) / 1000));
      setSeconds(left);
      if (left === 0) onExpire();
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [until, onExpire]);
  const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
  const secs = String(seconds % 60).padStart(2, '0');
  return <div className="hold-countdown" role="timer" aria-live="polite"><span className="countdown-dot" /> Seats held for <strong>{mins}:{secs}</strong></div>;
}
