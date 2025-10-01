// src/pages/Axiom.jsx
import React from "react";

export default function Axiom() {
  return (
    <main>
      {/* Hero */}
      <section className="section" style={{ paddingTop: 40 }}>
        <div className="container">
          <h1 className="section-title" style={{ fontSize: 40, marginBottom: 10 }}>
            Axiom-like Overview
          </h1>
          <p className="section-sub" style={{ maxWidth: 760 }}>
            A clean, high-level snapshot of how One For All works: core primitives, value flow,
            and what makes it composable in Solana DeFi.
          </p>
        </div>
      </section>

      {/* Pillars */}
      <section className="section">
        <div className="container">
          <div className="grid3" style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))" }}>
            <div className="panel">
              <h3 style={{ marginTop: 0 }}>Protocol Pillars</h3>
              <ul className="hint" style={{ margin: 0, paddingLeft: 18 }}>
                <li>Fair, transparent tokenomics</li>
                <li>Incentives aligned to long-term holders</li>
                <li>Built for integrations & tooling</li>
              </ul>
            </div>
            <div className="panel">
              <h3 style={{ marginTop: 0 }}>Value Flow</h3>
              <ul className="hint" style={{ margin: 0, paddingLeft: 18 }}>
                <li>Fees → treasury → rewards/ops</li>
                <li>Liquidity programs bootstrap markets</li>
                <li>Clear, auditable on-chain activity</li>
              </ul>
            </div>
            <div className="panel">
              <h3 style={{ marginTop: 0 }}>Composability</h3>
              <ul className="hint" style={{ margin: 0, paddingLeft: 18 }}>
                <li>Aggregators (Jupiter), AMMs, vaults</li>
                <li>Open data for dashboards</li>
                <li>Permissionless extensions</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Diagram placeholder */}
      <section className="section">
        <div className="container">
          <div className="panel" style={{ padding: 24, textAlign: "center" }}>
            <h3 style={{ marginTop: 0 }}>Architecture Diagram (Placeholder)</h3>
            <p className="hint" style={{ marginTop: 8 }}>
              Drop in a PNG/SVG later. This block intentionally has generous padding and a border.
            </p>
            <div
              style={{
                marginTop: 14,
                height: 280,
                borderRadius: 16,
                border: "1px dashed rgba(255,255,255,0.25)",
                background:
                  "repeating-linear-gradient(45deg, rgba(255,255,255,0.06), rgba(255,255,255,0.06) 10px, rgba(255,255,255,0.04) 10px, rgba(255,255,255,0.04) 20px)",
              }}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
