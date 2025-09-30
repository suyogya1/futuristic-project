import React, { useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

export default function ConnectWalletModal({ open, onClose }) {
  const { connect, connecting, connected, wallets, wallet, select } = useWallet();

  const phantomAdapter = wallets.find((w) => /phantom/i.test(w.adapter?.name || ""));

  useEffect(() => {
    if (connected && open) onClose?.();
  }, [connected, open, onClose]);

  const hasPhantom =
    typeof window !== "undefined" &&
    (window.phantom?.solana?.isPhantom || window.solana?.isPhantom);

  const handleConnect = async () => {
    try {
      if (phantomAdapter?.adapter && wallet?.adapter?.name !== phantomAdapter.adapter.name) {
        await select(phantomAdapter.adapter.name);
      }
      await connect(); // This will open Phantom and show the password prompt there
    } catch (e) {
      // error is surfaced below; Phantom rejections are common if user cancels
      console.error("Connect error:", e);
    }
  };

  if (!open) return null;

  return (
    <div className="cw-overlay" role="dialog" aria-modal="true" aria-labelledby="cw-title">
      <div className="cw-modal">
        <div className="cw-header">
          <h3 id="cw-title">Connect your Phantom Wallet</h3>
          <button className="cw-x" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="cw-body">
          <ol className="cw-steps">
            <li className={hasPhantom ? "done" : ""}>
              <span className="num">1</span>
              {hasPhantom ? "Phantom detected" : (
                <>
                  Install&nbsp;
                  <a href="https://phantom.app/download" target="_blank" rel="noreferrer">
                    Phantom
                  </a>
                  , then return here.
                </>
              )}
            </li>
            <li className={connecting ? "active" : ""}>
              <span className="num">2</span>
              Click “Connect Phantom” below
            </li>
            <li>
              <span className="num">3</span>
              Approve in Phantom — **enter your password** in the Phantom window
              (we never see it)
            </li>
          </ol>

          <div className="cw-actions">
            <button
              className="btn primary lg"
              onClick={handleConnect}
              disabled={!hasPhantom || connecting}
            >
              {connecting ? "Waiting for Phantom…" : "Connect Phantom"}
            </button>
            <button className="btn ghost" onClick={onClose}>Cancel</button>
          </div>

          <p className="cw-note">
            We never ask for your seed phrase or password. Authentication is handled
            inside the Phantom extension/app.
          </p>
        </div>
      </div>
    </div>
  );
}
