import React, { useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export default function ConnectWalletModal({ open, onClose }) {
  const { connected } = useWallet();

  useEffect(() => {
    if (connected && open) onClose?.();
  }, [connected, open, onClose]);

  if (!open) return null;

  return (
    <div className="cw-overlay" role="dialog" aria-modal="true" aria-labelledby="cw-title">
      <div className="cw-modal">
        <div className="cw-header">
          <h3 id="cw-title">Connect your wallet</h3>
          <button className="cw-x" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="cw-body">
          <ol className="cw-steps">
            <li className="done">
              <span className="num">1</span>
              Open the wallet selector
            </li>
            <li>
              <span className="num">2</span>
              Choose your wallet (Phantom, Solflare, etc.)
            </li>
            <li>
              <span className="num">3</span>
              Approve the connection in your wallet window
            </li>
          </ol>

          <div className="cw-actions" style={{ gap: 12 }}>
            {/* One nice button that opens the wallet-adapter modal */}
            <WalletMultiButton className="btn primary lg" />
            <button className="btn ghost" onClick={onClose} type="button">Cancel</button>
          </div>

          <p className="cw-note">
            We never ask for your seed phrase or password. Authentication happens in your wallet.
          </p>
        </div>
      </div>
    </div>
  );
}
