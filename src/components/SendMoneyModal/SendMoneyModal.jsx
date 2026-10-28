import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Send, X } from "lucide-react";
import { contacts } from "../../data/seedData";
import { useWallet } from "../../context/WalletContext";
import { formatMoney } from "../../utils/format";
import PersonAvatar from "../PersonAvatar/PersonAvatar";
import SearchBar from "../SearchBar/SearchBar";
import "./SendMoneyModal.css";

export default function SendMoneyModal({ open, onClose, initialRecipient = "", fixedRecipient = false }) {
  const { profile, sendMoney } = useWallet();
  const [recipient, setRecipient] = useState(initialRecipient);
  const [amount, setAmount] = useState("");
  const [pin, setPin] = useState("");
  const [processing, setProcessing] = useState(false);
  const [note, setNote] = useState("");
  const [search, setSearch] = useState(initialRecipient);
  const [step, setStep] = useState("recipient");
  const [error, setError] = useState("");
  const [successAmount, setSuccessAmount] = useState(0);
  useEffect(() => {
    if (open) {
      setRecipient(initialRecipient || "");
      setSearch(initialRecipient || "");
      setStep(fixedRecipient && initialRecipient ? "amount" : "recipient");
      setAmount("");
      setPin("");
      setProcessing(false);
      setNote("");
      setError("");
      setSuccessAmount(0);
    }
  }, [open, initialRecipient, fixedRecipient]);

  useEffect(() => {
    const handlePrefillAmount = (event) => {
      const value = event.detail;
      setAmount(value == null ? "" : String(value));
      setError("");
    };

    window.addEventListener("upay:prefill-send-amount", handlePrefillAmount);
    return () => window.removeEventListener("upay:prefill-send-amount", handlePrefillAmount);
  }, []);

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

    const value = Number(amount);
    if (!amount.trim() || !Number.isFinite(value) || value <= 0) {
      setError("Enter a valid amount.");
      return;
    }

    setPin("");
    setError("");
    setStep("pin");
  };

  const confirmPayment = async (event) => {
    event.preventDefault();

    if (processing) return;

    if (!/^\d{4,6}$/.test(pin)) {
      setError("Enter your 4–6 digit Transaction PIN.");
      return;
    }

    const matchedContact = contacts.find((contact) =>
      contact.name.toLowerCase() === recipient.trim().toLowerCase() ||
      contact.upiId.toLowerCase() === recipient.trim().toLowerCase() ||
      contact.phone === recipient.trim()
    );

    setProcessing(true);
    setError("");

    try {
      const transaction = await sendMoney({
        person: matchedContact?.name || recipient.trim(),
        recipientUpiId: matchedContact?.upiId ||
          (recipient.includes("@") ? recipient.trim() : ""),
        amount,
        note,
        pin,
      });

      setSuccessAmount(Number(transaction?.amount || amount));
      setPin("");
      setStep("success");
    } catch (err) {
      const code = err?.code || "";
      const message = err?.message || "";

      if (code === "INVALID_TRANSACTION_PIN") {
        setError("Incorrect Transaction PIN. Please try again.");
        setPin("");
        setStep("pin");
      } else if (code === "PIN_LOCKED") {
        const minutes = Math.max(
          1,
          Math.ceil(Number(err?.retryAfterSeconds || 900) / 60)
        );
        setError(`Transaction PIN is locked. Try again in ${minutes} minute(s).`);
        setPin("");
        setStep("pin");
      } else if (code === "PIN_NOT_SET") {
        setError("Transaction PIN is not set. Please set it before paying.");
        setPin("");
        setStep("pin");
      } else if (code === "INSUFFICIENT_BALANCE" || /insufficient balance/i.test(message)) {
        setError("Insufficient balance");
        setStep("amount");
      } else if (/4.?6 digit transaction pin/i.test(message)) {
        setError("Enter your 4–6 digit Transaction PIN.");
        setStep("pin");
      } else {
        setError(message || "Payment could not be completed. Check your connection and try again.");
        setStep("pin");
      }
    } finally {
      setProcessing(false);
    }
  };

  const close = () => {
    setStep("recipient"); setRecipient(""); setSearch(""); setAmount(""); setPin(""); setProcessing(false); setNote(""); setError(""); setSuccessAmount(0); onClose();
  };
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && close()}>
    <section className="send-modal" role="dialog" aria-modal="true" aria-label="Send money">
      <header className="send-modal-header">
        {step === "amount" && !fixedRecipient && <button className="icon-button" onClick={() => setStep("recipient")} aria-label="Back"><ArrowLeft size={19}/></button>}
        <div><span className="eyebrow">U-PAY · PAYMENT REVIEW</span><h2>{step === "success" ? "Payment complete" : step === "pin" ? "Authorize payment" : step === "amount" ? "Enter amount" : "Send money"}</h2></div>
        <button className="icon-button close-modal" onClick={close} aria-label="Close"><X size={20}/></button>
      </header>
      {step === "recipient" && !fixedRecipient && <div className="send-modal-body">
        <SearchBar value={search} onChange={(value) => { setSearch(value); setRecipient(value); setError(""); }} placeholder="Name, mobile number or UPI ID"/>
        {matches.length > 0 && <div className="contact-results">{matches.map((contact, index) => <button key={contact.upiId} className="contact-option" onClick={() => choose(contact)}><PersonAvatar name={contact.name} index={index}/><span><strong>{contact.name}</strong><small>{contact.upiId}</small></span><Send size={16}/></button>)}</div>}
        <div className="manual-recipient"><label>Or continue with entered details</label><button className="primary-button full-button" onClick={continueToAmount}>Continue</button></div>
        {error && <p className="form-error">{error}</p>}
      </div>}
      {step === "amount" && <form className="send-modal-body amount-form" onSubmit={submit} noValidate>
        <div className="paying-to"><PersonAvatar name={recipient}/><div><span>Paying to</span><strong>{recipient}</strong></div></div>
        <label className="amount-input-wrap"><span>₹</span><input autoFocus type="number" step="0.01" value={amount} onChange={(e) => { setAmount(e.target.value); setError(""); }} placeholder="0" /><small>INR</small></label>
        <p className="available-balance">Available balance: <strong>{formatMoney(profile.balance)}</strong></p>
        <label className="field-label">Add a note (optional)<input value={note} onChange={(e) => setNote(e.target.value)} placeholder="What's this for?"/></label>
        {error && <p className="form-error">{error}</p>}
        <p className="demo-warning">Simulated payment only — no money will be transferred.</p>
        <button className="primary-button full-button" type="submit">Pay {amount ? formatMoney(amount) : ""} <Send size={17}/></button>
      </form>}
      {step === "pin" && <form className="send-modal-body amount-form" onSubmit={confirmPayment} noValidate>
        <div className="paying-to">
          <PersonAvatar name={recipient}/>
          <div><span>Paying to</span><strong>{recipient}</strong></div>
        </div>
        <div className="pin-payment-summary">
          <span>Payment amount</span>
          <strong>{formatMoney(amount)}</strong>
        </div>
        <label className="field-label pin-field-label" htmlFor="send-transaction-pin">
          Transaction PIN
          <input
            id="send-transaction-pin"
            className="transaction-pin-input"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            pattern="[0-9]{4,6}"
            minLength={4}
            maxLength={6}
            value={pin}
            onChange={(event) => {
              setPin(event.target.value.replace(/\D/g, "").slice(0, 6));
              setError("");
            }}
            placeholder="Enter 4–6 digit PIN"
            aria-describedby="send-pin-help"
            disabled={processing}
            autoFocus
          />
        </label>
        <small id="send-pin-help" className="pin-help-text">
          Your PIN is verified by the U-Pay server.
        </small>
        {error && <p className="form-error" role="alert">{error}</p>}
        <p className="demo-warning">Simulated payment only — no money will be transferred.</p>
        <button className="primary-button full-button" type="submit" disabled={processing}>
          {processing ? "Processing payment…" : `Pay ${formatMoney(amount)}`}
          {!processing && <Send size={17}/>}
        </button>
        <button className="secondary-button full-button pin-back-button" type="button"
          disabled={processing}
          onClick={() => { setError(""); setPin(""); setStep("amount"); }}>
          Back to amount
        </button>
      </form>}
      {step === "success" && <div className="success-state"><CheckCircle2 size={54}/><h3>Payment recorded</h3><p>{formatMoney(successAmount)} simulated payment for <strong>{recipient}</strong> has been recorded.</p><div className="demo-receipt">This transaction is recorded in your U-Pay wallet history. No real money was transferred.</div><button className="primary-button full-button" onClick={close}>Done</button></div>}
    </section>
  </div>;
}
