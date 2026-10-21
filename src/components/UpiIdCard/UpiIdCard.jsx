import { Check, Copy, QrCode } from "lucide-react";
import { useState } from "react";
import { useWallet } from "../../context/WalletContext";
import "./UpiIdCard.css";
export default function UpiIdCard({ onShowQr }) {
  const { profile } = useWallet();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(profile.upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Copy your UPI ID:", profile.upiId);
    }
  };
  return <section className="upi-id-card">
    <div className="upi-id-copy">
      <div className="upi-id-label">YOUR UPI ID</div>
      <div className="upi-id-value">{profile.upiId}</div>
    </div>
    <button className="copy-upi-button" onClick={copy}><span>{copied ? <Check size={16}/> : <Copy size={16}/>}</span>{copied ? "Copied" : "Copy"}</button>
    <button className="upi-qr-mini" onClick={onShowQr} aria-label="Show my QR"><QrCode size={19}/></button>
  </section>;
}
