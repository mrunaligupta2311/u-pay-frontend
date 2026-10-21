import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowDownLeft,
  ArrowUpRight,
  CalendarClock,
  Send,
  UserRound,
} from "lucide-react";
import { contacts } from "../../data/seedData";
import { useWallet } from "../../context/WalletContext";
import { formatMoney } from "../../utils/format";
import PersonAvatar from "../../components/PersonAvatar/PersonAvatar";
import SendMoneyModal from "../../components/SendMoneyModal/SendMoneyModal";
import "./PersonHistoryPage.css";
import { useState } from "react";

export default function PersonHistoryPage() {
  const { personId } = useParams();
  const navigate = useNavigate();
  const { transactions } = useWallet();
  const [sendOpen, setSendOpen] = useState(false);
  const [sendAmount, setSendAmount] = useState("");

  const person = contacts.find(
    (contact) => encodeURIComponent(contact.upiId) === personId ||
      contact.upiId === personId
  );

  const personTransactions = useMemo(() => {
    if (!person) return [];

    return transactions
      .filter((item) =>
        item.person?.trim().toLowerCase() === person.name.trim().toLowerCase()
      )
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [transactions, person]);

  const lastSent = personTransactions.find((item) => item.type === "sent");

  const startSend = (amount = "") => {
    setSendAmount(String(amount || ""));
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
        <button className="person-history-back" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} /> Back
        </button>
        <section className="person-history-not-found">
          <UserRound size={34} />
          <h1>Person not found</h1>
          <p>This contact isn't available in the demo contact list.</p>
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
          <ArrowLeft size={23} />
        </button>
        <span>Contact details</span>
        <span className="person-history-topbar-spacer" />
      </header>

      <section className="person-history-profile">
        <PersonAvatar name={person.name} size="lg" />
        <h1>{person.name}</h1>
        <p className="person-history-upi">{person.upiId}</p>
        <p className="person-history-phone">{person.phone}</p>

        <div className="person-history-actions">
          <button type="button" onClick={() => startSend(lastSent?.amount ?? "")}>
            <span><Send size={21} /></span>
            <strong>Pay</strong>
          </button>
        </div>
      </section>

      <section className="person-history-transactions">
        <header className="person-history-section-heading">
          <div>
            <h2>History</h2>
            <p>
              {personTransactions.length} recorded{" "}
              {personTransactions.length === 1 ? "transaction" : "transactions"}
            </p>
          </div>
          <CalendarClock size={21} />
        </header>

        {personTransactions.length === 0 ? (
          <div className="person-history-empty">
            <span><CalendarClock size={27} /></span>
            <h3>No transactions yet</h3>
            <p>Your payment history with {person.name} will appear here.</p>
            <button onClick={() => startSend()}>Pay {person.name}</button>
          </div>
        ) : (
          Object.entries(groupedTransactions).map(([date, items]) => (
            <section className="person-history-day" key={date}>
              <h3>{date}</h3>
              {items.map((item) => (
                <article className="person-history-transaction" key={item.id}>
                  <span className={`person-history-transaction-icon ${item.type}`}>
                    {item.type === "received"
                      ? <ArrowDownLeft size={20} />
                      : <ArrowUpRight size={20} />}
                  </span>
                  <div className="person-history-transaction-info">
                    <strong>{item.type === "received" ? "Received" : "Paid"} {person.name}</strong>
                    <span>
                      {new Date(item.date).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {item.note && <small>{item.note}</small>}
                  </div>
                  <strong className={`person-history-amount ${item.type}`}>
                    {item.type === "received" ? "+" : "−"}{formatMoney(item.amount)}
                  </strong>
                  {item.type === "sent" && (
                    <button
                      className="person-history-repeat"
                      type="button"
                      onClick={() => startSend(item.amount)}
                    >
                      Pay again
                    </button>
                  )}
                </article>
              ))}
            </section>
          ))
        )}
      </section>

      <p className="person-history-disclaimer">
        U-Pay demo · Only transactions recorded in this browser are shown.
      </p>

      <SendMoneyModal
        open={sendOpen}
        initialRecipient={person.name}
        onClose={() => setSendOpen(false)}
      />
    </main>
  );
}
