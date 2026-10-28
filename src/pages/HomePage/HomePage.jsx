import { useMemo, useState } from "react";
import { ArrowRight, CircleHelp, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { contacts } from "../../data/seedData";
import { useWallet } from "../../context/WalletContext";
import { formatMoney } from "../../utils/format";
import SearchBar from "../../components/SearchBar/SearchBar";
import UpiIdCard from "../../components/UpiIdCard/UpiIdCard";
import QuickActions from "../../components/QuickActions/QuickActions";
import PersonAvatar from "../../components/PersonAvatar/PersonAvatar";
import TransactionItem from "../../components/TransactionItem/TransactionItem";
import SectionHeading from "../../components/SectionHeading/SectionHeading";
import SendMoneyModal from "../../components/SendMoneyModal/SendMoneyModal";
import MyQrModal from "../../components/MyQrModal/MyQrModal";
import "./HomePage.css";

export default function HomePage() {
  const { profile, transactions } = useWallet();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [recipient, setRecipient] = useState("");
  const [sendOpen, setSendOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const matchingContacts = useMemo(() => contacts.filter((contact) =>
    `${contact.name} ${contact.phone} ${contact.upiId}`.toLowerCase().includes(search.toLowerCase())
  ), [search]);
  const startSend = (name = "", amount = "") => {
    setRecipient(name);
    setSendOpen(true);
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent("upay:prefill-send-amount", { detail: amount }));
    }, 0);
  };

  const openPerson = (contact) => navigate(`/person/${encodeURIComponent(contact.upiId)}`);

  return <div className="home-page page-enter">
    <section className="home-welcome">
      <div><div className="welcome-kicker"><Sparkles size={13}/> YOUR EVERYDAY PAYMENTS</div><h1>Good afternoon,<br/><span>{profile.name.split(" ")[0]}.</span></h1><p>Money moves better when it's simple.</p></div>
      <div className="balance-peek"><span>Wallet balance</span><strong>{formatMoney(profile.balance)}</strong><button onClick={() => navigate("/balance")}>View balance <ArrowRight size={14}/></button></div>
    </section>

    <section className="home-search-section">
      <SectionHeading title="Pay anyone" subtitle="Search by name, mobile number or UPI ID"/>
      <SearchBar value={search} onChange={setSearch} placeholder="Try “Devil” or enter a UPI ID"/>
      {search && <div className="home-search-results">
        {matchingContacts.length ? matchingContacts.slice(0, 5).map((contact, index) => <button key={contact.upiId} onClick={() => {setSearch("");openPerson(contact);}}><PersonAvatar name={contact.name} index={index}/><span><strong>{contact.name}</strong><small>{contact.phone} · {contact.upiId}</small></span><ArrowRight size={17}/></button>) : <button onClick={() => {setSearch("");startSend(search);}}><span className="search-fallback"><CircleHelp size={20}/></span><span><strong>Continue with “{search}”</strong><small>Use this name, number or UPI ID</small></span><ArrowRight size={17}/></button>}
      </div>}
    </section>

    <section className="home-upi-section"><UpiIdCard onShowQr={() => setQrOpen(true)}/></section>
    <section className="home-actions-section"><SectionHeading title="Quick actions"/><QuickActions onShowQr={() => setQrOpen(true)}/></section>

    <section className="recent-people-section">
      <SectionHeading title="Send again" subtitle="Your recent people" action={<button className="text-link" onClick={() => navigate("/history")}>View history <ArrowRight size={14}/></button>}/>
      <div className="recent-people-grid">{contacts.slice(0, 10).map((contact, index) => <button key={contact.upiId} className="recent-person" onClick={() => openPerson(contact)}><PersonAvatar name={contact.name} size="lg" index={index}/><span>{contact.name}</span></button>)}</div>
    </section>

    <section className="home-history-section">
      <SectionHeading title="Recent transactions" subtitle="Recent wallet activity" action={<button className="text-link" onClick={() => navigate("/history")}>See all <ArrowRight size={14}/></button>}/>
      <div className="home-transaction-card">{transactions.slice(0, 5).map((transaction, index) => <TransactionItem key={transaction.id} transaction={transaction} index={index} onClick={() => navigate("/history")}/>)}{transactions.length === 0 && <p className="empty-state">No transactions yet.</p>}</div>
    </section>
    <p className="home-disclaimer">Transactions are simulated. No real money is transferred.</p>
    <SendMoneyModal open={sendOpen} initialRecipient={recipient} onClose={() => setSendOpen(false)}/>
    <MyQrModal open={qrOpen} onClose={() => setQrOpen(false)}/>


  </div>;
}
