import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";

export default function ConnectWallet() {
  const { connection } = useConnection();
  const {
    publicKey,
    connected,
    connecting,
    disconnect,
    signMessage,
    wallet,
    wallets,                 // available adapters
    select,                  // manually select a wallet if desired
    connect,                 // programmatic connect
  } = useWallet();

  const [balance, setBalance] = useState(null);
  const [sigStatus, setSigStatus] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Detect Phantom availability in the browser (desktop extension / in-app browser)
  const hasPhantom = useMemo(() => {
    if (typeof window === "undefined") return false;
    // window.phantom?.solana is the modern recommended check
    const provider = window.phantom?.solana || window.solana;
    return !!(provider && provider.isPhantom);
  }, []);

  // Keep balance up to date
  const refreshBalance = useCallback(async () => {
    try {
      if (!publicKey) return;
      const lamports = await connection.getBalance(publicKey);
      setBalance(lamports / LAMPORTS_PER_SOL);
    } catch (e) {
      setErrorMsg(`Failed to refresh balance: ${String(e?.message || e)}`);
    }
  }, [connection, publicKey]);

  useEffect(() => {
    if (connected) refreshBalance();
  }, [connected, refreshBalance]);

  // Safer signature preview without relying on Buffer polyfill
  const hexSlice = (u8) =>
    Array.from(u8.slice(0, 12))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("") + "…";

  const handleSignSample = async () => {
    setSigStatus("");
    setErrorMsg("");
    try {
      if (!publicKey) throw new Error("Wallet not connected.");
      if (!signMessage) throw new Error("This wallet does not support message signing.");
      const encoded = new TextEncoder().encode("Hello from your landing page!");
      const sig = await signMessage(encoded);
      setSigStatus(`Message signed: ${hexSlice(new Uint8Array(sig))}`);
    } catch (e) {
      setSigStatus("");
      setErrorMsg(e?.message === "User rejected the request."
        ? "Signing cancelled."
        : `Sign failed: ${String(e?.message || e)}`);
    }
  };

  // Optional: one-click *ensure Phantom* (helpful if multiple wallet adapters installed)
  const connectPhantom = async () => {
    setErrorMsg("");
    try {
      // if Phantom adapter exists, select it, else WalletMultiButton will open modal
      const phantomAdapter = wallets.find((w) => /phantom/i.test(w.adapter?.name || ""));
      if (phantomAdapter?.adapter && wallet?.adapter?.name !== phantomAdapter.adapter.name) {
        await select(phantomAdapter.adapter.name);
      }
      await connect(); // opens Phantom connect flow
    } catch (e) {
      setErrorMsg(e?.message || String(e));
    }
  };

  return (
    <div className="wallet-card">
      {/* Top row: status + button */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        {/* WalletMultiButton gives the polished modal & handles all wallets */}
        <WalletMultiButton className="btn primary" />
        {/* Optional dedicated Phantom connect helper */}
        {!connected && (
          <button className="btn ghost" onClick={connectPhantom} type="button">
            Connect Phantom
          </button>
        )}
      </div>

      {/* If Phantom not installed, show a friendly nudge */}
      {!hasPhantom && !connected && (
        <div className="hint" style={{ marginTop: 10 }}>
          Phantom not detected.{" "}
          <a
            href="https://phantom.app/download"
            target="_blank"
            rel="noreferrer"
            style={{ textDecoration: "underline" }}
          >
            Install Phantom
          </a>{" "}
          and reload this page.
        </div>
      )}

      {/* Connection state / errors */}
      {connecting && <div className="muted" style={{ marginTop: 8 }}>Connecting… approve in Phantom.</div>}
      {errorMsg && <div className="muted" style={{ marginTop: 8, color: "#ff8b8b" }}>{errorMsg}</div>}
      {sigStatus && <div className="muted" style={{ marginTop: 8 }}>{sigStatus}</div>}

      {/* Connected info panel */}
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
            <button className="btn ghost" onClick={refreshBalance} style={{ marginLeft: 10 }} type="button">
              Refresh
            </button>
          </div>

          <div className="actions">
            <button className="btn ghost" onClick={handleSignSample} type="button">Sign message</button>
            <button className="btn ghost" onClick={disconnect} type="button">Disconnect</button>
          </div>
        </div>
      )}
    </div>
  );
}
