import React, { useMemo, useState } from "react";
import { startMoneyRain } from "../effects/moneyRain";
import DexScreenerChart from "../components/DexScreenerChart";
import ConnectWallet from "../components/connectWallet";
import SwapTerminal from "../components/swapTerminal";

export default function BuySellUI({
  tokenSymbol = "1FA",
  tokenName = "One For All",
  tokenPriceUsd = 0.1234,
}) {
  const [side, setSide] = useState("buy");
  const [amount, setAmount] = useState("");
  const [slippage, setSlippage] = useState("1");
  const [tab, setTab] = useState("buy");

  const price = Number(tokenPriceUsd ?? 0);
  const qty = Number(amount || 0);
  const subtotal = qty * price;
  const pairPath = "solana/REPLACE_WITH_POOL_OR_PAIR"; // optional, for live chart

  const btnLabel = useMemo(
    () => (side === "buy" ? `Buy ${tokenSymbol}` : `Sell ${tokenSymbol}`),
    [side, tokenSymbol]
  );

  const canSubmit = qty > 0;

  return (
    <section id="buy-sell" className="section">
      <div className="container">
        <div className="section-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <span>Buy / Sell {tokenName}</span>
          <div className="seg" role="tablist" aria-label="Buy or Sell">
            <button className={`seg-btn ${side === "buy" ? "active" : ""}`} onClick={() => setSide("buy")} role="tab" aria-selected={side === "buy"}>Buy</button>
            <button className={`seg-btn ${side === "sell" ? "active" : ""}`} onClick={() => setSide("sell")} role="tab" aria-selected={side === "sell"}>Sell</button>
          </div>
        </div>

        <p className="section-sub">Interface only. We’ll wire wallet + swaps later.</p>

        <div className="swap-grid">
          <div className="panel">
            <div className="row between">
              <div className="label">Order type</div>
              <div className="pill">market</div>
            </div>

            <div className="row between">
              <div className="label">Side</div>
              <div className="pill" style={{ textTransform: "capitalize" }}>{side}</div>
            </div>

            <div className="divider" />

            <div className="field">
              <div className="field-row">
                <label className="label" htmlFor="amount">Amount ({tokenSymbol})</label>
                <button className="link" onClick={() => setAmount("100")} type="button">Max</button>
              </div>
              <input
                id="amount" className="input" type="number" inputMode="decimal" min="0" step="any"
                placeholder={`0.00 ${tokenSymbol}`} value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <div className="hint">Balance: — {tokenSymbol}</div>
            </div>

            <div className="row between" style={{ marginTop: 12 }}>
              <div className="label">Slippage</div>
              <div className="slip-group">
                {["0.5", "1", "2"].map((s) => (
                  <button key={s} className={`chip ${slippage === s ? "active" : ""}`} onClick={() => setSlippage(s)} type="button">
                    {s}%
                  </button>
                ))}
                <input
                  className="chip-input" type="number" min="0" step="0.1" aria-label="Custom slippage percent"
                  value={slippage} onChange={(e) => setSlippage(e.target.value)}
                />
              </div>
            </div>

            <div className="divider" />

            <div className="summary">
              <div className="sum-row"><div className="k">Price</div><div className="v">${price.toLocaleString()}</div></div>
              <div className="sum-row"><div className="k">Amount</div><div className="v">{Number.isFinite(qty) ? qty.toLocaleString() : "0"} {tokenSymbol}</div></div>
              <div className="sum-row"><div className="k">Est. Subtotal</div><div className="v">${Number.isFinite(subtotal) ? subtotal.toLocaleString() : "0.00"}</div></div>
              <div className="sum-row"><div className="k">Fees</div><div className="v">—</div></div>
            </div>

            <button
              className={`btn primary lg${!canSubmit ? " is-disabled" : ""}`}
              style={{ width: "100%", marginTop: 14 }}
              onClick={() => {
                if (!canSubmit) return;
                startMoneyRain({ count: 56, durationMs: 3000 });
                setTimeout(() => {
                  alert(`[UI only] ${btnLabel} clicked for ${qty} ${tokenSymbol} at $${price}`);
                }, 150);
              }}
              disabled={!canSubmit}
            >
              {btnLabel}
            </button>

            <button className="btn ghost" style={{ width: "100%", marginTop: 8 }} onClick={() => console.log("Preview route (TODO)")} type="button">
              Preview route (mock)
            </button>
          </div>

          <div className="panel">
            <div className="panel-row">
              <div className="panel-title">{tokenName} price</div>
              <div className="badge">Mock</div>
            </div>

            <div className="price-big">
              <span className="usd">${price.toLocaleString()}</span>
              <span className="per">/ {tokenSymbol}</span>
            </div>

            <div className="sparkline" aria-hidden="true">
              {Array.from({ length: 28 }).map((_, i) => (
                <div key={i} className="sparkbar" style={{ height: `${30 + ((i * 17) % 60)}%` }} />
              ))}
            </div>

            <div className="divider" />

            <div className="metric"><div className="k">24h Change</div><div className="v up">+3.14%</div></div>
            <div className="metric"><div className="k">24h Volume</div><div className="v">$1,203,456</div></div>
            <div className="metric"><div className="k">Liquidity</div><div className="v">$987,654</div></div>

            <div className="hint" style={{ marginTop: 10 }}>
              Prices are placeholders for design.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}