import React from 'react';
import ReactDOM from 'react-dom';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  description,
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  return ReactDOM.createPortal(
    <div className="dialog-overlay" onClick={onCancel}>
      <div className="dialog-box" onClick={(e) => e.stopPropagation()}>
        <h3 className="dialog-title">{title}</h3>
        <p className="dialog-description">{description}</p>
        <div className="dialog-actions">
          <button className="dialog-btn-cancel" onClick={onCancel}>Cancel</button>
          <button className="dialog-btn-confirm" onClick={onConfirm}>Clear</button>
        </div>
      </div>
    </div>,
    document.body
  );
};
