// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import WalletConnectionProvider from "./solana/walletConnectionProvider.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* If you omit network, it reads VITE_SOLANA_NETWORK */}
    <WalletConnectionProvider /* network="mainnet-beta" */>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </WalletConnectionProvider>
  </React.StrictMode>
);
