import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "./AuthContext";

const WalletContext = createContext(null);

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000"
).replace(/\/+$/, "");

const EMPTY_WALLET = {
  profile: {
    id: "",
    name: "",
    phone: "",
    email: "",
    upiId: "",
    balance: 0,
    currency: "INR",
  },
  transactions: [],
};

async function walletRequest(path, token, options = {}) {
  const response = await fetch(`${API_BASE_URL}/api/wallet${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-session-token": token,
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      data?.error?.message || "Could not communicate with your wallet."
    );

    error.code = data?.error?.code || "WALLET_REQUEST_FAILED";
    error.status = response.status;
    error.retryAfterSeconds = data?.error?.retryAfterSeconds;

    throw error;
  }

  return data;
}

function normalizeTransaction(transaction) {
  return {
    ...transaction,
    id: transaction.id || transaction.reference,
    person:
      transaction.person ||
      transaction.recipientName ||
      "UPI payment",
    amount: Number(transaction.amount || 0),
    type: transaction.type || "sent",
    date: transaction.date || new Date().toISOString(),
    note: transaction.note || "",
  };
}

function normalizeProfile(profile) {
  return {
    id: profile.id || "",
    name: profile.name || "",
    phone: profile.phone || "",
    email: profile.email || "",
    upiId: profile.upiId || "",
    balance: Number(profile.balance || 0),
    currency: profile.currency || "INR",
  };
}

export function WalletProvider({ children }) {
  const { user, sessionToken } = useAuth();

  const [wallet, setWallet] = useState(EMPTY_WALLET);
  const [isLoading, setIsLoading] = useState(false);
  const [walletError, setWalletError] = useState("");

  const refreshWallet = useCallback(async () => {
    if (!sessionToken || !user?.id) {
      setWallet(EMPTY_WALLET);
      setWalletError("");
      return null;
    }

    setIsLoading(true);
    setWalletError("");

    try {
      const [walletData, transactionData] = await Promise.all([
        walletRequest("/", sessionToken),
        walletRequest("/transactions?limit=100", sessionToken),
      ]);

      const nextWallet = {
        profile: normalizeProfile(walletData.profile),
        transactions: Array.isArray(transactionData.transactions)
          ? transactionData.transactions.map(normalizeTransaction)
          : [],
      };

      setWallet(nextWallet);
      return nextWallet;
    } catch (error) {
      setWalletError(error.message || "Could not load your wallet.");
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [sessionToken, user?.id]);

  useEffect(() => {
    let active = true;

    if (!sessionToken || !user?.id) {
      setWallet(EMPTY_WALLET);
      setWalletError("");
      setIsLoading(false);
      return undefined;
    }

    setIsLoading(true);
    setWalletError("");

    Promise.all([
      walletRequest("/", sessionToken),
      walletRequest("/transactions?limit=100", sessionToken),
    ])
      .then(([walletData, transactionData]) => {
        if (!active) return;

        setWallet({
          profile: normalizeProfile(walletData.profile),
          transactions: Array.isArray(transactionData.transactions)
            ? transactionData.transactions.map(normalizeTransaction)
            : [],
        });
      })
      .catch((error) => {
        if (!active) return;
        setWalletError(error.message || "Could not load your wallet.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [sessionToken, user?.id]);

  const updateProfile = useCallback((updates) => {
    setWallet((current) => ({
      ...current,
      profile: {
        ...current.profile,
        ...updates,
      },
    }));
  }, []);

  const sendMoney = useCallback(
    async ({
      person,
      amount,
      note = "",
      recipientUpiId = "",
      pin = "",
      idempotencyKey,
    }) => {
      const recipientName = String(person || "").trim();
      const value = Number(amount);

      if (!recipientName) {
        throw new Error("Enter a recipient name or UPI ID.");
      }

      if (!Number.isFinite(value) || value <= 0) {
        throw new Error("Enter a valid amount.");
      }

      if (!sessionToken || !user?.id) {
        throw new Error("Please sign in to make a demo payment.");
      }

      if (!/^\d{4,6}$/.test(String(pin))) {
        throw new Error("Enter your 4–6 digit Transaction PIN.");
      }

      const result = await walletRequest("/payments", sessionToken, {
        method: "POST",
        headers: idempotencyKey
          ? { "x-idempotency-key": idempotencyKey }
          : {},
        body: JSON.stringify({
          recipientName,
          recipientUpiId: String(recipientUpiId || "").trim() || undefined,
          amount: value,
          note: String(note || "").trim(),
          pin: String(pin),
          idempotencyKey,
        }),
      });

      await refreshWallet();

      return normalizeTransaction(result.transaction);
    },
    [sessionToken, user?.id, refreshWallet]
  );

  const addDemoFunds = useCallback(
    async (amount) => {
      const value = Number(amount);

      if (!Number.isFinite(value) || value < 1 || value > 100000) {
        throw new Error("Enter demo funds between ₹1 and ₹1,00,000.");
      }

      if (!sessionToken || !user?.id) {
        throw new Error("Please sign in to access your wallet.");
      }

      const result = await walletRequest("/demo-funds", sessionToken, {
        method: "POST",
        body: JSON.stringify({ amount: value }),
      });

      await refreshWallet();

      return result.transaction
        ? normalizeTransaction(result.transaction)
        : null;
    },
    [sessionToken, user?.id, refreshWallet]
  );

  const startNewDemoAccount = useCallback(({ name, phone, email }) => {
    // Temporary display state only. The server remains the source of truth.
    setWallet((current) => ({
      ...current,
      profile: {
        ...current.profile,
        name: String(name || "").trim(),
        phone: String(phone || ""),
        email: String(email || "").trim().toLowerCase(),
      },
    }));
  }, []);

  const resetDemo = useCallback(async () => {
    // Never reset a server-backed wallet from the browser.
    await refreshWallet();
  }, [refreshWallet]);

  const value = useMemo(
    () => ({
      ...wallet,
      isLoading,
      walletError,
      refreshWallet,
      updateProfile,
      sendMoney,
      addDemoFunds,
      startNewDemoAccount,
      resetDemo,
    }),
    [
      wallet,
      isLoading,
      walletError,
      refreshWallet,
      updateProfile,
      sendMoney,
      addDemoFunds,
      startNewDemoAccount,
      resetDemo,
    ]
  );

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);

  if (!context) {
    throw new Error("useWallet must be used inside WalletProvider.");
  }

  return context;
}
