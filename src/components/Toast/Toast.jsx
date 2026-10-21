import { CheckCircle2, Info, X } from "lucide-react";
import "./Toast.css";
export default function Toast({ toast, onClose }) {
  if (!toast) return null;
  const Icon = toast.type === "success" ? CheckCircle2 : Info;
  return <div className={`toast-message ${toast.type || ""}`} role="status"><Icon size={18}/><span>{toast.message}</span><button onClick={onClose} aria-label="Dismiss"><X size={15}/></button></div>;
}
