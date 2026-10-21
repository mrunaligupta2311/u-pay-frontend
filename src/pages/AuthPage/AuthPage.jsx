import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  LockKeyhole,
  ShieldCheck,
  Smartphone,
  Wallet
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useWallet } from "../../context/WalletContext";
import "./AuthPage.css";

const DEMO_OTP = "123456";

const BANKS = [
  "State Bank of India",
  "Bank of Baroda",
  "HDFC Bank",
  "ICICI Bank",
  "Axis Bank",
  "Punjab National Bank"
];

export default function AuthPage() {
  const { completeOnboarding } = useAuth();
  const { startNewDemoAccount, updateProfile } = useWallet();

  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [bankName, setBankName] = useState("Bank of Baroda");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const stepNumber = step === "phone" ? 1 : step === "otp" ? 2 : 3;

  function goBack() {
    setError("");

    if (step === "bank") {
      setStep("otp");
    } else if (step === "otp") {
      setStep("phone");
      setOtp("");
    }
  }

  function submitPhone(event) {
    event.preventDefault();
    setError("");

    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError("Enter a valid 10-digit Indian mobile number.");
      return;
    }

    setOtp("");
    setStep("otp");
  }

  function verifyOtp(event) {
    event.preventDefault();
    setError("");

    if (otp !== DEMO_OTP) {
      setError("Incorrect demo OTP. Enter 123456 to continue.");
      return;
    }

    setStep("bank");
  }

  function finishSetup(event) {
    event.preventDefault();
    setError("");

    if (name.trim().length < 2) {
      setError("Enter your full name to continue.");
      return;
    }

    setLoading(true);

    try {
      startNewDemoAccount({
        name: name.trim(),
        phone,
        email: ""
      });

      updateProfile({
        name: name.trim(),
        phone,
        bankName,
        bankLinked: true,
        balance: 0
      });

      completeOnboarding({
        name: name.trim(),
        phone
      });
    } catch (err) {
      setError(err?.message || "Setup could not be completed.");
      setLoading(false);
    }
  }

  return (
    <main className="onboarding-page">
      <header className="onboarding-header">
        <a className="onboarding-brand" href="/" aria-label="u-pay">
          <span className="onboarding-brand-mark">u<span>.</span></span>
          <span>u-pay</span>
        </a>

        <div className="onboarding-secure-label">
          <ShieldCheck size={15} />
          <span>Demo environment</span>
        </div>
      </header>

      <div className="onboarding-layout">
        <section className="onboarding-intro">
          <div className="onboarding-intro-icon">
            <Wallet size={25} />
          </div>

          <span className="onboarding-eyebrow">SIMPLE. QUICK. CONVENIENT.</span>

          <h1>
            Payments made
            <br />
            <span>simple for you.</span>
          </h1>

          <p>
            Set up your u-pay demo account and explore a familiar,
            mobile-first payment experience.
          </p>

          <div className="onboarding-feature-list">
            <div>
              <span className="onboarding-feature-icon">
                <Smartphone size={18} />
              </span>
              <span>
                <strong>Mobile-first setup</strong>
                <small>Start with your mobile number</small>
              </span>
            </div>

            <div>
              <span className="onboarding-feature-icon">
                <Building2 size={18} />
              </span>
              <span>
                <strong>Bank setup preview</strong>
                <small>Explore the simulated linking flow</small>
              </span>
            </div>

            <div>
              <span className="onboarding-feature-icon">
                <LockKeyhole size={18} />
              </span>
              <span>
                <strong>Return without logging in</strong>
                <small>Your demo session stays on this browser</small>
              </span>
            </div>
          </div>
        </section>

        <section className="onboarding-card">
          <div className="onboarding-progress">
            {[1, 2, 3].map((number) => (
              <span
                key={number}
                className={number <= stepNumber ? "active" : ""}
              />
            ))}
          </div>

          <div className="onboarding-step-label">
            STEP {stepNumber} OF 3
          </div>

          {step === "phone" && (
            <>
              <div className="onboarding-card-icon">
                <Smartphone size={23} />
              </div>

              <h2>Enter your mobile number</h2>

              <p className="onboarding-description">
                Use an Indian mobile number to begin setting up your demo account.
              </p>

              <form onSubmit={submitPhone} className="onboarding-form">
                <label htmlFor="onboarding-phone">Mobile number</label>

                <div className="onboarding-phone-input">
                  <span>🇮🇳 +91</span>
                  <input
                    id="onboarding-phone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    placeholder="10-digit number"
                    value={phone}
                    onChange={(event) => {
                      setPhone(
                        event.target.value.replace(/\D/g, "").slice(0, 10)
                      );
                      setError("");
                    }}
                    maxLength={10}
                    required
                  />
                </div>

                <p className="onboarding-field-hint">
                  Enter a number starting with 6, 7, 8 or 9.
                </p>

                {error && <p className="onboarding-error" role="alert">{error}</p>}

                <button className="onboarding-primary" type="submit">
                  Continue <ArrowRight size={18} />
                </button>
              </form>
            </>
          )}

          {step === "otp" && (
            <>
              <button
                type="button"
                className="onboarding-back"
                onClick={goBack}
              >
                <ArrowLeft size={16} /> Change number
              </button>

              <div className="onboarding-card-icon">
                <ShieldCheck size={23} />
              </div>

              <h2>Verify your number</h2>

              <p className="onboarding-description">
                Enter the demo code for <strong>+91 {phone}</strong>.
              </p>

              <div className="onboarding-demo-code">
                <span>DEMO OTP</span>
                <strong>{DEMO_OTP}</strong>
                <small>No SMS is sent by this prototype.</small>
              </div>

              <form onSubmit={verifyOtp} className="onboarding-form">
                <label htmlFor="onboarding-otp">6-digit verification code</label>

                <input
                  id="onboarding-otp"
                  className="onboarding-otp-input"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="Enter 123456"
                  value={otp}
                  onChange={(event) => {
                    setOtp(event.target.value.replace(/\D/g, "").slice(0, 6));
                    setError("");
                  }}
                  required
                />

                {error && <p className="onboarding-error" role="alert">{error}</p>}

                <button className="onboarding-primary" type="submit">
                  Verify & continue <ArrowRight size={18} />
                </button>
              </form>
            </>
          )}

          {step === "bank" && (
            <>
              <button
                type="button"
                className="onboarding-back"
                onClick={goBack}
              >
                <ArrowLeft size={16} /> Back
              </button>

              <div className="onboarding-card-icon">
                <Building2 size={23} />
              </div>

              <h2>Set up your account</h2>

              <p className="onboarding-description">
                Choose a demo bank and enter the name to display in your profile.
              </p>

              <form onSubmit={finishSetup} className="onboarding-form">
                <label htmlFor="onboarding-name">Full name</label>

                <input
                  id="onboarding-name"
                  className="onboarding-text-input"
                  type="text"
                  autoComplete="name"
                  maxLength={80}
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    setError("");
                  }}
                  required
                />

                <label htmlFor="onboarding-bank">Choose a demo bank</label>

                <select
                  id="onboarding-bank"
                  className="onboarding-text-input"
                  value={bankName}
                  onChange={(event) => setBankName(event.target.value)}
                >
                  {BANKS.map((bank) => (
                    <option key={bank} value={bank}>{bank}</option>
                  ))}
                </select>

                <div className="onboarding-bank-notice">
                  <Building2 size={17} />
                  <span>
                    <strong>Demo setup only</strong>
                    <small>No bank account is contacted or linked.</small>
                  </span>
                </div>

                {error && <p className="onboarding-error" role="alert">{error}</p>}

                <button
                  className="onboarding-primary"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Setting up..." : "Finish setup"}
                  {!loading && <CheckCircle2 size={18} />}
                </button>
              </form>
            </>
          )}

          <div className="onboarding-disclaimer">
            <ShieldCheck size={16} />
            <span>
              u-pay is a frontend demo. No real OTP, bank verification or
              money transfer takes place.
            </span>
          </div>
        </section>
      </div>

      <footer className="onboarding-footer">
        <span>u-pay</span>
        <span>Demo payment experience</span>
      </footer>
    </main>
  );
}
