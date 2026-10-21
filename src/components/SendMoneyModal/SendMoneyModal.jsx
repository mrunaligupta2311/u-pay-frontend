import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Send, X } from "lucide-react";
import { contacts } from "../../data/seedData";
import { useWallet } from "../../context/WalletContext";
import { formatMoney } from "../../utils/format";
import PersonAvatar from "../PersonAvatar/PersonAvatar";
import SearchBar from "../SearchBar/SearchBar";
import "./SendMoneyModal.css";

export default function SendMoneyModal({ open, onClose, initialRecipient = "" }) {
  const { profile, sendMoney } = useWallet();
  const [recipient, setRecipient] = useState(initialRecipient);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [search, setSearch] = useState(initialRecipient);
  const [step, setStep] = useState("recipient");
  const [error, setError] = useState("");
  const [successAmount, setSuccessAmount] = useState(0);
  useEffect(() => {
    if (open) { setRecipient(initialRecipient || ""); setSearch(initialRecipient || ""); setStep("recipient"); setError(""); }
  }, [open, initialRecipient]);
  const matches = useMemo(() => contacts.filter((contact) =>
    `${contact.name} ${contact.phone} ${contact.upiId}`.toLowerCase().includes(search.toLowerCase())
  ), [search]);

  if (!open) return null;
  const choose = (contact) => { setRecipient(contact.name); setSearch(contact.name); setStep("amount"); setError(""); };
  const continueToAmount = () => {
    if (!recipient.trim()) { setError("Enter a name, mobile number or UPI ID."); return; }
    setStep("amount"); setError("");
  };
  const submit = (event) => {
    event.preventDefault();
    try {
      sendMoney({ person: recipient, amount, note });
      setSuccessAmount(Number(amount));
      setStep("success");
      setError("");
    } catch (err) { setError(err.message); }
  };
  const close = () => {
    setStep("recipient"); setRecipient(""); setSearch(""); setAmount(""); setNote(""); setError(""); onClose();
  };
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && close()}>
    <section className="send-modal" role="dialog" aria-modal="true" aria-label="Send money">
      <header className="send-modal-header">
        {step === "amount" && <button className="icon-button" onClick={() => setStep("recipient")} aria-label="Back"><ArrowLeft size={19}/></button>}
        <div><span className="eyebrow">U-PAY · DEMO</span><h2>{step === "success" ? "Payment complete" : step === "amount" ? "Enter amount" : "Send money"}</h2></div>
        <button className="icon-button close-modal" onClick={close} aria-label="Close"><X size={20}/></button>
      </header>
      {step === "recipient" && <div className="send-modal-body">
        <SearchBar value={search} onChange={(value) => { setSearch(value); setRecipient(value); setError(""); }} placeholder="Name, mobile number or UPI ID"/>
        {matches.length > 0 && <div className="contact-results">{matches.map((contact, index) => <button key={contact.upiId} className="contact-option" onClick={() => choose(contact)}><PersonAvatar name={contact.name} index={index}/><span><strong>{contact.name}</strong><small>{contact.upiId}</small></span><Send size={16}/></button>)}</div>}
        <div className="manual-recipient"><label>Or continue with entered details</label><button className="primary-button full-button" onClick={continueToAmount}>Continue</button></div>
        {error && <p className="form-error">{error}</p>}
      </div>}
      {step === "amount" && <form className="send-modal-body amount-form" onSubmit={submit}>
        <div className="paying-to"><PersonAvatar name={recipient}/><div><span>Paying to</span><strong>{recipient}</strong></div></div>
        <label className="amount-input-wrap"><span>₹</span><input autoFocus type="number" min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" required/><small>INR</small></label>
        <p className="available-balance">Available demo balance: <strong>{formatMoney(profile.balance)}</strong></p>
        <label className="field-label">Add a note (optional)<input value={note} onChange={(e) => setNote(e.target.value)} placeholder="What's this for?"/></label>
        {error && <p className="form-error">{error}</p>}
        <p className="demo-warning">Demo only — no real money will be transferred.</p>
        <button className="primary-button full-button" type="submit">Pay {amount ? formatMoney(amount) : ""} <Send size={17}/></button>
      </form>}
      {step === "success" && <div className="success-state"><CheckCircle2 size={54}/><h3>{formatMoney(successAmount)} sent</h3><p>Demo transaction recorded for <strong>{recipient}</strong>.</p><div className="demo-receipt">Your balance has been updated locally. This is not a real bank transaction.</div><button className="primary-button full-button" onClick={close}>Done</button></div>}
    </section>
  </div>;
}
