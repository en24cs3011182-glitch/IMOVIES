export default function SeatMap({ seats, selected, onToggle, userId }) {
  const rows = [...new Set(seats.map((seat) => seat.row))].sort((a, b) => a.localeCompare(b));
  const isMine = (seat) => seat.status === 'held' && seat.heldBy && String(seat.heldBy) === String(userId);
  return <div className="seat-map-wrap">
    <div className="screen-glow" /><div className="screen-bar">SCREEN THIS WAY</div>
    <div className="seat-grid" role="group" aria-label="Choose seats">
      {rows.map((row) => <div className="seat-row" key={row}><span className="row-label">{row}</span><div className="seat-row-buttons">
        {seats.filter((seat) => seat.row === row).sort((a, b) => a.number - b.number).map((seat) => {
          const mine = isMine(seat);
          const active = seat.status === 'available' || mine;
          const chosen = selected.includes(seat.label);
          const state = chosen ? 'selected' : seat.status;
          const statusLabel = mine ? 'held by you' : seat.status === 'held' ? 'held by another user' : state;
          const label = `${seat.label}, ${seat.type} seat, ${statusLabel}`;
          return <button key={seat.label} type="button" className={`seat-button seat-${state}${seat.type === 'premium' ? ' seat-premium' : ''}`} disabled={!active} aria-label={label} aria-pressed={chosen} title={`${seat.label} · ${seat.type} · ?${seat.price}`} onClick={() => onToggle(seat)}>{seat.number}</button>;
        })}
      </div><span className="row-label">{row}</span></div>)}
    </div>
    <div className="seat-legend" aria-label="Seat legend"><span><i className="legend-seat legend-available" />Available</span><span><i className="legend-seat legend-selected" />Selected</span><span><i className="legend-seat legend-held" />Held</span><span><i className="legend-seat legend-booked" />Booked</span><span><i className="legend-seat legend-premium" />Premium</span></div>
  </div>;
}
