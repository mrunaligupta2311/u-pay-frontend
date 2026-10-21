import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { WalletProvider } from "./context/WalletContext";
import { AuthProvider } from "./context/AuthContext";
import App from "./App";
import "./styles/global.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <WalletProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </WalletProvider>
    </BrowserRouter>
  </React.StrictMode>
);
