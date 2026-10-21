import { AlertTriangle } from "lucide-react";
import "./ConfirmDialog.css";
export default function ConfirmDialog({ open, title, message, confirmLabel = "Confirm", danger = false, onConfirm, onCancel }) {
  if (!open) return null;
  return <div className="confirm-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
    <section className="confirm-dialog" role="alertdialog" aria-modal="true">
      <div className={`confirm-icon ${danger ? "danger" : ""}`}><AlertTriangle size={23}/></div>
      <h2>{title}</h2><p>{message}</p>
      <div className="confirm-actions"><button className="secondary-button" onClick={onCancel}>Cancel</button><button className={`primary-button ${danger ? "danger-button" : ""}`} onClick={onConfirm}>{confirmLabel}</button></div>
    </section>
  </div>;
}
