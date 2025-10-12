import React from "react";
import SwapTerminal from "../components/SwapTerminal";
import DexScreenerChart from "../components/DexScreenerChart";

export default function BuySell() {
  return (
    <main style={{ paddingTop: "80px", paddingBottom: "80px" }}>
      <div className="container">
        <h1 className="gradient-text" style={{ fontSize: "2.5rem", marginBottom: "2rem", textAlign: "center" }}>
          Buy & Sell
        </h1>
        <div className="swap-grid">
          <SwapTerminal />
          <DexScreenerChart />
        </div>
      </div>
    </main>
  );
}
