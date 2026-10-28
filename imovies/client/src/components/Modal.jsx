import { useEffect } from 'react';

export default function Modal({ open, title, onClose, children, size = '' }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKeyDown);
    document.body.classList.add('modal-open');
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.classList.remove('modal-open');
    };
  }, [open, onClose]);

  if (!open) return null;
  return <div className="app-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className={`app-modal ${size}`} role="dialog" aria-modal="true" aria-label={title}>
      <div className="app-modal-header"><h2 className="h5 mb-0">{title}</h2><button type="button" className="btn-close btn-close-white" aria-label="Close" onClick={onClose} /></div>
      <div className="app-modal-body">{children}</div>
    </section>
  </div>;
}
