import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState
} from "react";

const AuthContext = createContext(null);
const SESSION_KEY = "upay-demo-session-v1";

function readSession() {
  try {
    const saved = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");

    // Older email/password sessions must complete the new onboarding.
    if (
      saved?.onboardingComplete === true &&
      typeof saved.phone === "string"
    ) {
      return saved;
    }
  } catch (error) {
    console.warn("Could not read u-pay demo session.", error);
  }

  return null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readSession);

  const completeOnboarding = useCallback(({ name, phone }) => {
    const cleanName = String(name || "").trim().replace(/\s+/g, " ");
    const cleanPhone = String(phone || "").replace(/\D/g, "");

    if (cleanName.length < 2) {
      throw new Error("Please enter your full name.");
    }

    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      throw new Error("Enter a valid 10-digit Indian mobile number.");
    }

    const nextUser = {
      id: `demo-${Date.now()}`,
      name: cleanName,
      phone: cleanPhone,
      onboardingComplete: true,
      createdAt: new Date().toISOString()
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(nextUser));
    setUser(nextUser);

    return nextUser;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  }, []);

  const value = useMemo(() => ({
    user,
    isAuthenticated: Boolean(user),
    completeOnboarding,
    logout
  }), [user, completeOnboarding, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
