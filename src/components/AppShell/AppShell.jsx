import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import BottomNav from "../BottomNav/BottomNav";
import "./AppShell.css";

const pageTitles = {
  "/": "Home",
  "/history": "Transaction history",
  "/upi": "Scan & pay",
  "/balance": "Your balance",
  "/profile": "Profile"
};

export default function AppShell({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="app-shell">
      <header className="app-topbar">
        <button
          className="app-brand-button"
          type="button"
          onClick={() => navigate("/")}
          aria-label="Go to u-pay home"
        >
          <span className="brand-mark">u<span>.</span></span>
          <span className="app-brand-name">u-pay</span>
        </button>

        <div className="topbar-title">
          {pageTitles[location.pathname] || "u-pay"}
        </div>

        <button
          className="app-user-chip"
          type="button"
          title="Open profile and account settings"
          onClick={() => navigate("/profile")}
        >
          <span className="app-user-avatar">
            {(user?.name || "U").charAt(0).toUpperCase()}
          </span>
          <span className="app-user-name">
            {user?.name?.split(" ")[0] || "Account"}
          </span>
        </button>
      </header>

      <main className="app-main">{children}</main>
      <BottomNav />
    </div>
  );
}
