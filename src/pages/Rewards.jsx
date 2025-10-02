// src/pages/Rewards.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  codeFromPubkey,
  registerMyCode,
  looksLikeCode,
  findOwnerByCode,
  recordReferralUse,
  getRewardStatus,
} from "../utils/referrals";

export default function Rewards() {
  const { publicKey, connected } = useWallet();
  const myPubkey = publicKey?.toBase58() || "";

  const myCode = useMemo(() => (myPubkey ? codeFromPubkey(myPubkey) : ""), [myPubkey]);

  const [enteredCode, setEnteredCode] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [status, setStatus] = useState({ myReferredCount: 0, usedCode: null });

  // Register my code locally & load status when connected
  useEffect(() => {
    if (!connected || !myPubkey || !myCode) return;
    try {
      registerMyCode(myPubkey, myCode);
      setStatus(getRewardStatus(myPubkey));
    } catch (e) {
      setErr(String(e?.message || e));
    }
  }, [connected, myPubkey, myCode]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(myCode);
      setMsg("Referral code copied!");
      setErr("");
      setTimeout(() => setMsg(""), 1400);
    } catch {
      setErr("Unable to copy. Select and copy manually.");
    }
  };

  const handleValidate = () => {
    try {
      setMsg(""); setErr("");
      const code = enteredCode.trim().toUpperCase();

      if (!connected) throw new Error("Connect your wallet to use a referral code.");
      if (!looksLikeCode(code)) throw new Error("Invalid code format.");
      const owner = findOwnerByCode(code);
      if (!owner) throw new Error("No such code. Ask your referrer to open Rewards once to register it.");
      if (owner === myPubkey) throw new Error("That’s your own code 😉");

      const { referredCount } = recordReferralUse(myPubkey, code);
      setStatus(getRewardStatus(myPubkey));
      setMsg(`Success! Code applied. Your referrer now has ${referredCount} referral(s).`);
    } catch (e) {
      setErr(String(e?.message || e));
    }
  };

  return (
    <main>
      {/* Hero */}
      <section className="section" style={{ paddingTop: 40 }}>
        <div className="container">
          <h1 className="section-title" style={{ fontSize: 40, marginBottom: 10 }}>
            Rewards
          </h1>
          <p className="section-sub" style={{ maxWidth: 760 }}>
            Share your unique referral code and earn rewards when friends join.
            Enter a code you received to qualify for welcome perks. (Front-end mock;
            hook these actions to your backend/contract later.)
          </p>
        </div>
      </section>

      {/* Panels */}
      <section className="section">
        <div className="container">
          <div className="grid3" style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))" }}>
            {/* My Referral Code */}
            <div className="panel">
              <h3 style={{ marginTop: 0 }}>My Referral Code</h3>
              <p className="hint" style={{ marginTop: 4 }}>
                Your code is generated from your wallet address (deterministic).
              </p>

              {!connected ? (
                <div className="hint" style={{ marginTop: 8 }}>
                  Connect your wallet on the Buy / Sell page to see your code.
                </div>
              ) : (
                <>
                  <div className="mono" style={{
                    marginTop: 10, padding: "10px 12px", borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06),"
                  }}>
                    {myCode}
                  </div>
                  <button className="btn primary" style={{ width: "100%", marginTop: 10 }} onClick={handleCopy}>
                    Copy code
                  </button>
                </>
              )}
            </div>

            {/* Enter a Referral Code */}
            <div className="panel">
              <h3 style={{ marginTop: 0 }}>Use a Referral Code</h3>
              <p className="hint" style={{ marginTop: 4 }}>
                Paste your friend’s code. You can only use a code once and not your own.
              </p>

              <input
                className="input"   
                type="text"
                placeholder="1FA-XXXXYYYY-123"
                value={enteredCode}
                onChange={(e) => setEnteredCode(e.target.value)}
                style={{ marginTop: 10 }}
              />
              <button className="btn primary" style={{ width: "100%", marginTop: 10 }} onClick={handleValidate}>
                Apply
              </button>
            </div>

            {/* Reward Status */}
            <div className="panel">
              <h3 style={{ marginTop: 0 }}>My Reward Status</h3>
              <div className="summary" style={{ marginTop: 10 }}>
                <div className="sum-row">
                  <div className="k">Used a referral code</div>
                  <div className="v">{status.usedCode ? "Yes" : "No"}</div>
                </div>
                <div className="sum-row">
                  <div className="k">Code I used</div>
                  <div className="v">{status.usedCode || "—"}</div>
                </div>
                <div className="sum-row">
                  <div className="k">People I referred</div>
                  <div className="v">{connected ? status.myReferredCount : "—"}</div>
                </div>
              </div>

              <div className="hint" style={{ marginTop: 10 }}>
                This is a local preview. Connect a backend or smart contract to persist globally.
              </div>
            </div>
          </div>

          {/* Messages */}
          {(msg || err) && (
            <div
              className="panel"
              style={{
                marginTop: 16,
                borderColor: err ? "rgba(255,139,139,.45)" : undefined,
                boxShadow: err ? "0 0 0 3px rgba(255,139,139,.15)" : undefined,
              }}
            >
              <div style={{ color: err ? "#ff8b8b" : "#a7f3d0" }}>
                {err || msg}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
