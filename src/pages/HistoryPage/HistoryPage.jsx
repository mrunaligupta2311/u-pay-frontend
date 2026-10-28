import { useMemo, useState } from "react";
import { CalendarDays, X } from "lucide-react";
import { useWallet } from "../../context/WalletContext";
import SearchBar from "../../components/SearchBar/SearchBar";
import TransactionItem from "../../components/TransactionItem/TransactionItem";
import SectionHeading from "../../components/SectionHeading/SectionHeading";
import "./HistoryPage.css";

const filterOptions = [{ value: "all", label: "All" }, { value: "sent", label: "Sent" }, { value: "received", label: "Received" }];

export default function HistoryPage() {
  const { transactions } = useWallet();
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [date, setDate] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const filtered = useMemo(() => transactions.filter((transaction) => {
    const matchesSearch = `${transaction.person} ${transaction.note || ""} ${transaction.amount}`.toLowerCase().includes(search.toLowerCase());
    const matchesType = type === "all" || transaction.type === type;
    const transactionDate = new Date(transaction.date);
    const matchesDate = !date || `${transactionDate.getFullYear()}-${String(transactionDate.getMonth()+1).padStart(2,"0")}-${String(transactionDate.getDate()).padStart(2,"0")}` === date;
    return matchesSearch && matchesType && matchesDate;
  }).sort((a,b) => new Date(b.date)-new Date(a.date)), [transactions, search, type, date]);

  const dateLabel = date ? new Date(`${date}T12:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "Date";
  return <div className="history-page page-enter">
    <div className="history-intro"><span className="eyebrow">YOUR ACTIVITY</span><h1>Transaction history</h1><p>Every send and receive, all in one place.</p></div>
    <SearchBar value={search} onChange={setSearch} placeholder="Search name, amount or note"/>
    <section className="history-controls">
      <div className="history-control-title"><SectionHeading title="Your transactions" subtitle={`${filtered.length} transaction${filtered.length === 1 ? "" : "s"} found`}/></div>
      <div className="history-filter-row">
        <div className="calendar-filter-wrap">
          <button className={`calendar-filter ${date ? "selected" : ""}`} onClick={() => setCalendarOpen((value) => !value)}><CalendarDays size={16}/>{dateLabel}{date && <X size={13} onClick={(e) => {e.stopPropagation();setDate("");setCalendarOpen(false);}}/>}</button>
          {calendarOpen && <div className="calendar-popover"><label>Select date<input type="date" value={date} max={new Date().toISOString().slice(0,10)} onChange={(e) => {setDate(e.target.value);setCalendarOpen(false);}}/></label><button onClick={() => {setDate("");setCalendarOpen(false);}}>Clear date filter</button></div>}
        </div>
        <div className="type-filter" role="group" aria-label="Transaction type">{filterOptions.map((option) => <button key={option.value} className={type === option.value ? "active" : ""} onClick={() => setType(option.value)}>{option.label}</button>)}</div>
      </div>
    </section>
    <section className="history-list-card">
      {filtered.length ? filtered.map((transaction, index) => <TransactionItem key={transaction.id} transaction={transaction} index={index} />) : <div className="history-empty"><span><CalendarDays size={24}/></span><strong>No transactions found</strong><p>Try changing your search or filters.</p><button onClick={() => {setSearch("");setType("all");setDate("");}}>Clear all filters</button></div>}
    </section>
    <p className="history-disclaimer">Transaction history is saved in this browser only.</p>
  </div>;
}
