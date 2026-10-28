import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

const AuthContext = createContext(null);

const TOKEN_KEY = "upay-backend-session-token-v1";
const USER_KEY = "upay-backend-user-v1";
const PENDING_USER_KEY = "upay-pending-backend-user-v1";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000"
).replace(/\/+$/, "");

function readStoredValue(key) {
  try {
    return JSON.parse(sessionStorage.getItem(key) || "null");
  } catch {
    return null;
  }
}

function readToken() {
  return sessionStorage.getItem(TOKEN_KEY) || "";
}

function readUser() {
  const token = readToken();
  const savedUser = readStoredValue(USER_KEY);

  if (!token || !savedUser || savedUser.onboardingComplete !== true) {
    return null;
  }

  return savedUser;
}

export function AuthProvider({ children }) {
  const [sessionToken, setSessionToken] = useState(readToken);
  const [user, setUser] = useState(readUser);

  const beginBackendSession = useCallback((token, serverUser) => {
    if (typeof token !== "string" || !token.trim()) {
      throw new Error("The server did not provide a valid session.");
    }

    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(
      PENDING_USER_KEY,
      JSON.stringify(serverUser || {})
    );
    sessionStorage.removeItem(USER_KEY);

    setSessionToken(token);
    setUser(null);
  }, []);

  const completeOnboarding = useCallback(({ name, phone, email }) => {
    const cleanName = String(name || "").trim().replace(/\s+/g, " ");
    const cleanPhone = String(phone || "").replace(/\D/g, "");
    const cleanEmail = String(email || "").trim().toLowerCase();
    const token = sessionStorage.getItem(TOKEN_KEY);

    if (!token) {
      throw new Error("Your server session has expired. Please sign up again.");
    }

    if (cleanName.length < 2) {
      throw new Error("Please enter your full name.");
    }

    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      throw new Error("Enter a valid 10-digit Indian mobile number.");
    }

    const serverUser = readStoredValue(PENDING_USER_KEY) || {};

    const nextUser = {
      id: serverUser.id || "",
      name: serverUser.fullName || cleanName,
      phone: serverUser.phoneNumber || cleanPhone,
      email: serverUser.email || cleanEmail,
      onboardingComplete: true,
      createdAt: new Date().toISOString(),
    };

    sessionStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    sessionStorage.removeItem(PENDING_USER_KEY);
    setUser(nextUser);

    return nextUser;
  }, []);

  const logout = useCallback(() => {
    const token = sessionStorage.getItem(TOKEN_KEY);

    // Clear the local session immediately; server revocation happens in parallel.
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(PENDING_USER_KEY);

    setSessionToken("");
    setUser(null);

    if (token) {
      fetch(`${API_BASE_URL}/api/security/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-token": token,
        },
        body: JSON.stringify({}),
      }).catch(() => {
        // Local logout remains effective if the server cannot be reached.
      });
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      sessionToken,
      isAuthenticated: Boolean(user && sessionToken),
      beginBackendSession,
      completeOnboarding,
      logout,
    }),
    [user, sessionToken, beginBackendSession, completeOnboarding, logout]
  );

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
