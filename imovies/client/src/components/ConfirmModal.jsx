import Modal from './Modal';

export default function ConfirmModal({ open, title = 'Please confirm', message, confirmLabel = 'Confirm', busy = false, onConfirm, onCancel, danger = true }) {
  return <Modal open={open} title={title} onClose={onCancel}>
    <p className="text-secondary">{message}</p>
    <div className="d-flex justify-content-end gap-2 mt-4">
      <button type="button" className="btn btn-outline-light" disabled={busy} onClick={onCancel}>Keep it</button>
      <button type="button" className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} disabled={busy} onClick={onConfirm}>{busy ? 'Please wait…' : confirmLabel}</button>
    </div>
  </Modal>;
}
