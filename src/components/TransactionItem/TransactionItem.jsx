import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import PersonAvatar from "../PersonAvatar/PersonAvatar";
import { formatDateTime, formatMoney } from "../../utils/format";
import "./TransactionItem.css";
export default function TransactionItem({ transaction, index = 0, onClick }) {
  const received = transaction.type === "received";
  return <button className="transaction-item" onClick={() => onClick?.(transaction)} type="button">
    <PersonAvatar name={transaction.person} index={index}/>
    <div className="transaction-person">
      <strong>{transaction.person}</strong>
      <span>{formatDateTime(transaction.date)} · {transaction.note || (received ? "Received via UPI" : "Sent via UPI")}</span>
    </div>
    <div className={`transaction-amount ${received ? "received" : "sent"}`}>
      <span className="transaction-direction">{received ? <ArrowDownLeft size={15}/> : <ArrowUpRight size={15}/>}</span>
      <strong>{received ? "+" : "−"}{formatMoney(transaction.amount).replace("₹", "₹")}</strong>
    </div>
  </button>;
}
