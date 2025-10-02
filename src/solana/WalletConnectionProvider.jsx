// src/solana/WalletConnectionProvider.jsx
import React, { useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";
import "@solana/wallet-adapter-react-ui/styles.css";

/**
 * Reads:
 *  - VITE_SOLANA_NETWORK ("devnet" | "mainnet-beta" | "testnet")
 *  - VITE_SOLANA_RPC_MAINNET / VITE_SOLANA_RPC_DEVNET
 */
export default function WalletConnectionProvider({ children, network }) {
  const networkFromEnv =
    network ||
    (import.meta.env.VITE_SOLANA_NETWORK === "devnet"
      ? "devnet"
      : import.meta.env.VITE_SOLANA_NETWORK === "testnet"
      ? "testnet"
      : "mainnet-beta");

  const endpoint = useMemo(() => {
    let url = "";
    if (networkFromEnv === "mainnet-beta") {
      url = import.meta.env.VITE_SOLANA_RPC_MAINNET || "";
    } else if (networkFromEnv === "devnet") {
      url = import.meta.env.VITE_SOLANA_RPC_DEVNET || "";
    }

    // Fallbacks if the env var isn't set
    if (!url) {
      console.warn(
        `[Solana] No custom RPC for ${networkFromEnv}. Falling back to clusterApiUrl (rate-limited).`
      );
      url = clusterApiUrl(networkFromEnv);
    }

    // Guard against bad keys (e.g., api-key=undefined)
    if (/api[-_]?key=(undefined|null|$)/i.test(url)) {
      console.warn(
        "[Solana] RPC appears to have a missing/invalid api key. Falling back to clusterApiUrl."
      );
      url = clusterApiUrl(networkFromEnv);
    }

    return url;
  }, [networkFromEnv]);

  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={endpoint} config={{ commitment: "confirmed" }}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
