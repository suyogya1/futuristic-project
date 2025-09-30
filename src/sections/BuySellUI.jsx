import React, { useMemo, useState } from "react";
import { startMoneyRain } from "../effects/moneyRain";

/**
 * Pure UI for a Buy/Sell interface (no blockchain calls).
 * Change the defaults below to your token & branding.
 */
export default function BuySellUI({
  tokenSymbol = "TIT",
  tokenName = "Tit Coin",
  // Mocked price for now. Replace via props or a hook later.  // TODO: feed real price
  tokenPriceUsd = 0.1234,
}) {
  const [side, setSide] = useState("buy");       // "buy" | "sell"
  const [amount, setAmount] = useState("");      // token amount
  const [slippage, setSlippage] = useState("1"); // %

  const price = Number(tokenPriceUsd ?? 0); // USD per token (mock)
  const qty = Number(amount || 0);
  const subtotal = qty * price;

  const btnLabel = useMemo(
    () => (side === "buy" ? `Buy ${tokenSymbol}` : `Sell ${tokenSymbol}`),
    [side, tokenSymbol]
  );

  const canSubmit = qty > 0;

  function handlePrimaryClick() {
    if (!canSubmit) return;
    // TODO: if wallet not connected => open wallet modal
    // TODO: build & execute swap transaction with selected slippage
    // TODO: show toast and link to explorer on success
    startMoneyRain(); // ✨ celebrate now (move this to success callback later)
    alert(`[UI only] ${btnLabel} clicked for ${qty} ${tokenSymbol} at $${price}`);
  }

  return (
    <section id="buy-sell" className="section">
      <div className="container">
        <div
          className="section-title"
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}
        >
          <span>Buy / Sell {tokenName}</span>
          <div className="seg" role="tablist" aria-label="Buy or Sell">
            <button
              className={`seg-btn ${side === "buy" ? "active" : ""}`}
              onClick={() => setSide("buy")}
              role="tab"
              aria-selected={side === "buy"}
            >
              Buy
            </button>
            <button
              className={`seg-btn ${side === "sell" ? "active" : ""}`}
              onClick={() => setSide("sell")}
              role="tab"
              aria-selected={side === "sell"}
            >
              Sell
            </button>
          </div>
        </div>

        <p className="section-sub">Interface only. We’ll wire wallet + swaps later.</p>

        <div className="swap-grid">
          {/* Left: Order panel */}
          <div className="panel">
            <div className="row between">
              <div className="label">Order type</div>
              <div className="pill">market</div> {/* TODO: support limit later */}
            </div>

            <div className="row between">
              <div className="label">Side</div>
              <div className="pill" style={{ textTransform: "capitalize" }}>{side}</div>
            </div>

            <div className="divider" />

            {/* Amount in tokens */}
            <div className="field">
              <div className="field-row">
                <label className="label" htmlFor="amount">Amount ({tokenSymbol})</label>
                <button
                  className="link"
                  onClick={() => setAmount("100")} // TODO: replace with "max" based on balance
                  type="button"
                >
                  Max
                </button>
              </div>
              <input
                id="amount"
                className="input"
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                placeholder={`0.00 ${tokenSymbol}`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <div className="hint">Balance: — {tokenSymbol} {/* TODO: show real balance */}</div>
            </div>

            <div className="row between" style={{ marginTop: 12 }}>
              <div className="label">Slippage</div>
              <div className="slip-group">
                {["0.5", "1", "2"].map((s) => (
                  <button
                    key={s}
                    className={`chip ${slippage === s ? "active" : ""}`}
                    onClick={() => setSlippage(s)}
                    type="button"
                  >
                    {s}%
                  </button>
                ))}
                <input
                  className="chip-input"
                  type="number"
                  min="0"
                  step="0.1"
                  aria-label="Custom slippage percent"
                  value={slippage}
                  onChange={(e) => setSlippage(e.target.value)}
                />
              </div>
            </div>

            <div className="divider" />

            <div className="summary">
              <div className="sum-row">
                <div className="k">Price</div>
                <div className="v">${price.toLocaleString()}</div>
              </div>
              <div className="sum-row">
                <div className="k">Amount</div>
                <div className="v">
                  {Number.isFinite(qty) ? qty.toLocaleString() : "0"} {tokenSymbol}
                </div>
              </div>
              <div className="sum-row">
                <div className="k">Est. Subtotal</div>
                <div className="v">
                  ${Number.isFinite(subtotal) ? subtotal.toLocaleString() : "0.00"}
                </div>
              </div>
              <div className="sum-row">
                <div className="k">Fees</div>
                <div className="v">— {/* TODO: show est. fees after routing */}</div>
              </div>
            </div>

            {/* Primary action */}
            <button
              className={`btn primary lg${!canSubmit ? " is-disabled" : ""}`}
              style={{ width: "100%", marginTop: 14 }}
              onClick={handlePrimaryClick}
              disabled={!canSubmit}
            >
              {btnLabel}
            </button>

            {/* Secondary */}
            <button
              className="btn ghost"
              style={{ width: "100%", marginTop: 8 }}
              onClick={() => {
                // TODO: preview route / quotes later
                console.log("Preview route (TODO)");
              }}
              type="button"
            >
              Preview route (mock)
            </button>
          </div>

          {/* Right: Ticker / price card */}
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

            <div className="metric">
              <div className="k">24h Change</div>
              <div className="v up">+3.14%</div> {/* TODO: replace with real change */}
            </div>
            <div className="metric">
              <div className="k">24h Volume</div>
              <div className="v">$1,203,456</div> {/* TODO: replace with real volume */}
            </div>
            <div className="metric">
              <div className="k">Liquidity</div>
              <div className="v">$987,654</div> {/* TODO: replace with real liquidity */}
            </div>

            <div className="hint" style={{ marginTop: 10 }}>
              {/* TODO: If using Jupiter or your own AMM, show data source here */}
              Prices are placeholders for design. Hook your data source later.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
  