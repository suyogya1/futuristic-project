import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import WalletConnectionProvider from "./solana/walletConnectionProvider.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <WalletConnectionProvider network="mainnet-beta">
      <App />
    </WalletConnectionProvider>
  </React.StrictMode>
);
