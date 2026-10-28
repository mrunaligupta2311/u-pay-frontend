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
  const [pin, setPin] = useState("");
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
    setPin("");
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
    if (value > Number(profile.balance)) {
      setError("Insufficient balance");
      return;
    }
    setError("");
    setStep("review");
  };

  const confirmPayment = async (event) => {
    event?.preventDefault();

    if (processing || !payment) return;

    if (!/^\d{4,6}$/.test(pin)) {
      setError("Enter your 4–6 digit Transaction PIN.");
      return;
    }

    const value = Number(amount);

    if (!Number.isFinite(value) || value <= 0) {
      setError("Enter a valid payment amount.");
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

    try {
      const result = await sendMoney({
        person: payment.name || payment.upiId,
        recipientUpiId: payment.upiId || "",
        amount,
        note: note || `UPI payment to ${payment.upiId}`,
        pin,
      });

      setTransaction(result);
      setPin("");
      setStep("success");
    } catch (err) {
      const code = err?.code || "";
      const message = err?.message || "";

      if (code === "INVALID_TRANSACTION_PIN" || code === "PIN_INVALID") {
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
        setStep("failure");
      } else {
        setError(message || "Payment could not be completed. Check your connection and try again.");
        setStep("failure");
      }
    } finally {
      setProcessing(false);
    }
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
            <p><strong>Scan to pay</strong><span>Scan a UPI QR code to securely read the payment details.</span></p>
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
            <div className="upi-available-balance"><Wallet size={16} /><span>Wallet balance</span><strong>{formatMoney(profile.balance)}</strong></div>
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
          <p className="upi-flow-subtitle">Check the recipient and amount before continuing.</p>
          <div className="upi-review-amount">{formatMoney(amount)}<span>Payment amount</span></div>
          <div className="upi-review-list">
            <div><span>Paying to</span><strong>{payment.name}</strong></div>
            <div><span>UPI ID</span><strong>{payment.upiId}</strong></div>
            <div><span>Payment source</span><strong>U-Pay wallet</strong></div>
            <div><span>Payment note</span><strong>{note || "—"}</strong></div>
            <div><span>Payment type</span><strong>UPI · Simulated</strong></div>
          </div>
          <div className="upi-review-warning"><ShieldCheck size={17} /><span>Check the recipient and amount carefully before continuing. This flow records a simulated transaction; no real money is transferred.</span></div>
          {error && <p className="upi-form-error"><CircleAlert size={15} /> {error}</p>}
          <button className="primary-button full-button" onClick={() => { setPin(""); setError(""); setStep("pin"); }} disabled={processing}>Continue to PIN <ArrowRight size={17} /></button>
        </section>
      )}

      {step === "pin" && payment && (
        <section className="upi-flow-card upi-authorize-card">
          <button className="upi-back-link" type="button"
            onClick={() => { setPin(""); setError(""); setStep("review"); }}>
            <ArrowLeft size={16} /> Back to review
          </button>
          <div className="upi-flow-progress"><span className="active" /><span className="active" /><span className="active" /></div>
          <div className="upi-auth-icon"><ShieldCheck size={30} /></div>
          <span className="eyebrow">PAYMENT AUTHORIZATION</span>
          <h2>Enter Transaction PIN</h2>
          <p className="upi-flow-subtitle">
            Authorize this payment to {payment.name || payment.upiId}.
          </p>
          <div className="upi-auth-payee">
            <Wallet size={18} />
            <span>{formatMoney(amount)} · U-Pay wallet</span>
          </div>
          <form onSubmit={confirmPayment} noValidate>
            <label className="upi-pin-label" htmlFor="upi-transaction-pin">
              <ShieldCheck size={15} /> Transaction PIN
            </label>
            <input
              id="upi-transaction-pin"
              className="upi-pin-input"
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
              placeholder="••••"
              aria-label="4 to 6 digit Transaction PIN"
              disabled={processing}
              autoFocus
            />
            {error && <p className="upi-form-error" role="alert"><CircleAlert size={15} /> {error}</p>}
            <p className="upi-demo-disclaimer">
              <ShieldCheck size={13} /> Simulated authorization only. No money will be transferred.
            </p>
            <button className="primary-button full-button" type="submit" disabled={processing}>
              {processing ? "Processing payment…" : "Authorize payment"}
              {!processing && <CheckCircle2 size={17} />}
            </button>
          </form>
        </section>
      )}

      {step === "processing" && (
        <section className="upi-result-card">
          <div className="upi-processing-spinner" />
          <h2>Processing payment</h2>
          <p>Recording your transaction. No bank connection is being made.</p>
        </section>
      )}

      {(step === "success" || step === "failure") && (
        <section className={`upi-result-card ${step === "success" ? "is-success" : "is-failure"}`}>
          {step === "success" ? <CheckCircle2 size={57} /> : <CircleAlert size={57} />}
          <span className="eyebrow">{step === "success" ? "PAYMENT RECORDED" : "PAYMENT NOT COMPLETED"}</span>
          <h2>{step === "success" ? `${formatMoney(transaction?.amount || amount)} sent` : "Couldn't complete payment"}</h2>
          <p>{step === "success" ? `A transaction record was created for ${payment?.name || "your recipient"}.` : error || "Please review your details and try again."}</p>
          {step === "success" && transaction && (
            <div className="upi-receipt">
              <div><span>Recipient</span><strong>{payment.name}</strong></div>
              <div><span>UPI ID</span><strong>{payment.upiId}</strong></div>
              <div><span>Transaction ID</span><strong>{transaction.id}</strong></div>
              <div><span>Status</span><strong className="upi-receipt-status">Simulated</strong></div>
            </div>
          )}
          {step === "failure" && <button className="secondary-button full-button" onClick={() => { setError(""); setPin(""); setStep("pin"); }}>Try payment again</button>}
          <button className="primary-button full-button" onClick={resetFlow}>{step === "success" ? "Done" : "Back to scanner"} <ArrowRight size={17} /></button>
          {step === "success" && <p className="upi-demo-disclaimer"><CreditCard size={13} /> Simulated transaction only. No real money was transferred.</p>}
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
