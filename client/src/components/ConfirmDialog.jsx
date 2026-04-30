import React from 'react';

export default function ConfirmDialog({ message = 'Are you sure?', detail, onConfirm, onCancel }) {
  return (
    <div className="overlay" onClick={onCancel}>
      <div className="modal confirm-dialog" onClick={e => e.stopPropagation()}>
        <h3>{message}</h3>
        {detail && <p>{detail}</p>}
        <div className="confirm-actions">
          <button className="btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn-primary" style={{ background: '#c0392b' }} onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}
