import { useState } from "react";
import {
  ArrowLeft, ArrowRight, BadgeCheck, CheckCircle2, CircleAlert,
  CreditCard, QrCode, ShieldCheck,
  Smartphone, Sparkles, UserRound, Wallet, X
} from "lucide-react";
import { useWallet } from "../../context/WalletContext";
import { formatMoney } from "../../utils/format";
import QRScanner from "../../components/QRScanner/QRScanner";
import PersonAvatar from "../../components/PersonAvatar/PersonAvatar";
import { contacts } from "../../data/seedData";
import "./UpiPage.css";

function parseUpiQr(raw) {
  const value = String(raw || "").trim();
  if (!value) throw new Error("This QR code is empty.");

  let params;
  let parsedUrl;

  try {
    parsedUrl = new URL(value);
    params = parsedUrl.searchParams;
  } catch {
    params = new URLSearchParams();
  }

  const scheme = parsedUrl?.protocol?.toLowerCase() || "";
  const host = parsedUrl?.hostname?.toLowerCase() || "";
  const isUpiLink =
    scheme === "upi:" ||
    scheme === "paytm:" ||
    scheme === "phonepe:" ||
    (scheme === "https:" && /upi|pay|payment/i.test(host + parsedUrl?.pathname));

  const pa = params.get("pa") || "";
  const pn = params.get("pn") || "";
  const amount = params.get("am") || "";
  const note = params.get("tn") || "";
  const validUpiId = /^[\w.-]{2,256}@[a-zA-Z0-9.-]{2,64}$/.test(pa);

  if (!isUpiLink || !validUpiId) {
    throw new Error("This doesn't look like a supported UPI payment QR. Try a valid UPI QR image.");
  }

  if (amount && (!Number.isFinite(Number(amount)) || Number(amount) <= 0)) {
    throw new Error("The QR contains an invalid payment amount.");
  }

  return {
    upiId: pa,
    name: pn || pa,
    amount,
    note,
    raw: value
  };
}

function findDemoRecipient(payment) {
  const id = payment.upiId.toLowerCase();
  return contacts.find((contact) =>
    contact.upiId.toLowerCase() === id
  ) || null;
}

export default function UpiPage() {
  const { profile, sendMoney } = useWallet();
  const [payment, setPayment] = useState(null);
  const [step, setStep] = useState("scan");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [transaction, setTransaction] = useState(null);
  const [processing, setProcessing] = useState(false);

  const handleQrResult = (raw) => {
    try {
      const parsed = parseUpiQr(raw);
      const known = findDemoRecipient(parsed);
      setPayment({
        ...parsed,
        name: known?.name || parsed.name,
        phone: known?.phone || "",
        known
      });
      setAmount(parsed.amount || "");
      setNote(parsed.note || "");
      setError("");
      setTransaction(null);
      setStep("recipient");
    } catch (err) {
      setError(err.message || "We couldn't read this UPI QR.");
    }
  };

  const resetFlow = () => {
    setStep("scan");
    setPayment(null);
    setAmount("");
    setNote("");
    setError("");
    setTransaction(null);
    setProcessing(false);
  };

  const continueToReview = (event) => {
    event.preventDefault();
    if (!payment) return;
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setError("Enter a valid payment amount.");
      return;
    }
    if (!profile.bankLinked) {
      setError("Link a bank account from the Balance page before continuing.");
      return;
    }
    if (value > Number(profile.balance)) {
      setError("Insufficient balance");
      return;
    }
    setError("");
    setStep("review");
  };

  const confirmPayment = () => {
    if (!payment) return;

    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setError("Enter a valid payment amount.");
      setStep("review");
      return;
    }
    if (!profile.bankLinked) {
      setError("Add a demo bank account before continuing.");
      setStep("review");
      return;
    }
    if (value > Number(profile.balance)) {
      setError("Insufficient balance");
      setStep("review");
      return;
    }

    setProcessing(true);
    setError("");
    setStep("processing");

    window.setTimeout(() => {
      try {
        const result = sendMoney({
          person: payment.name || payment.upiId,
          amount,
          note: note || `UPI payment to ${payment.upiId}`
        });
        setTransaction(result);
        setStep("success");
      } catch (err) {
        setError(/insufficient/i.test(err?.message || "") ? "Insufficient balance" : (err?.message || "Demo payment could not be completed."));
        setStep("failure");
      } finally {
        setProcessing(false);
      }
    }, 850);
  };

  return (
    <div className="upi-page page-enter">
      <section className="upi-hero">
        <div className="upi-hero-copy">
          <span className="upi-kicker"><Sparkles size={13} /> UPI PAYMENTS</span>
          <h1>Scan. Pay.<br /><span>Done.</span></h1>
          <p>One quick scan takes you to a clear payment review. You're in control at every step.</p>
          <div className="upi-trust-points">
            <span><ShieldCheck size={15} /> Secure-style flow</span>
            <span><CheckCircle2 size={15} /> Review before paying</span>
          </div>
        </div>
        <div className="upi-hero-art" aria-hidden="true">
          <div className="upi-art-orbit orbit-one" />
          <div className="upi-art-orbit orbit-two" />
          <div className="upi-art-card">
            <QrCode size={54} strokeWidth={1.4} />
            <span>scan to pay</span>
          </div>
          <span className="upi-art-dot dot-blue" />
          <span className="upi-art-dot dot-pink" />
          <span className="upi-art-spark">✦</span>
        </div>
      </section>

      {step === "scan" && (
        <>
          <section className="upi-section-heading">
            <div>
              <span className="eyebrow">STEP 01 · SCAN QR</span>
              <h2>Who are you paying?</h2>
              <p>Scan a merchant or person's UPI QR code.</p>
            </div>
            <span className="step-badge">01 / 03</span>
          </section>

          <QRScanner onResult={handleQrResult} autoStart />

          <section className="upi-how-card">
            <div className="upi-how-icon"><ShieldCheck size={20} /></div>
            <div>
              <strong>You'll review everything first</strong>
              <p>We'll show the UPI ID and any amount encoded in the QR before you continue.</p>
            </div>
          </section>

          <section className="upi-demo-note">
            <CircleAlert size={17} />
            <p><strong>Frontend demo</strong><span>QR scanning reads payment details only. It does not contact a bank or transfer real money.</span></p>
          </section>
        </>
      )}

      {step === "recipient" && payment && (
        <section className="upi-flow-card">
          <button className="upi-back-link" onClick={resetFlow}><ArrowLeft size={16} /> Back to scanner</button>
          <div className="upi-flow-progress"><span className="active" /><span /><span /></div>
          <span className="eyebrow">STEP 02 · RECIPIENT DETAILS</span>
          <h2>Check the recipient</h2>
          <p className="upi-flow-subtitle">Make sure the payment details match the person or merchant you intend to pay.</p>

          <div className="upi-recipient-card">
            <PersonAvatar name={payment.name} size="lg" />
            <div className="upi-recipient-info">
              <strong>{payment.name}</strong>
              <span>{payment.upiId}</span>
              {payment.phone && <small><Smartphone size={13} /> {payment.phone}</small>}
            </div>
            <BadgeCheck className="upi-recipient-badge" size={22} />
          </div>

          <div className="upi-verified-note">
            <CircleAlert size={16} />
            <span>A readable UPI ID is not proof of the recipient's identity. Verify the details independently before paying.</span>
          </div>

          <form className="upi-amount-form" onSubmit={continueToReview} noValidate>
            <label htmlFor="upi-amount">Amount to pay</label>
            <div className="upi-amount-input">
              <span>₹</span>
              <input
                id="upi-amount"
                type="number"
                step="0.01"
                placeholder="0"
                value={amount}
                onChange={(event) => {
                  setAmount(event.target.value);
                  setError("");
                }}
              />
              <small>INR</small>
            </div>
            {payment.amount && <p className="upi-qr-amount">Amount suggested by QR: {formatMoney(payment.amount)}</p>}
            <label className="upi-note-label" htmlFor="upi-note">Payment note <span>Optional</span></label>
            <input id="upi-note" value={note} onChange={(event) => setNote(event.target.value)} maxLength={80} placeholder="What's this payment for?" />
            <div className="upi-available-balance"><Wallet size={16} /><span>Demo balance</span><strong>{formatMoney(profile.balance)}</strong></div>
            {error && <p className="upi-form-error"><CircleAlert size={15} /> {error}</p>}
            <button className="primary-button full-button" type="submit">Review payment <ArrowRight size={17} /></button>
          </form>
        </section>
      )}

      {step === "review" && payment && (
        <section className="upi-flow-card">
          <button className="upi-back-link" onClick={() => setStep("recipient")}><ArrowLeft size={16} /> Edit details</button>
          <div className="upi-flow-progress"><span className="active" /><span className="active" /><span /></div>
          <span className="eyebrow">PAYMENT REVIEW</span>
          <h2>One last check</h2>
          <p className="upi-flow-subtitle">Check the recipient and amount before confirming this demo payment.</p>
          <div className="upi-review-amount">{formatMoney(amount)}<span>Payment amount</span></div>
          <div className="upi-review-list">
            <div><span>Paying to</span><strong>{payment.name}</strong></div>
            <div><span>UPI ID</span><strong>{payment.upiId}</strong></div>
            <div><span>From</span><strong>{profile.bankLinked ? profile.bankName : "No linked account"}</strong></div>
            <div><span>Payment note</span><strong>{note || "—"}</strong></div>
            <div><span>Payment type</span><strong>UPI · Demo</strong></div>
          </div>
          <div className="upi-review-warning"><ShieldCheck size={17} /><span>In a real payment app, verify the payee and amount carefully. This demo won't contact your bank.</span></div>
          {error && <p className="upi-form-error"><CircleAlert size={15} /> {error}</p>}
          <button className="primary-button full-button" onClick={confirmPayment} disabled={processing}>{processing ? "Processing…" : "Confirm demo payment"} <CheckCircle2 size={17} /></button>
        </section>
      )}

      {step === "processing" && (
        <section className="upi-result-card">
          <div className="upi-processing-spinner" />
          <h2>Processing demo payment</h2>
          <p>Updating the local demo wallet. No bank connection is being made.</p>
        </section>
      )}

      {(step === "success" || step === "failure") && (
        <section className={`upi-result-card ${step === "success" ? "is-success" : "is-failure"}`}>
          {step === "success" ? <CheckCircle2 size={57} /> : <CircleAlert size={57} />}
          <span className="eyebrow">{step === "success" ? "DEMO PAYMENT COMPLETE" : "PAYMENT NOT COMPLETED"}</span>
          <h2>{step === "success" ? `${formatMoney(transaction?.amount || amount)} sent` : "Couldn't complete payment"}</h2>
          <p>{step === "success" ? `A demo transaction was recorded for ${payment?.name || "your recipient"}.` : error || "Please review your details and try again."}</p>
          {step === "success" && transaction && (
            <div className="upi-receipt">
              <div><span>Recipient</span><strong>{payment.name}</strong></div>
              <div><span>UPI ID</span><strong>{payment.upiId}</strong></div>
              <div><span>Demo transaction ID</span><strong>{transaction.id}</strong></div>
              <div><span>Status</span><strong className="upi-receipt-status">Simulated</strong></div>
            </div>
          )}
          {step === "failure" && <button className="secondary-button full-button" onClick={() => setStep("review")}>Review and try again</button>}
          <button className="primary-button full-button" onClick={resetFlow}>{step === "success" ? "Done" : "Back to scanner"} <ArrowRight size={17} /></button>
          {step === "success" && <p className="upi-demo-disclaimer"><CreditCard size={13} /> This receipt is for a local frontend simulation only.</p>}
        </section>
      )}

      {error && step === "scan" && (
        <div className="upi-scan-error" role="alert">
          <CircleAlert size={17} />
          <span>{error}</span>
          <button aria-label="Dismiss error" onClick={() => setError("")}><X size={16} /></button>
        </div>
      )}
    </div>
  );
}
