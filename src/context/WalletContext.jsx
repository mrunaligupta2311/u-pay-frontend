import { createContext, useContext, useEffect, useMemo, useState } from "react";

const WalletContext = createContext(null);
const STORAGE_KEY = "upay-demo-wallet-v2";

function readState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (error) {
    console.warn("Could not read demo wallet state", error);
  }
  return {
    profile: {
      name: "",
      phone: "",
      email: "",
      upiId: "",
      bankName: "",
      balance: 0,
      bankLinked: false
    },
    transactions: []
  };
}

export function WalletProvider({ children }) {
  const [wallet, setWallet] = useState(readState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(wallet));
  }, [wallet]);

  const updateProfile = (updates) => setWallet((current) => ({
    ...current,
    profile: { ...current.profile, ...updates }
  }));

  const sendMoney = ({ person, amount, note = "" }) => {
    const value = Number(amount);
    if (!person?.trim()) throw new Error("Enter a recipient name or UPI ID.");
    if (!Number.isFinite(value) || value <= 0) throw new Error("Enter a valid amount.");
    if (!wallet.profile.bankLinked) throw new Error("Add a bank account before sending money.");
    if (value > wallet.profile.balance) throw new Error("Insufficient balance");
    const transaction = {
      id: `tx-${Date.now()}`,
      person: person.trim(),
      amount: value,
      type: "sent",
      date: new Date().toISOString(),
      note: note.trim() || "Sent via UPI"
    };
    setWallet((current) => ({
      profile: { ...current.profile, balance: current.profile.balance - value },
      transactions: [transaction, ...current.transactions]
    }));
    return transaction;
  };

  const addDemoFunds = (amount) => {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0 || value > 100000) {
      throw new Error("Enter demo funds between ₹1 and ₹1,00,000.");
    }
    setWallet((current) => ({
      ...current,
      profile: { ...current.profile, balance: Number(current.profile.balance || 0) + value }
    }));
  };

  const resetDemo = () => setWallet({
    profile: {
      name: "",
      phone: "",
      email: "",
      upiId: "",
      bankName: "",
      balance: 0,
      bankLinked: false
    },
    transactions: []
  });

  const startNewDemoAccount = ({ name, phone, email }) => {
    const slug = String(name || "user")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "")
      .slice(0, 18) || "user";

    setWallet({
      profile: {
        name,
        phone,
        email,
        upiId: `${slug}@upay.demo`,
        bankName: "",
        balance: 0,
        bankLinked: false
      },
      transactions: []
    });
  };

  const value = useMemo(() => ({
    ...wallet, updateProfile, sendMoney, resetDemo, startNewDemoAccount, addDemoFunds
  }), [wallet]);

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) throw new Error("useWallet must be used inside WalletProvider");
  return context;
}
