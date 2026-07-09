import React from 'react';
import './ConfirmDialog.css';

// Shared in-app confirmation modal (replaces browser confirm()).
export default function ConfirmDialog({ dialog, onCancel }) {
  if (!dialog) return null;

  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-content" onClick={(e) => e.stopPropagation()}>
        <h3 className="confirm-title">{dialog.title}</h3>
        <p className="confirm-message">{dialog.message}</p>
        <div className="confirm-actions">
          <button className="confirm-btn-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button
            className={dialog.danger ? 'confirm-btn-danger' : 'confirm-btn-primary'}
            onClick={dialog.onConfirm}
          >
            {dialog.confirmLabel || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
