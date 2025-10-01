// src/solana/WalletConnectionProvider.jsx
import React, { useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";

export default function WalletConnectionProvider({ children, network = "mainnet-beta" }) {
  const endpoint = useMemo(() => {
    const env =
      network === "devnet"
        ? import.meta.env.VITE_SOLANA_RPC_DEVNET
        : import.meta.env.VITE_SOLANA_RPC_MAINNET;
    if (env && typeof env === "string" && env.startsWith("http")) return env.trim();
    return clusterApiUrl(network);
  }, [network]);

  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
