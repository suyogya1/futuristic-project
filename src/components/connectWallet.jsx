import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

/* ---------------- helpers ---------------- */
const u8ToBase64 = (u8) => {
  let s = "";
  for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]);
  return btoa(s);
};

const KNOWN_KEYS = new Set([
  "walletAdapter",
  "walletName",
  "@solana/wallet-adapter-base:walletName",
  "@solana/wallet-adapter-react:connected",
  "@solana/wallet-adapter-react:recentWalletNames",
  "@solana/wallet-adapter-react:preferredWallet",
  // popular vendor crumbs:
  "phantom.wallet.preferred",
  "phantom.wallet.token",
  "phantom:context",
  "solflare-internal",
]);

function wipeStorage(storage) {
  try {
    // remove known keys first
    for (const k of KNOWN_KEYS) storage.removeItem?.(k);
    // then pattern-based cleanup (iterate with .key(i))
    const re = /(wallet|adapter|phantom|solflare|solana)/i;
    for (let i = storage.length - 1; i >= 0; i--) {
      const key = storage.key(i);
      if (key && re.test(key)) storage.removeItem(key);
    }
  } catch {}
}

function forgetWalletCache() {
  wipeStorage(localStorage);
  wipeStorage(sessionStorage);
}

export default function ConnectWallet() {
  const { connection } = useConnection();
  const { publicKey, wallet, connected, connecting, disconnect, signMessage } = useWallet();

  const [balance, setBalance] = useState(null);
  const [sigStatus, setSigStatus] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [serverAuthed, setServerAuthed] = useState(false);
  const [serverAddr, setServerAddr] = useState("");      // who the server thinks we are
  const [lastLoginMessage, setLastLoginMessage] = useState("");

  const hasPhantom = useMemo(() => {
    if (typeof window === "undefined") return false;
    const provider = window.phantom?.solana || window.solana;
    return !!(provider && provider.isPhantom);
  }, []);

  /* ---------------- server session helpers ---------------- */
  const fetchMe = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/me`, { credentials: "include" });
      if (!r.ok) {
        setServerAuthed(false);
        setServerAddr("");
        return null;
      }
      const j = await r.json();
      setServerAuthed(true);
      setServerAddr(j.address || "");
      return j.address || "";
    } catch {
      setServerAuthed(false);
      setServerAddr("");
      return null;
    }
  }, []);

  const logoutServer = useCallback(async () => {
    try { await fetch(`${API_BASE}/logout`, { method: "POST", credentials: "include" }); } catch {}
    setServerAuthed(false);
    setServerAddr("");
    setBalance(null);
    setSigStatus("");
  }, []);

  /* ---------------- mount: reconcile stray cookie ---------------- */
  useEffect(() => {
    (async () => {
      const addr = await fetchMe();
      if (addr && !connected) {
        // cookie exists but wallet is not connected -> clear
        await logoutServer();
        forgetWalletCache();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------- external adapter disconnects ---------------- */
  useEffect(() => {
    const adapter = wallet?.adapter;
    if (!adapter) return;
    const onDisconnect = async () => {
      await logoutServer();
      forgetWalletCache();
    };
    adapter.on?.("disconnect", onDisconnect);
    return () => adapter.off?.("disconnect", onDisconnect);
  }, [wallet, logoutServer]);

  /* ---------------- SIWS: nonce -> sign -> verify ---------------- */
  const ensureServerSession = useCallback(async () => {
    if (!connected || !publicKey) return;
    if (!signMessage) {
      setErrorMsg("This wallet does not support message signing.");
      return;
    }
    try {
      setErrorMsg("");
      const address = publicKey.toBase58();

      // 1) nonce + message
      const nonceRes = await fetch(`${API_BASE}/auth/nonce?address=${address}`, {
        credentials: "include",
      });
      if (!nonceRes.ok) throw new Error(`Nonce error: ${await nonceRes.text()}`);
      const { message } = await nonceRes.json();
      setLastLoginMessage(message);

      // 2) sign
      const sig = await signMessage(new TextEncoder().encode(message));
      const signatureBase64 = u8ToBase64(new Uint8Array(sig));

      // 3) verify → cookie
      const vRes = await fetch(`${API_BASE}/auth/verify`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, signatureBase64, message }),
      });
      if (!vRes.ok) throw new Error(`Verify error: ${await vRes.text()}`);

      await fetchMe(); // updates serverAddr/serverAuthed
    } catch (e) {
      setServerAuthed(false);
      setServerAddr("");
      setErrorMsg(String(e?.message || e));
    }
  }, [connected, publicKey, signMessage, fetchMe]);

  /* ---------------- balance: server (Helius) → client fallback ---------------- */
  const refreshBalance = useCallback(async () => {
    try {
      if (!publicKey) return;
      if (serverAuthed) {
        const r = await fetch(`${API_BASE}/balance`, { credentials: "include" });
        if (!r.ok) throw new Error(`Server balance error: ${await r.text()}`);
        const data = await r.json();
        setBalance(typeof data.sol === "number" ? data.sol : data.lamports / LAMPORTS_PER_SOL);
      } else {
        const lamports = await connection.getBalance(publicKey, "processed");
        setBalance(lamports / LAMPORTS_PER_SOL);
      }
      setErrorMsg("");
    } catch (e) {
      const msg = String(e?.message || e);
      if (msg.includes("403") || msg.toLowerCase().includes("forbidden")) {
        setErrorMsg("RPC blocked (403). Check server RPC or client fallback. See .env VITE_API_BASE / VITE_SOLANA_RPC_*.");
      } else {
        setErrorMsg(`Failed to refresh balance: ${msg}`);
      }
    }
  }, [connection, publicKey, serverAuthed]);

  /* ---------------- react to wallet connect/change ---------------- */
  useEffect(() => {
    (async () => {
      if (!connected || !publicKey) return;
      // fetch current server identity
      const addr = await fetchMe();
      const current = publicKey.toBase58();
      if (addr !== current) {
        // mismatch → re-auth
        await ensureServerSession();
      }
      await refreshBalance();
    })();
  }, [connected, publicKey, ensureServerSession, refreshBalance, fetchMe]);

  /* ---------------- also refresh when auth state flips ---------------- */
  useEffect(() => {
    if (connected && publicKey) refreshBalance();
  }, [serverAuthed]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------------- UI handlers ---------------- */
  const hexSlice = (u8) =>
    Array.from(u8.slice(0, 12)).map((b) => b.toString(16).padStart(2, "0")).join("") + "…";

  const handleSignSample = async () => {
    setSigStatus(""); setErrorMsg("");
    try {
      if (!publicKey) throw new Error("Wallet not connected.");
      if (!signMessage) throw new Error("This wallet does not support message signing.");
      const msg = lastLoginMessage || "Hello from your landing page!";
      const encoded = new TextEncoder().encode(msg);
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

  const handleDisconnectEverywhere = async () => {
    await logoutServer();                      // 1) clear cookie
    try { await disconnect(); } catch {}       // 2) adapter disconnect
    try { await window?.phantom?.solana?.disconnect?.(); } catch {} // 3) Phantom hard-disconnect
    forgetWalletCache();                       // 4) wipe caches so modal shows next time
    // optional: window.location.reload();
  };

  const mismatch =
    !!serverAddr && !!publicKey && serverAddr !== publicKey.toBase58();

  /* ---------------- render ---------------- */
  return (
    <div className="wallet-card">
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <WalletMultiButton className="btn primary" />
        {connected && mismatch && (
          <button className="btn ghost" onClick={ensureServerSession} title="Re-authenticate session">
            Re-auth
          </button>
        )}
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

      {connecting && <div className="muted" style={{ marginTop: 8 }}>Connecting… approve in wallet.</div>}
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
            <span className="label">Server session:</span>
            <span>
              {serverAuthed ? (
                mismatch ? "⚠️ mismatch (click Re-auth)" : "✅"
              ) : "—"}
            </span>
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
            <button className="btn ghost" onClick={handleDisconnectEverywhere}>Disconnect</button>
          </div>
        </div>
      )}
    </div>
  );
}
