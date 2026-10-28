import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  LockKeyhole,
  ShieldCheck,
  Smartphone,
  Wallet,
  Mail,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useWallet } from "../../context/WalletContext";
import "./AuthPage.css";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000"
).replace(/\/+$/, "");

const DRAFT_KEY = "upay-registration-draft-v2";

function readDraft() {
  try {
    const saved = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");

    if (
      saved &&
      ["details", "otp", "phone", "entry-pin", "transaction-pin"].includes(saved.step)
    ) {
      return saved;
    }
  } catch {
    // Ignore invalid or outdated registration drafts.
  }

  return {
    step: "details",
    name: "",
    email: "",
    phone: "",
    emailResendAt: 0,
    phoneResendAt: 0,
  };
}

async function requestApi(path, payload) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}/api/auth${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error(
      "Cannot connect to U-Pay server. Check that the backend is running."
    );
  }

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error("The server returned an invalid response.");
  }

  if (!response.ok) {
    const code = data?.error?.code;
    const message = data?.error?.message;
    const error = new Error(message || "The request could not be completed.");

    error.code = code;
    error.retryAfterSeconds = data?.error?.retryAfterSeconds;

    if (code === "OTP_RATE_LIMIT") {
      error.message =
        "Daily OTP limit reached. Please wait until the 24-hour window resets.";
    } else if (code === "OTP_COOLDOWN") {
      error.message = `Please wait ${error.retryAfterSeconds || 30} seconds before requesting another OTP.`;
    } else if (code === "ACCOUNT_ALREADY_EXISTS") {
      error.message =
        "An account already exists with this email or mobile number.";
    } else if (code === "EMAIL_DELIVERY_FAILED") {
      error.message =
        "We could not send the email. Please try again later.";
    } else if (code === "EMAIL_NOT_CONFIGURED") {
      error.message = "Email verification is not configured on the server.";
    } else if (code === "OTP_INVALID" || code === "OTP_EXPIRED") {
      error.message =
        message || "The OTP is invalid or expired. Request a new code.";
    } else if (code === "OTP_ATTEMPTS_EXCEEDED") {
      error.message =
        "Too many incorrect attempts. Request a new verification code.";
    }

    throw error;
  }

  return data;
}

async function requestSecurityApi(path, payload, sessionToken) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}/api/security${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(sessionToken ? { "x-session-token": sessionToken } : {}),
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error(
      "Cannot connect to U-Pay server. Check that the backend is running."
    );
  }

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error("The server returned an invalid response.");
  }

  if (!response.ok) {
    const code = data?.error?.code;
    const message = data?.error?.message;
    const error = new Error(message || "The request could not be completed.");

    error.code = code;
    error.retryAfterSeconds = data?.error?.retryAfterSeconds;

    if (code === "PIN_ALREADY_SET") {
      error.message =
        "A PIN is already configured for this account. Please use account recovery or sign in.";
    } else if (code === "SESSION_INVALID" || code === "SESSION_EXPIRED") {
      error.message = "Your session has expired. Please restart registration.";
    }

    throw error;
  }

  return data;
}

function formatCountdown(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds
  ).padStart(2, "0")}`;
}

export default function AuthPage() {
  const {
    completeOnboarding,
    beginBackendSession,
    sessionToken,
    logout,
  } = useAuth();
  const { startNewDemoAccount } = useWallet();

  const [initialDraft] = useState(readDraft);

  const [step, setStep] = useState(initialDraft.step);
  const [phone, setPhone] = useState(initialDraft.phone);
  const [email, setEmail] = useState(initialDraft.email);
  const [otp, setOtp] = useState("");
  const [pinValue, setPinValue] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [name, setName] = useState(initialDraft.name);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLoginFlow, setIsLoginFlow] = useState(false);

  const [recoveryPinType, setRecoveryPinType] = useState("ENTRY_PIN");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryOtp, setRecoveryOtp] = useState("");
  const [recoveryResetToken, setRecoveryResetToken] = useState("");
  const [recoveryNewPin, setRecoveryNewPin] = useState("");
  const [recoveryConfirmPin, setRecoveryConfirmPin] = useState("");

  const [emailResendAt, setEmailResendAt] = useState(
    initialDraft.emailResendAt || 0
  );
  const [phoneResendAt, setPhoneResendAt] = useState(
    initialDraft.phoneResendAt || 0
  );
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        step,
        name,
        email,
        phone,
        emailResendAt,
        phoneResendAt,
      })
    );
  }, [step, name, email, phone, emailResendAt, phoneResendAt]);

  const stepNumber =
    step === "details" || step === "login-email" ? 1
      : step === "otp" || step === "login-otp" ? 2
      : step === "phone" ? 3
      : step === "entry-pin" ? 4
      : step === "login-pin" ? 3
      : 5;

  const emailCountdown = Math.max(
    0,
    Math.ceil((emailResendAt - now) / 1000)
  );

  const phoneCountdown = Math.max(
    0,
    Math.ceil((phoneResendAt - now) / 1000)
  );

  function clearMessages() {
    setError("");
    setNotice("");
  }

  function setRetryTimer(errorObject, channel) {
    if (errorObject?.retryAfterSeconds) {
      const retryAt =
        Date.now() + errorObject.retryAfterSeconds * 1000;

      if (channel === "email") {
        setEmailResendAt(retryAt);
      } else {
        setPhoneResendAt(retryAt);
      }
    }
  }

  function goBack() {
    clearMessages();

    if (step === "otp") {
      setStep("details");
      setOtp("");
    }
  }

  async function submitDetails(event) {
    event.preventDefault();
    clearMessages();

    const cleanName = name.trim().replace(/\s+/g, " ");
    const cleanEmail = email.trim().toLowerCase();

    if (cleanName.length < 2 || cleanName.length > 80) {
      setError("Enter your full name using 2 to 80 characters.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError("Enter a valid email address.");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError("Enter a valid 10-digit Indian mobile number.");
      return;
    }

    setLoading(true);

    try {
      const result = await requestApi("/register", {
        fullName: cleanName,
        email: cleanEmail,
        phoneNumber: phone,
      });

      setName(cleanName);
      setEmail(cleanEmail);
      setOtp("");
      setEmailResendAt(
        Date.now() + (result.resendAfterSeconds || 30) * 1000
      );
      setStep("otp");
      setNotice(`A verification code has been sent to ${cleanEmail}.`);
    } catch (err) {
      setRetryTimer(err, "email");
      setError(err?.message || "Registration could not be started.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyEmailOtp(event) {
    event.preventDefault();
    clearMessages();

    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the 6-digit email verification code.");
      return;
    }

    setLoading(true);

    try {
      const result = await requestApi("/verify-email", {
        fullName: name.trim(),
        email: email.trim().toLowerCase(),
        phoneNumber: phone,
        otp,
      });

      if (result.nextStep !== "VERIFY_PHONE") {
        throw new Error("The server did not start mobile verification.");
      }

      setOtp("");
      setPhoneResendAt(
        Date.now() + (result.resendAfterSeconds || 30) * 1000
      );
      setStep("phone");
      setNotice(
        "Email verified. Check the backend terminal for your development mobile OTP."
      );
    } catch (err) {
      setRetryTimer(err, "email");
      setError(err?.message || "Email verification failed.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyPhoneOtp(event) {
    event.preventDefault();
    clearMessages();

    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the 6-digit mobile verification code.");
      return;
    }

    setLoading(true);

    try {
      const result = await requestApi("/verify-phone", {
        email: email.trim().toLowerCase(),
        phoneNumber: phone,
        otp,
      });

      if (
        result.nextStep !== "SETUP_PINS" ||
        result.verification?.emailVerified !== true ||
        result.verification?.phoneVerified !== true ||
        !result.sessionToken
      ) {
        throw new Error(
          "The server did not complete verification or create a session."
        );
      }

      beginBackendSession(result.sessionToken, result.user);
      setOtp("");
      setPinValue("");
      setConfirmPin("");
      setStep("entry-pin");
      setNotice("Your details are verified. Create your U-Pay security PINs.");
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          step: "entry-pin",
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone,
          emailResendAt,
          phoneResendAt,
        })
      );
    } catch (err) {
      setRetryTimer(err, "phone");
      setError(err?.message || "Mobile verification failed.");
    } finally {
      setLoading(false);
    }
  }

  async function submitPinSetup(event) {
    event.preventDefault();
    clearMessages();

    if (!/^\d{4,6}$/.test(pinValue)) {
      setError("Your PIN must contain 4 to 6 digits.");
      return;
    }

    if (pinValue !== confirmPin) {
      setError("The PINs do not match. Please try again.");
      return;
    }

    if (!sessionToken) {
      setError("Your server session is missing. Please restart registration.");
      return;
    }

    setLoading(true);

    try {
      const endpoint =
        step === "entry-pin" ? "/entry-pin" : "/transaction-pin";

      const result = await requestSecurityApi(
        endpoint,
        { pin: pinValue },
        sessionToken
      );

      setPinValue("");
      setConfirmPin("");

      if (result.nextStep === "SET_TRANSACTION_PIN") {
        setStep("transaction-pin");
        setNotice("Entry PIN saved. Now create your transaction PIN.");
        return;
      }

      if (result.nextStep === "SET_ENTRY_PIN") {
        setStep("entry-pin");
        setNotice("Transaction PIN saved. Now create your entry PIN.");
        return;
      }

      if (result.nextStep !== "DASHBOARD") {
        throw new Error("The server returned an unexpected PIN setup step.");
      }

      if (!isLoginFlow) {
        startNewDemoAccount({
          name: name.trim(),
          phone,
          email: email.trim().toLowerCase(),
        });
      }

      completeOnboarding({
        name: name.trim(),
        phone,
        email: email.trim().toLowerCase(),
      });

      localStorage.removeItem(DRAFT_KEY);
    } catch (err) {
      setError(err?.message || "PIN setup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function requestLoginOtp(event) {
    event?.preventDefault();
    clearMessages();

    const cleanEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError("Enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      const result = await requestSecurityApi(
        "/login-email-otp",
        { email: cleanEmail }
      );

      setEmail(cleanEmail);
      setOtp("");
      setEmailResendAt(
        Date.now() + (result.resendAfterSeconds || 30) * 1000
      );
      setStep("login-otp");
      setNotice(`A sign-in verification code has been sent to ${cleanEmail}.`);
    } catch (err) {
      setRetryTimer(err, "email");
      setError(
        err?.code === "LOGIN_NOT_AVAILABLE"
          ? "No active, verified U-Pay account was found for this email."
          : err?.message || "Could not request a sign-in code."
      );
    } finally {
      setLoading(false);
    }
  }

  async function verifyLoginOtp(event) {
    event.preventDefault();
    clearMessages();

    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the 6-digit sign-in code.");
      return;
    }

    setLoading(true);

    try {
      const result = await requestSecurityApi(
        "/verify-login-otp",
        {
          email: email.trim().toLowerCase(),
          otp,
        }
      );

      if (!result.sessionToken || !result.user) {
        throw new Error("The server did not create a valid sign-in session.");
      }

      const serverUser = result.user;
      const phoneDigits = String(serverUser.phoneNumber || "")
        .replace(/\\D/g, "")
        .slice(-10);

      beginBackendSession(result.sessionToken, serverUser);

      setIsLoginFlow(true);
      setName(serverUser.fullName || "");
      setEmail(serverUser.email || email.trim().toLowerCase());
      setPhone(phoneDigits);
      setOtp("");
      setPinValue("");
      setConfirmPin("");

      if (result.nextStep === "ENTRY_PIN") {
        setStep("login-pin");
        setNotice("Email verified. Enter your Entry PIN to unlock U-Pay.");
      } else if (result.nextStep === "SETUP_PINS") {
        const setup = result.pinSetup || {};
        setStep(setup.entryPinSet ? "transaction-pin" : "entry-pin");
        setNotice("Email verified. Finish setting up your missing security PIN.");
      } else {
        throw new Error("The server returned an unexpected sign-in step.");
      }
    } catch (err) {
      setError(err?.message || "Sign-in verification failed.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyLoginPin(event) {
    event.preventDefault();
    clearMessages();

    if (!/^\d{4,6}$/.test(pinValue)) {
      setError("Enter your 4–6 digit Entry PIN.");
      return;
    }

    if (!sessionToken) {
      setError("Your session has expired. Please sign in again.");
      return;
    }

    setLoading(true);

    try {
      const result = await requestSecurityApi(
        "/entry-pin/verify",
        { pin: pinValue },
        sessionToken
      );

      if (result.nextStep !== "DASHBOARD") {
        throw new Error("U-Pay could not unlock this session.");
      }

      const cleanPhone = String(phone).replace(/\\D/g, "").slice(-10);

      completeOnboarding({
        name: name.trim(),
        phone: cleanPhone,
        email: email.trim().toLowerCase(),
      });

      localStorage.removeItem(DRAFT_KEY);
    } catch (err) {
      if (err?.code === "PIN_LOCKED") {
        setError(
          `Entry PIN is temporarily locked. Try again in ${err.retryAfterSeconds || 900} seconds.`
        );
      } else if (err?.code === "PIN_SETUP_REQUIRED") {
        setStep("entry-pin");
        setError("Finish setting up your security PINs to continue.");
      } else {
        setError(err?.message || "Could not unlock U-Pay.");
      }
    } finally {
      setPinValue("");
      setLoading(false);
    }
  }

  function startPinRecovery() {
    clearMessages();
    setRecoveryPinType("ENTRY_PIN");
    setRecoveryEmail(email.trim().toLowerCase());
    setRecoveryOtp("");
    setRecoveryResetToken("");
    setRecoveryNewPin("");
    setRecoveryConfirmPin("");
    setStep("pin-recovery-email");
  }

  async function requestPinRecoveryEmail(event) {
    event.preventDefault();
    clearMessages();

    const cleanEmail = recoveryEmail.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError("Enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      await requestSecurityApi("/pin-reset/email", {
        email: cleanEmail,
        pinType: recoveryPinType,
      });

      setRecoveryEmail(cleanEmail);
      setRecoveryOtp("");
      setStep("pin-recovery-email-otp");
      setNotice(
        "If your account is eligible, a verification code will be sent to your email."
      );
    } catch (err) {
      setError(err?.message || "Could not start PIN recovery.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyPinRecoveryEmail(event) {
    event.preventDefault();
    clearMessages();

    if (!/^\d{6}$/.test(recoveryOtp)) {
      setError("Enter the 6-digit email verification code.");
      return;
    }

    setLoading(true);

    try {
      const result = await requestSecurityApi("/pin-reset/email/verify", {
        email: recoveryEmail.trim().toLowerCase(),
        pinType: recoveryPinType,
        otp: recoveryOtp,
      });

      if (!result?.resetToken) {
        throw new Error("The server did not provide a valid recovery challenge.");
      }

      setRecoveryResetToken(result.resetToken);
      setRecoveryOtp("");
      setStep("pin-recovery-phone-otp");
      setNotice("Email verified. Enter the OTP sent to your registered mobile number.");
    } catch (err) {
      setError(err?.message || "Email verification failed.");
    } finally {
      setLoading(false);
    }
  }

  async function completePinRecovery(event) {
    event.preventDefault();
    clearMessages();

    if (!/^\d{6}$/.test(recoveryOtp)) {
      setError("Enter the 6-digit mobile verification code.");
      return;
    }

    if (!/^\d{4,6}$/.test(recoveryNewPin)) {
      setError("Your new PIN must contain 4 to 6 digits.");
      return;
    }

    if (recoveryNewPin !== recoveryConfirmPin) {
      setError("The new PINs do not match.");
      return;
    }

    setLoading(true);

    try {
      await requestSecurityApi("/pin-reset/phone/verify", {
        resetToken: recoveryResetToken,
        otp: recoveryOtp,
        newPin: recoveryNewPin,
      });

      // Recovery revokes all backend sessions. Clear the local session too.
      logout();

      setPinValue("");
      setOtp("");
      setRecoveryOtp("");
      setRecoveryResetToken("");
      setRecoveryNewPin("");
      setRecoveryConfirmPin("");
      setIsLoginFlow(true);
      setStep("login-email");
      setNotice("PIN reset successfully. Sign in again using your email.");
    } catch (err) {
      setError(err?.message || "Could not reset your PIN. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function resendEmailOtp() {
    clearMessages();
    setLoading(true);

    try {
      const result = await requestApi("/resend-email-otp", {
        email: email.trim().toLowerCase(),
      });

      setOtp("");
      setEmailResendAt(
        Date.now() + (result.resendAfterSeconds || 30) * 1000
      );
      setNotice("A new email verification code has been requested.");
    } catch (err) {
      setRetryTimer(err, "email");
      setError(err?.message || "Could not resend the email verification code.");
    } finally {
      setLoading(false);
    }
  }

  async function resendPhoneOtp() {
    clearMessages();
    setLoading(true);

    try {
      const result = await requestApi("/resend-phone-otp", {
        email: email.trim().toLowerCase(),
        phoneNumber: phone,
      });

      setOtp("");
      setPhoneResendAt(
        Date.now() + (result.resendAfterSeconds || 30) * 1000
      );
      setNotice("A new development mobile OTP has been generated. Check the backend terminal.");
    } catch (err) {
      setRetryTimer(err, "phone");
      setError(err?.message || "Could not generate a new mobile OTP.");
    } finally {
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
          <span>Account security</span>
        </div>
      </header>

      <div className="onboarding-layout">
        <section className="onboarding-intro">
          <div className="onboarding-intro-icon">
            <Wallet size={25} />
          </div>

          <span className="onboarding-eyebrow">
            SIMPLE. QUICK. CONVENIENT.
          </span>

          <h1>
            Payments made
            <br />
            <span>simple for you.</span>
          </h1>

          <p>
            Set up your u-pay account and explore a familiar,
            mobile-first payment experience.
          </p>

          <div className="onboarding-feature-list">
            <div>
              <span className="onboarding-feature-icon">
                <Smartphone size={18} />
              </span>
              <span>
                <strong>Mobile-first setup</strong>
                <small>Register with your mobile number</small>
              </span>
            </div>

            <div>
              <span className="onboarding-feature-icon">
                <Building2 size={18} />
              </span>
              <span>
                <strong>Bank setup preview</strong>
                <small>Set up your U-Pay profile</small>
              </span>
            </div>

            <div>
              <span className="onboarding-feature-icon">
                <LockKeyhole size={18} />
              </span>
              <span>
                <strong>Two-step verification</strong>
                <small>Verify your email and mobile number</small>
              </span>
            </div>
          </div>
        </section>

        <section className="onboarding-card">
          {![
            "login-email",
            "login-otp",
            "login-pin",
            "pin-recovery-email",
            "pin-recovery-email-otp",
            "pin-recovery-phone-otp",
          ].includes(step) && (
            <div className="onboarding-progress">
              {[1, 2, 3, 4, 5].map((number) => (
                <span
                  key={number}
                  className={number <= stepNumber ? "active" : ""}
                />
              ))}
            </div>
          )}

          <div className="onboarding-step-label">
            {["login-email", "login-otp", "login-pin"].includes(step)
              ? "SECURE SIGN IN"
              : `STEP ${stepNumber} OF 5`}
          </div>

          {step === "details" && (
            <>
              <div className="onboarding-card-icon">
                <Smartphone size={23} />
              </div>

              <h2>Create your account</h2>

              <p className="onboarding-description">
                Enter your details to receive an email verification code.
              </p>

              <form onSubmit={submitDetails} className="onboarding-form">
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

                <label htmlFor="onboarding-email">Email address</label>
                <input
                  id="onboarding-email"
                  className="onboarding-text-input"
                  type="email"
                  autoComplete="email"
                  maxLength={254}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setError("");
                  }}
                  required
                />

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
                  Enter an Indian mobile number starting with 6, 7, 8 or 9.
                </p>

                {error && <p className="onboarding-error" role="alert">{error}</p>}
                {notice && <p className="onboarding-field-hint" role="status">{notice}</p>}

                <button className="onboarding-primary" type="submit" disabled={loading}>
                  {loading ? "Sending verification code..." : "Continue"}
                  {!loading && <ArrowRight size={18} />}
                </button>
              </form>
            </>
          )}

          {step === "login-email" && (
            <>
              <div className="onboarding-card-icon">
                <Mail size={23} />
              </div>

              <h2>Welcome back</h2>

              <p className="onboarding-description">
                Enter the email linked to your U-Pay account. We will send you a sign-in code.
              </p>

              <form onSubmit={requestLoginOtp} className="onboarding-form">
                <label htmlFor="login-email">Email address</label>
                <input
                  id="login-email"
                  className="onboarding-text-input"
                  type="email"
                  autoComplete="email"
                  maxLength={254}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setError("");
                  }}
                  required
                />

                {error && <p className="onboarding-error" role="alert">{error}</p>}
                {notice && <p className="onboarding-field-hint" role="status">{notice}</p>}

                <button className="onboarding-primary" type="submit" disabled={loading}>
                  {loading ? "Sending sign-in code..." : "Continue with email"}
                  {!loading && <ArrowRight size={18} />}
                </button>
              </form>
            </>
          )}

          {step === "login-otp" && (
            <>
              <button
                type="button"
                className="onboarding-back"
                onClick={() => {
                  clearMessages();
                  setOtp("");
                  setStep("login-email");
                }}
                disabled={loading}
              >
                <ArrowLeft size={16} /> Change email
              </button>

              <div className="onboarding-card-icon">
                <Mail size={23} />
              </div>

              <h2>Verify it’s you</h2>

              <p className="onboarding-description">
                Enter the 6-digit sign-in code sent to <strong>{email}</strong>.
              </p>

              <form onSubmit={verifyLoginOtp} className="onboarding-form">
                <label htmlFor="login-email-otp">Sign-in verification code</label>
                <input
                  id="login-email-otp"
                  className="onboarding-otp-input"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="Enter 6-digit code"
                  value={otp}
                  onChange={(event) => {
                    setOtp(event.target.value.replace(/\D/g, "").slice(0, 6));
                    setError("");
                  }}
                  required
                />

                <p className="onboarding-field-hint">
                  The code expires after 5 minutes. Check your inbox and spam folder.
                </p>

                {error && <p className="onboarding-error" role="alert">{error}</p>}
                {notice && <p className="onboarding-field-hint" role="status">{notice}</p>}

                <button className="onboarding-primary" type="submit" disabled={loading}>
                  {loading ? "Verifying..." : "Verify and continue"}
                  {!loading && <ArrowRight size={18} />}
                </button>

                <button
                  className="onboarding-back"
                  type="button"
                  onClick={() => requestLoginOtp()}
                  disabled={loading || emailCountdown > 0}
                >
                  {loading
                    ? "Please wait..."
                    : emailCountdown > 0
                      ? `Resend code in ${formatCountdown(emailCountdown)}`
                      : "Resend sign-in code"}
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
                disabled={loading}
              >
                <ArrowLeft size={16} /> Change details
              </button>

              <div className="onboarding-card-icon">
                <Mail size={23} />
              </div>

              <h2>Verify your email</h2>

              <p className="onboarding-description">
                Enter the 6-digit code sent to <strong>{email}</strong>.
              </p>

              <form onSubmit={verifyEmailOtp} className="onboarding-form">
                <label htmlFor="onboarding-email-otp">Email verification code</label>
                <input
                  id="onboarding-email-otp"
                  className="onboarding-otp-input"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="Enter 6-digit code"
                  value={otp}
                  onChange={(event) => {
                    setOtp(event.target.value.replace(/\D/g, "").slice(0, 6));
                    setError("");
                  }}
                  required
                />

                <p className="onboarding-field-hint">
                  The code expires after 5 minutes. Check your spam folder if the email is missing.
                </p>

                {error && <p className="onboarding-error" role="alert">{error}</p>}
                {notice && <p className="onboarding-field-hint" role="status">{notice}</p>}

                <button className="onboarding-primary" type="submit" disabled={loading}>
                  {loading ? "Verifying..." : "Verify email"}
                  {!loading && <ArrowRight size={18} />}
                </button>

                <button
                  className="onboarding-back"
                  type="button"
                  onClick={resendEmailOtp}
                  disabled={loading || emailCountdown > 0}
                >
                  {loading
                    ? "Please wait..."
                    : emailCountdown > 0
                      ? `Resend email OTP in ${formatCountdown(emailCountdown)}`
                      : "Resend verification email"}
                </button>
              </form>
            </>
          )}

          {step === "phone" && (
            <>
              <div className="onboarding-card-icon">
                <Smartphone size={23} />
              </div>

              <h2>Verify your mobile</h2>

              <p className="onboarding-description">
                Your email is verified. Enter the 6-digit mobile OTP for{" "}
                <strong>+91 {phone}</strong>.
              </p>

              <div className="onboarding-bank-notice">
                <CheckCircle2 size={18} />
                <span>
                  <strong>Email verified successfully</strong>
                  <small>
                    Development mode: the mobile OTP appears in the backend terminal.
                    No SMS is sent.
                  </small>
                </span>
              </div>

              <form onSubmit={verifyPhoneOtp} className="onboarding-form">
                <label htmlFor="onboarding-phone-otp">Mobile verification code</label>
                <input
                  id="onboarding-phone-otp"
                  className="onboarding-otp-input"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="Enter 6-digit code"
                  value={otp}
                  onChange={(event) => {
                    setOtp(event.target.value.replace(/\D/g, "").slice(0, 6));
                    setError("");
                  }}
                  required
                />

                <p className="onboarding-field-hint">
                  The code expires after 5 minutes. You can request a new code after the cooldown.
                </p>

                {error && <p className="onboarding-error" role="alert">{error}</p>}
                {notice && <p className="onboarding-field-hint" role="status">{notice}</p>}

                <button className="onboarding-primary" type="submit" disabled={loading}>
                  {loading ? "Verifying mobile..." : "Verify & open U-Pay"}
                  {!loading && <ArrowRight size={18} />}
                </button>

                <button
                  className="onboarding-back"
                  type="button"
                  onClick={resendPhoneOtp}
                  disabled={loading || phoneCountdown > 0}
                >
                  {loading
                    ? "Please wait..."
                    : phoneCountdown > 0
                      ? `Resend mobile OTP in ${formatCountdown(phoneCountdown)}`
                      : "Generate new mobile OTP"}
                </button>
              </form>
            </>
          )}

          {step === "pin-recovery-email" && (
            <>
              <button
                type="button"
                className="onboarding-back"
                onClick={() => {
                  clearMessages();
                  setStep("login-pin");
                }}
                disabled={loading}
              >
                <ArrowLeft size={16} /> Back to Entry PIN
              </button>

              <div className="onboarding-card-icon">
                <LockKeyhole size={23} />
              </div>

              <h2>Recover your PIN</h2>

              <p className="onboarding-description">
                Select which PIN you need to reset. We will verify your
                registered email and mobile number.
              </p>

              <form
                onSubmit={requestPinRecoveryEmail}
                className="onboarding-form"
              >
                <label htmlFor="recovery-pin-type">PIN to recover</label>
                <select
                  id="recovery-pin-type"
                  className="onboarding-text-input"
                  value={recoveryPinType}
                  onChange={(event) => setRecoveryPinType(event.target.value)}
                  disabled={loading}
                >
                  <option value="ENTRY_PIN">Entry PIN — unlock U-Pay</option>
                  <option value="TRANSACTION_PIN">
                    Transaction PIN — authorize payments
                  </option>
                </select>

                <label htmlFor="recovery-email">Registered email address</label>
                <input
                  id="recovery-email"
                  className="onboarding-text-input"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={recoveryEmail}
                  onChange={(event) => setRecoveryEmail(event.target.value)}
                  required
                  disabled={loading}
                />

                <p className="onboarding-field-hint">
                  Use the email address associated with your U-Pay account.
                </p>

                {error && <p className="onboarding-error" role="alert">{error}</p>}
                {notice && <p className="onboarding-field-hint" role="status">{notice}</p>}

                <button
                  className="onboarding-primary"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Sending code..." : "Send email code"}
                  {!loading && <ArrowRight size={18} />}
                </button>
              </form>
            </>
          )}

          {step === "pin-recovery-email-otp" && (
            <>
              <button
                type="button"
                className="onboarding-back"
                onClick={() => {
                  clearMessages();
                  setRecoveryOtp("");
                  setStep("pin-recovery-email");
                }}
                disabled={loading}
              >
                <ArrowLeft size={16} /> Back
              </button>

              <div className="onboarding-card-icon">
                <Mail size={23} />
              </div>

              <h2>Verify your email</h2>

              <p className="onboarding-description">
                Enter the 6-digit verification code sent to{" "}
                <strong>{recoveryEmail}</strong>.
              </p>

              <form
                onSubmit={verifyPinRecoveryEmail}
                className="onboarding-form"
              >
                <label htmlFor="recovery-email-otp">Email verification code</label>
                <input
                  id="recovery-email-otp"
                  className="onboarding-otp-input"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="6-digit code"
                  value={recoveryOtp}
                  onChange={(event) => {
                    setRecoveryOtp(
                      event.target.value.replace(/\D/g, "").slice(0, 6)
                    );
                    setError("");
                  }}
                  required
                />

                <p className="onboarding-field-hint">
                  The verification code expires. If it expires, restart recovery
                  to request a new code.
                </p>

                {error && <p className="onboarding-error" role="alert">{error}</p>}
                {notice && <p className="onboarding-field-hint" role="status">{notice}</p>}

                <button
                  className="onboarding-primary"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Verifying..." : "Verify email"}
                  {!loading && <ArrowRight size={18} />}
                </button>
              </form>
            </>
          )}

          {step === "pin-recovery-phone-otp" && (
            <>
              <button
                type="button"
                className="onboarding-back"
                onClick={() => {
                  clearMessages();
                  setRecoveryOtp("");
                  setRecoveryResetToken("");
                  setStep("pin-recovery-email");
                }}
                disabled={loading}
              >
                <ArrowLeft size={16} /> Restart recovery
              </button>

              <div className="onboarding-card-icon">
                <Smartphone size={23} />
              </div>

              <h2>Verify your mobile</h2>

              <p className="onboarding-description">
                Enter the verification code sent to your registered mobile
                number, then create a new{" "}
                {recoveryPinType === "ENTRY_PIN" ? "Entry PIN" : "Transaction PIN"}.
              </p>

              <form
                onSubmit={completePinRecovery}
                className="onboarding-form"
              >
                <label htmlFor="recovery-phone-otp">Mobile verification code</label>
                <input
                  id="recovery-phone-otp"
                  className="onboarding-otp-input"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="6-digit code"
                  value={recoveryOtp}
                  onChange={(event) => {
                    setRecoveryOtp(
                      event.target.value.replace(/\D/g, "").slice(0, 6)
                    );
                    setError("");
                  }}
                  required
                />

                <label htmlFor="recovery-new-pin">New PIN</label>
                <input
                  id="recovery-new-pin"
                  className="onboarding-otp-input"
                  type="password"
                  inputMode="numeric"
                  autoComplete="new-password"
                  minLength={4}
                  maxLength={6}
                  pattern="[0-9]{4,6}"
                  placeholder="Enter new 4–6 digit PIN"
                  value={recoveryNewPin}
                  onChange={(event) => {
                    setRecoveryNewPin(
                      event.target.value.replace(/\D/g, "").slice(0, 6)
                    );
                    setError("");
                  }}
                  required
                />

                <label htmlFor="recovery-confirm-pin">Confirm new PIN</label>
                <input
                  id="recovery-confirm-pin"
                  className="onboarding-otp-input"
                  type="password"
                  inputMode="numeric"
                  autoComplete="new-password"
                  minLength={4}
                  maxLength={6}
                  pattern="[0-9]{4,6}"
                  placeholder="Re-enter new PIN"
                  value={recoveryConfirmPin}
                  onChange={(event) => {
                    setRecoveryConfirmPin(
                      event.target.value.replace(/\D/g, "").slice(0, 6)
                    );
                    setError("");
                  }}
                  required
                />

                <p className="onboarding-field-hint">
                  After a successful reset, all existing sessions are revoked
                  and you must sign in again.
                </p>

                {error && <p className="onboarding-error" role="alert">{error}</p>}
                {notice && <p className="onboarding-field-hint" role="status">{notice}</p>}

                <button
                  className="onboarding-primary"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Resetting PIN..." : "Reset PIN"}
                  {!loading && <ArrowRight size={18} />}
                </button>
              </form>
            </>
          )}

          {step === "login-pin" && (
            <>
              <div className="onboarding-card-icon">
                <LockKeyhole size={23} />
              </div>

              <h2>Unlock U-Pay</h2>

              <p className="onboarding-description">
                Welcome back, <strong>{name || "there"}</strong>. Enter your Entry PIN to continue.
              </p>

              <div className="onboarding-bank-notice">
                <ShieldCheck size={18} />
                <span>
                  <strong>Your wallet stays protected</strong>
                  <small>Never share your Entry PIN with anyone.</small>
                </span>
              </div>

              <button
                type="button"
                className="onboarding-back"
                onClick={startPinRecovery}
                disabled={loading}
              >
                Forgot PIN?
              </button>

              <form onSubmit={verifyLoginPin} className="onboarding-form">
                <label htmlFor="login-entry-pin">Entry PIN</label>
                <input
                  id="login-entry-pin"
                  className="onboarding-otp-input"
                  type="password"
                  inputMode="numeric"
                  autoComplete="current-password"
                  minLength={4}
                  maxLength={6}
                  pattern="[0-9]{4,6}"
                  placeholder="Enter your Entry PIN"
                  value={pinValue}
                  onChange={(event) => {
                    setPinValue(event.target.value.replace(/\D/g, "").slice(0, 6));
                    setError("");
                  }}
                  required
                />

                {error && <p className="onboarding-error" role="alert">{error}</p>}
                {notice && <p className="onboarding-field-hint" role="status">{notice}</p>}

                <button className="onboarding-primary" type="submit" disabled={loading}>
                  {loading ? "Unlocking..." : "Unlock U-Pay"}
                  {!loading && <ArrowRight size={18} />}
                </button>

                <button
                  className="onboarding-back"
                  type="button"
                  onClick={() => {
                    clearMessages();
                    setPinValue("");
                    setOtp("");
                    setIsLoginFlow(false);
                    setStep("login-email");
                  }}
                  disabled={loading}
                >
                  Use another account
                </button>
              </form>
            </>
          )}

          {(step === "entry-pin" || step === "transaction-pin") && (
            <>
              <div className="onboarding-card-icon">
                <LockKeyhole size={23} />
              </div>

              <h2>
                {step === "entry-pin" ? "Create your Entry PIN" : "Create your Transaction PIN"}
              </h2>

              <p className="onboarding-description">
                {step === "entry-pin"
                  ? "Use this PIN to unlock your U-Pay wallet."
                  : "Use this separate PIN to authorize payments."}
              </p>

              <div className="onboarding-bank-notice">
                <ShieldCheck size={18} />
                <span>
                  <strong>Keep your PIN private</strong>
                  <small>
                    Choose 4–6 digits. Do not reuse a PIN you use for your real bank account.
                  </small>
                </span>
              </div>

              <form onSubmit={submitPinSetup} className="onboarding-form">
                <label htmlFor="upay-pin">
                  {step === "entry-pin" ? "Entry PIN" : "Transaction PIN"}
                </label>
                <input
                  id="upay-pin"
                  className="onboarding-otp-input"
                  type="password"
                  inputMode="numeric"
                  autoComplete="new-password"
                  minLength={4}
                  maxLength={6}
                  pattern="[0-9]{4,6}"
                  placeholder="Enter 4–6 digit PIN"
                  value={pinValue}
                  onChange={(event) => {
                    setPinValue(event.target.value.replace(/\D/g, "").slice(0, 6));
                    setError("");
                  }}
                  required
                />

                <label htmlFor="upay-confirm-pin">Confirm PIN</label>
                <input
                  id="upay-confirm-pin"
                  className="onboarding-otp-input"
                  type="password"
                  inputMode="numeric"
                  autoComplete="new-password"
                  minLength={4}
                  maxLength={6}
                  pattern="[0-9]{4,6}"
                  placeholder="Re-enter PIN"
                  value={confirmPin}
                  onChange={(event) => {
                    setConfirmPin(event.target.value.replace(/\D/g, "").slice(0, 6));
                    setError("");
                  }}
                  required
                />

                {error && <p className="onboarding-error" role="alert">{error}</p>}
                {notice && <p className="onboarding-field-hint" role="status">{notice}</p>}

                <button className="onboarding-primary" type="submit" disabled={loading}>
                  {loading
                    ? "Saving securely..."
                    : step === "entry-pin"
                      ? "Save Entry PIN"
                      : "Save Transaction PIN"}
                  {!loading && <ArrowRight size={18} />}
                </button>
              </form>
            </>
          )}

          {(step === "details" || step === "login-email") && (
            <div className="onboarding-auth-switch">
              <span>
                {step === "details"
                  ? "Already have a U-Pay account?"
                  : "New to U-Pay?"}
              </span>
              <button
                type="button"
                onClick={() => {
                  clearMessages();
                  setOtp("");
                  setPinValue("");
                  setConfirmPin("");
                  setIsLoginFlow(step === "details");
                  setStep(step === "details" ? "login-email" : "details");
                }}
                disabled={loading}
              >
                {step === "details" ? "Sign in" : "Create account"}
              </button>
            </div>
          )}

          <div className="onboarding-disclaimer">
            <ShieldCheck size={16} />
            <span>
              U-Pay uses a simulated wallet for exploring payment flows.
              Email verification is handled by the backend. Mobile OTP is
              development-only, and real bank transfers are not supported.
            </span>
          </div>
        </section>
      </div>

      <footer className="onboarding-footer">
        <span>u-pay</span>
        <span>Your U-Pay wallet</span>
      </footer>
    </main>
  );
}
