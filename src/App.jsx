import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/AppShell/AppShell";
import AuthPage from "./pages/AuthPage/AuthPage";
import HomePage from "./pages/HomePage/HomePage";
import HistoryPage from "./pages/HistoryPage/HistoryPage";
import UpiPage from "./pages/UpiPage/UpiPage";
import BalancePage from "./pages/BalancePage/BalancePage";
import ProfilePage from "./pages/ProfilePage/ProfilePage";
import { useAuth } from "./context/AuthContext";

export default function App() {
  const { user } = useAuth();

  if (!user) {
    return <AuthPage />;
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/upi" element={<UpiPage />} />
        <Route path="/balance" element={<BalancePage />} />
        <Route path="/profile" element={<ProfilePage />} />

        {/* Old auth URLs now lead back to the app. */}
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/register" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
