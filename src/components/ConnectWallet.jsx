import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

export default function ConnectWallet() {
  const { connection } = useConnection();
  const { publicKey, connected, connecting, disconnect, signMessage } = useWallet();

  const [balance, setBalance] = useState(null);
  const [sigStatus, setSigStatus] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const hasPhantom = useMemo(() => {
    if (typeof window === "undefined") return false;
    const provider = window.phantom?.solana || window.solana;
    return !!(provider && provider.isPhantom);
  }, []);

  const refreshBalance = useCallback(async () => {
    try {
      if (!publicKey) return;
      const lamports = await connection.getBalance(publicKey, "processed");
      setBalance(lamports / LAMPORTS_PER_SOL);
      setErrorMsg("");
    } catch (e) {
      const msg = String(e?.message || e);
      if (msg.includes("403") || msg.toLowerCase().includes("forbidden")) {
        setErrorMsg(
          "RPC blocked (403). Check your RPC URL/API key and CORS allowlist. See .env VITE_SOLANA_RPC_*."
        );
      } else {
        setErrorMsg(`Failed to refresh balance: ${msg}`);
      }
    }
  }, [connection, publicKey]);

  useEffect(() => { if (connected) refreshBalance(); }, [connected, refreshBalance]);

  const hexSlice = (u8) =>
    Array.from(u8.slice(0, 12)).map(b => b.toString(16).padStart(2, "0")).join("") + "…";

  const handleSignSample = async () => {
    setSigStatus(""); setErrorMsg("");
    try {
      if (!publicKey) throw new Error("Wallet not connected.");
      if (!signMessage) throw new Error("This wallet does not support message signing.");
      const encoded = new TextEncoder().encode("Hello from your landing page!");
      const sig = await signMessage(encoded);
      setSigStatus(`Message signed: ${hexSlice(new Uint8Array(sig))}`);
    } catch (e) {
      setErrorMsg(
        e?.message === "User rejected the request."
          ? "Signing cancelled."
          : `Sign failed: ${String(e?.message || e)}`
      );
    }
  };

  return (
    <div className="wallet-card">
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {/* Single connect button opens wallet-adapter modal */}
        <WalletMultiButton className="btn primary" />
      </div>

      {!hasPhantom && !connected && (
        <div className="hint" style={{ marginTop: 10 }}>
          Phantom not detected.{" "}
          <a href="https://phantom.app/download" target="_blank" rel="noreferrer" style={{ textDecoration: "underline" }}>
            Install Phantom
          </a>{" "}
          and reload this page.
        </div>
      )}

      {connecting && <div className="muted" style={{ marginTop: 8 }}>Connecting… approve in Phantom.</div>}
      {errorMsg && <div className="muted" style={{ marginTop: 8, color: "#ff8b8b" }}>{errorMsg}</div>}
      {sigStatus && <div className="muted" style={{ marginTop: 8 }}>{sigStatus}</div>}

      {connected && (
        <div className="wallet-info">
          <div className="row">
            <span className="label">Wallet:</span>
            <code className="mono">
              {publicKey?.toBase58().slice(0, 4)}…{publicKey?.toBase58().slice(-4)}
            </code>
          </div>
          <div className="row">
            <span className="label">Balance:</span>
            <span>{balance == null ? "—" : `${balance.toFixed(4)} SOL`}</span>
            <button className="btn ghost" onClick={refreshBalance} style={{ marginLeft: 10 }}>
              Refresh
            </button>
          </div>  

          <div className="actions">
            <button className="btn ghost" onClick={handleSignSample}>Sign message</button>
            <button className="btn ghost" onClick={disconnect}>Disconnect</button>
          </div>
    </div>
      )}
    </div>
  );
}
