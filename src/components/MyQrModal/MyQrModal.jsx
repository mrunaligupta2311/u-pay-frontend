import { Download, X } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { useRef } from "react";
import { useWallet } from "../../context/WalletContext";
import "./MyQrModal.css";
export default function MyQrModal({ open, onClose }) {
  const { profile } = useWallet();
  const canvasRef = useRef(null);
  if (!open) return null;
  const download = () => {
    const canvas = document.querySelector(".my-qr-canvas canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "mrunali-gupta-upi-qr.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };
  return <div className="my-qr-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
    <section className="my-qr-modal" role="dialog" aria-modal="true" aria-label="My QR code">
      <button className="my-qr-close" onClick={onClose} aria-label="Close"><X size={20}/></button>
      <div className="my-qr-heading"><span className="eyebrow">RECEIVE MONEY</span><h2>Your UPI QR</h2><p>Let someone scan this code to identify your demo UPI ID.</p></div>
      <div className="my-qr-canvas" ref={canvasRef}><QRCodeCanvas value={`upi://pay?pa=${profile.upiId}&pn=${encodeURIComponent(profile.name)}&cu=INR`} size={220} level="H" includeMargin /></div>
      <strong className="my-qr-name">{profile.name}</strong><span className="my-qr-id">{profile.upiId}</span>
      <button className="primary-button full-button" onClick={download}><Download size={17}/> Download QR</button>
      <small className="my-qr-note">Demo QR only. It does not initiate real payments.</small>
    </section>
  </div>;
}
