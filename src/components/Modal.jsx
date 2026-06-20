

export default function Modal({ title, message, type, onClose, onConfirm }) {
  return (
    <div className="modal-backdrop no-print" onClick={onClose}>
      <div 
        className="modal-container" 
        onClick={(e) => e.stopPropagation()} /* Prevents closing when clicking inside modal */
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="modal-header">
          <h2 id="modal-title" className="modal-title">{title}</h2>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Fechar">
            ×
          </button>
        </div>
        
        <div className="modal-body">
          <p className="modal-message">{message}</p>
        </div>
        
        <div className="modal-footer">
          {type === 'confirm' ? (
            <>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancelar
              </button>
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={onConfirm}
              >
                Confirmar
              </button>
            </>
          ) : (
            <button type="button" className="btn btn-primary" onClick={onClose}>
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
