import { Eye, EyeOff, ShieldCheck, Wallet } from "lucide-react";
import { useState } from "react";
import { useWallet } from "../../context/WalletContext";
import { formatMoney } from "../../utils/format";
import Toast from "../../components/Toast/Toast";
import "./BalancePage.css";

export default function BalancePage() {
  const {
    profile,
    transactions,
    isLoading,
    walletError,
    refreshWallet,
  } = useWallet();

  const [showBalance, setShowBalance] = useState(true);
  const [toast, setToast] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const sent = transactions
    .filter((item) => item.type === "sent")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const received = transactions
    .filter((item) => item.type === "received")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const handleRefresh = async () => {
    setRefreshing(true);

    try {
      await refreshWallet();

      setToast({
        type: "success",
        message: "Wallet details refreshed.",
      });
    } catch (error) {
      setToast({
        type: "error",
        message: error.message || "Could not refresh wallet.",
      });
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="balance-page page-enter">
      <div className="balance-page-intro">
        <span className="eyebrow">WALLET OVERVIEW</span>
        <h1>Your balance</h1>
        <p>View your wallet balance and payment activity.</p>
      </div>

      <section className="balance-hero">
        <div className="balance-hero-top">
          <span className="balance-hero-icon">
            <Wallet size={22} />
          </span>

          <span className="balance-account-status">
            <span /> Wallet
          </span>
        </div>

        <span className="balance-caption">Available balance</span>

        <div className="balance-amount-line">
          <strong>
            {showBalance ? formatMoney(profile.balance) : "₹ ••••••"}
          </strong>

          <button
            type="button"
            onClick={() => setShowBalance((value) => !value)}
            aria-label={showBalance ? "Hide balance" : "Show balance"}
          >
            {showBalance ? <EyeOff size={19} /> : <Eye size={19} />}
          </button>
        </div>

        <div className="balance-owner">{profile.name}</div>

        <div className="balance-hero-bottom">
          <span>
            <Wallet size={16} /> U-Pay wallet
          </span>
          <span>Wallet balance</span>
        </div>
      </section>

      {walletError && (
        <div className="balance-security-note" role="alert">
          <ShieldCheck size={18} />
          <span>{walletError}</span>
        </div>
      )}

      <div className="balance-summary-grid">
        <div>
          <span>Sent in history</span>
          <strong>{formatMoney(sent)}</strong>
        </div>

        <div>
          <span>Received in history</span>
          <strong>{formatMoney(received)}</strong>
        </div>
      </div>

      <div className="balance-security-note">
        <ShieldCheck size={18} />
        <span>
          Your balance and transaction history are available here.
          This wallet is not linked to a bank account.
          Share your QR code so others can find your UPI ID.
        </span>
      </div>

      <button
        className="secondary-button full-button"
        type="button"
        onClick={handleRefresh}
        disabled={refreshing || isLoading}
      >
        {refreshing ? "Refreshing…" : "Refresh wallet"}
      </button>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
