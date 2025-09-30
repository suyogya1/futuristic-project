// src/solana/WalletConnectionProvider.jsx
import React, { useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";

// Default styles for wallet modal & buttons:
import "@solana/wallet-adapter-react-ui/styles.css";

/**
 * Wrap your app with Solana connection + wallet context.
 * Switch network to 'mainnet-beta' when you go live.
 */
export default function WalletConnectionProvider({ children, network = "mainnet-beta" }) {
  const endpoint = useMemo(() => {
    const n =
      network === "mainnet-beta" || network === "testnet" || network === "devnet"
        ? network
        : "mainnet-beta";
    return clusterApiUrl(n);
  }, [network]);

  // Only Phantom (you can add more later)
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
    