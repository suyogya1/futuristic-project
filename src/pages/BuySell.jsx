// src/pages/BuySell.jsx
import React from "react";
import ConnectWallet from "../components/connectWallet.jsx";
import BuySellUI from "../sections/BuySellUI.jsx";
import DexScreenerChart from "../components/DexScreenerChart.jsx";

export default function BuySell() {
  // TODO: change to your real pair when ready (e.g., "solana/<pairAddress>")
  const pairPath = "ethereum/0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc";

  return (
    <main>
      <section className="section" style={{ paddingTop: 32 }}>
        <div className="container">
          <h1 className="section-title" style={{ marginBottom: 8 }}>
            Buy / Sell 1FA
          </h1>
          <p className="section-sub" style={{ marginBottom: 20 }}>
            View the live market, connect your wallet, and try the interface. (Swaps are mocked for now.)
          </p>

          {/* 1) Live chart FIRST */}
          <div style={{ marginTop: 8 }}>
            <h3 className="section-title" style={{ fontSize: 18, marginBottom: 8 }}>
              Live Chart
            </h3>
            <DexScreenerChart pairPath={pairPath} theme="dark" height={560} />
          </div>

          {/* 2) Connect wallet SECOND */}
          <div style={{ marginTop: 24 }}>
            <ConnectWallet />
          </div>

          {/* 3) Buy/Sell interface LAST */}
          <div style={{ marginTop: 20 }}>
            <BuySellUI tokenSymbol="1FA" tokenName="1 For All" tokenPriceUsd={0.1234} />
          </div>
        </div>
        
      </section>
    </main>
  );
}

