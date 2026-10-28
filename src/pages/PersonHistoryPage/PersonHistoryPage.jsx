import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowDownLeft,
  ArrowUpRight,
  CalendarClock,
  Send,
  UserRound,
  ShieldCheck,
  Clock3,
} from "lucide-react";
import { contacts } from "../../data/seedData";
import { useWallet } from "../../context/WalletContext";
import { formatMoney } from "../../utils/format";
import PersonAvatar from "../../components/PersonAvatar/PersonAvatar";
import SendMoneyModal from "../../components/SendMoneyModal/SendMoneyModal";
import "./PersonHistoryPage.css";

export default function PersonHistoryPage() {
  const { personId } = useParams();
  const navigate = useNavigate();
  const { transactions } = useWallet();
  const [sendOpen, setSendOpen] = useState(false);

  const person = contacts.find(
    (contact) =>
      encodeURIComponent(contact.upiId) === personId ||
      contact.upiId === personId
  );

  const personTransactions = useMemo(() => {
    if (!person) return [];

    return transactions
      .filter(
        (item) =>
          item.person?.trim().toLowerCase() ===
          person.name.trim().toLowerCase()
      )
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [transactions, person]);

  const totalSent = personTransactions
    .filter((item) => item.type === "sent")
    .reduce((total, item) => total + Number(item.amount || 0), 0);

  const totalReceived = personTransactions
    .filter((item) => item.type === "received")
    .reduce((total, item) => total + Number(item.amount || 0), 0);

  const startSend = (amount = "") => {
    setSendOpen(true);

    window.setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("upay:prefill-send-amount", {
          detail: String(amount || ""),
        })
      );
    }, 0);
  };

  if (!person) {
    return (
      <main className="person-history-page page-enter">
        <button
          className="person-history-back"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={20} />
          Back
        </button>

        <section className="person-history-not-found">
          <UserRound size={36} />
          <h1>Person not found</h1>
          <p>This contact isn't available in your U-Pay contacts.</p>
          <button onClick={() => navigate("/")}>Go to Home</button>
        </section>
      </main>
    );
  }

  const groupedTransactions = personTransactions.reduce((groups, item) => {
    const key = new Date(item.date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
    return groups;
  }, {});

  return (
    <main className="person-history-page page-enter">
      <header className="person-history-topbar">
        <button
          type="button"
          className="person-history-back-icon"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          <ArrowLeft size={22} />
        </button>

        <div className="person-history-topbar-title">
          <span>Payments</span>
          <small>Contact details</small>
        </div>

        <span className="person-history-topbar-spacer" />
      </header>

      <section className="person-history-profile">
        <div className="person-history-avatar-ring">
          <PersonAvatar name={person.name} size="lg" />
          <span className="person-history-online-dot" />
        </div>

        <h1>{person.name}</h1>
        <p className="person-history-upi">{person.upiId}</p>
        <p className="person-history-phone">{person.phone}</p>

        <div className="person-history-verified">
          <ShieldCheck size={14} />
          <span>U-Pay contact</span>
        </div>
      </section>

      <section className="person-history-summary">
        <div className="person-history-summary-item">
          <span className="person-history-summary-icon sent">
            <ArrowUpRight size={18} />
          </span>
          <div>
            <small>Total sent</small>
            <strong>{formatMoney(totalSent)}</strong>
          </div>
        </div>

        <div className="person-history-summary-divider" />

        <div className="person-history-summary-item">
          <span className="person-history-summary-icon received">
            <ArrowDownLeft size={18} />
          </span>
          <div>
            <small>Total received</small>
            <strong>{formatMoney(totalReceived)}</strong>
          </div>
        </div>
      </section>

      <section className="person-history-transactions">
        <header className="person-history-section-heading">
          <div>
            <h2>Transaction history</h2>
            <p>
              {personTransactions.length}{" "}
              {personTransactions.length === 1
                ? "transaction"
                : "transactions"}{" "}
              with {person.name}
            </p>
          </div>

          <span className="person-history-count-icon">
            <CalendarClock size={19} />
          </span>
        </header>

        {personTransactions.length === 0 ? (
          <div className="person-history-empty">
            <span className="person-history-empty-icon">
              <CalendarClock size={28} />
            </span>
            <h3>No transactions yet</h3>
            <p>
              Payments you make to or record with {person.name} will appear
              here.
            </p>
            <button
              className="person-history-empty-pay"
              type="button"
              onClick={() => startSend()}
            >
              <Send size={17} />
              Pay {person.name}
            </button>
          </div>
        ) : (
          Object.entries(groupedTransactions).map(([date, items]) => (
            <section className="person-history-day" key={date}>
              <div className="person-history-date-label">
                <span>{date}</span>
                <span>{items.length} {items.length === 1 ? "payment" : "payments"}</span>
              </div>

              {items.map((item) => (
                <article
                  className="person-history-transaction"
                  key={item.id}
                >
                  <span
                    className={`person-history-transaction-icon ${item.type}`}
                  >
                    {item.type === "received" ? (
                      <ArrowDownLeft size={20} />
                    ) : (
                      <ArrowUpRight size={20} />
                    )}
                  </span>

                  <div className="person-history-transaction-info">
                    <strong>
                      {item.type === "received" ? "Received from" : "Paid to"}{" "}
                      {person.name}
                    </strong>

                    <span className="person-history-transaction-time">
                      <Clock3 size={12} />
                      {new Date(item.date).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>

                    {item.note && (
                      <small className="person-history-note">
                        {item.note}
                      </small>
                    )}

                    {item.type === "sent" && (
                      <button
                        className="person-history-repeat"
                        type="button"
                        onClick={() => startSend(item.amount)}
                      >
                        Pay again
                      </button>
                    )}
                  </div>

                  <strong className={`person-history-amount ${item.type}`}>
                    {item.type === "received" ? "+" : "−"}
                    {formatMoney(item.amount)}
                  </strong>
                </article>
              ))}
            </section>
          ))
        )}
      </section>

      <footer className="person-history-disclaimer">
        <ShieldCheck size={14} />
        <span>
          Only transactions recorded in this browser are shown.
        </span>
      </footer>

      <SendMoneyModal
        open={sendOpen}
        initialRecipient={person.name}
        fixedRecipient
        onClose={() => setSendOpen(false)}
      />
    </main>
  );
}
