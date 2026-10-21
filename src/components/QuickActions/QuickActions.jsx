import { Camera, QrCode } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./QuickActions.css";
export default function QuickActions({ onShowQr }) {
  const navigate = useNavigate();
  return <div className="quick-actions">
    <button className="quick-action" onClick={() => navigate("/upi")}>
      <span className="quick-action-icon scanner"><Camera size={23}/></span>
      <span><strong>Scan any QR</strong><small>Pay with camera</small></span>
    </button>
    <button className="quick-action" onClick={onShowQr}>
      <span className="quick-action-icon my-qr"><QrCode size={23}/></span>
      <span><strong>My QR code</strong><small>Receive money</small></span>
    </button>
  </div>;
}
