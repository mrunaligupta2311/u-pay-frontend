import { House, History, ScanLine, Wallet, UserRound } from "lucide-react";
import { NavLink } from "react-router-dom";
import "./BottomNav.css";

const items = [
  { to: "/", label: "Home", Icon: House, end: true },
  { to: "/history", label: "History", Icon: History },
  { to: "/upi", label: "UPI", Icon: ScanLine },
  { to: "/balance", label: "Balance", Icon: Wallet },
  { to: "/profile", label: "Profile", Icon: UserRound }
];

export default function BottomNav() {
  return <nav className="bottom-nav" aria-label="Main navigation">
    {items.map(({ to, label, Icon, end }) => (
      <NavLink key={to} to={to} end={end} className={({ isActive }) => `bottom-nav-item${isActive ? " active" : ""}`}>
        <span className="nav-icon"><Icon size={21} strokeWidth={2.1} /></span>
        <span>{label}</span>
      </NavLink>
    ))}
  </nav>;
}
