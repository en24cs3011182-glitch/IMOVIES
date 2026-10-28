export default function BookingSummary({ seats, selectedLabels }) {
  const selected = seats.filter((seat) => selectedLabels.includes(seat.label));
  const amount = selected.reduce((sum, seat) => sum + seat.price, 0);
  return <div className="booking-summary">
    <div className="d-flex justify-content-between"><span className="text-secondary">Seats</span><strong>{selected.length ? selected.map(({ label }) => label).join(', ') : 'None selected'}</strong></div>
    {selected.map((seat) => <div className="d-flex justify-content-between small text-secondary mt-2" key={seat.label}><span>{seat.label} · {seat.type}</span><span>?{seat.price}</span></div>)}
    <hr /><div className="d-flex justify-content-between align-items-center"><span>Total</span><strong className="summary-total">?{amount.toLocaleString('en-IN')}</strong></div>
    <small className="text-secondary d-block mt-2">Taxes included. Final amount is confirmed at checkout.</small>
  </div>;
}
