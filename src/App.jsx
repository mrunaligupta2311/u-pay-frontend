import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/AppShell/AppShell";
import AuthPage from "./pages/AuthPage/AuthPage";
import HomePage from "./pages/HomePage/HomePage";
import HistoryPage from "./pages/HistoryPage/HistoryPage";
import UpiPage from "./pages/UpiPage/UpiPage";
import BalancePage from "./pages/BalancePage/BalancePage";
import ProfilePage from "./pages/ProfilePage/ProfilePage";
import PersonHistoryPage from "./pages/PersonHistoryPage/PersonHistoryPage";
import { useAuth } from "./context/AuthContext";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);
  return null;
}

export default function App() {
  const { user } = useAuth();

  if (!user) {
    return <AuthPage />;
  }

  return (
    <AppShell>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/upi" element={<UpiPage />} />
        <Route path="/balance" element={<BalancePage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/person/:personId" element={<PersonHistoryPage />} />

        {/* Old auth URLs now lead back to the app. */}
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/register" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
