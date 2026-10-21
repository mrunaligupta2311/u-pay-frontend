import { Building2, CheckCircle2, Eye, EyeOff, Landmark, ShieldCheck, Wallet } from "lucide-react";
import { useState } from "react";
import { useWallet } from "../../context/WalletContext";
import { formatMoney } from "../../utils/format";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog";
import Toast from "../../components/Toast/Toast";
import "./BalancePage.css";
export default function BalancePage() {
  const { profile, updateProfile, transactions, resetDemo, addDemoFunds } = useWallet();
  const [showBalance, setShowBalance] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [fundAmount, setFundAmount] = useState("1000");
  const sent = transactions.filter((item) => item.type === "sent").reduce((sum, item) => sum + Number(item.amount), 0);
  const received = transactions.filter((item) => item.type === "received").reduce((sum, item) => sum + Number(item.amount), 0);
  const handleAddDemoFunds = (event) => {
    event.preventDefault();
    try {
      addDemoFunds(fundAmount);
      setToast({ type: "success", message: "Demo funds added to your local wallet." });
      setFundAmount("1000");
    } catch (error) {
      setToast({ type: "error", message: error.message || "Could not add demo funds." });
    }
  };
  const removeAccount = () => {
    updateProfile({ bankLinked: false, bankName: "" });
    setConfirmOpen(false);
    setToast({ type: "success", message: "Demo bank account removed." });
  };
  const restoreAccount = () => {
    updateProfile({ bankLinked: true, bankName: "Bank of Baroda" });
    setToast({ type: "success", message: "Bank of Baroda added to demo profile." });
  };
  return <div className="balance-page page-enter">
    <div className="balance-page-intro"><span className="eyebrow">WALLET OVERVIEW</span><h1>Your balance</h1><p>Manage your linked demo bank account.</p></div>
    <section className="balance-hero">
      <div className="balance-hero-top"><span className="balance-hero-icon"><Wallet size={22}/></span><span className="balance-account-status"><span/> {profile.bankLinked ? "Linked account" : "Not linked"}</span></div>
      <span className="balance-caption">Available balance</span>
      <div className="balance-amount-line"><strong>{showBalance && profile.bankLinked ? formatMoney(profile.balance) : "₹ ••••••"}</strong><button onClick={() => setShowBalance((value) => !value)} aria-label={showBalance ? "Hide balance" : "Show balance"}>{showBalance ? <EyeOff size={19}/> : <Eye size={19}/>}</button></div>
      <div className="balance-owner">{profile.name}</div>
      <div className="balance-hero-bottom"><span><Landmark size={16}/>{profile.bankLinked ? profile.bankName : "No bank account"}</span><span>•••• •••• ••••</span></div>
    </section>
    <section className="bank-details-card">
      <div className="bank-details-heading"><span className="bank-icon"><Building2 size={20}/></span><div><h2>Linked bank account</h2><p>Demo account details</p></div>{profile.bankLinked && <CheckCircle2 size={19} className="linked-check"/>}</div>
      {profile.bankLinked ? <><div className="bank-detail-row"><span>Account holder</span><strong>{profile.name}</strong></div><div className="bank-detail-row"><span>Bank</span><strong>{profile.bankName}</strong></div><div className="bank-detail-row"><span>UPI ID</span><strong>{profile.upiId}</strong></div><button className="remove-bank-button" onClick={() => setConfirmOpen(true)}>Remove bank account</button></> : <div className="add-bank-empty"><p>Your demo bank account has been removed.</p><button className="primary-button" onClick={restoreAccount}>Add Bank of Baroda</button></div>}
    </section>
    <section className="balance-summary-grid"><div><span>Sent in history</span><strong>{formatMoney(sent)}</strong></div><div><span>Received in history</span><strong>{formatMoney(received)}</strong></div></section>
    <section className="demo-funds-card">
      <div className="demo-funds-heading">
        <span className="demo-funds-icon"><Wallet size={19}/></span>
        <div><h2>Add demo funds</h2><p>Test payment flows using simulated money only.</p></div>
      </div>
      <form className="demo-funds-form" onSubmit={handleAddDemoFunds}>
        <label htmlFor="demo-fund-amount">Amount (₹)</label>
        <div className="demo-funds-controls">
          <input id="demo-fund-amount" type="number" min="1" max="100000" step="1" value={fundAmount} onChange={(event) => setFundAmount(event.target.value)} required />
          <button className="primary-button" type="submit">Add funds</button>
        </div>
        <p>Limit: ₹1 to ₹1,00,000 per addition. No real money is added.</p>
      </form>
    </section>
    <div className="balance-security-note"><ShieldCheck size={18}/><span>Balance and bank information are demo data stored in your browser. This app does not access your real bank.</span></div>
    <button className="reset-demo-button" onClick={resetDemo}>Reset demo data</button>
    <ConfirmDialog open={confirmOpen} title="Remove bank account?" message="You will no longer be able to simulate sending money until you add a bank account again. This does not affect a real bank account." confirmLabel="Remove account" danger onConfirm={removeAccount} onCancel={() => setConfirmOpen(false)}/>
    <Toast toast={toast} onClose={() => setToast(null)}/>
  </div>;
}
