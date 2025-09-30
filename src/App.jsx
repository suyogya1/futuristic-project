import { useState } from "react";
import "./index.css";
import DexScreenerChart from "./components/DexScreenerChart";
import ConnectWallet from "./components/connectWallet";
import BuySellUI from "./sections/BuySellUI";

function Nav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="nav">
      <div className="container nav-inner">
        <div className="brand">Tit Coin</div>
        <nav className={`links ${open ? "open" : ""}`}>
          {/* fixed anchor to match section id */}
          <a href="#buy-sell">Buy / Sell Coin</a>
        </nav>
        <button className="menu" onClick={() => setOpen(!open)} aria-label="Menu">
          ☰
        </button>
      </div>
    </header>
  );
}

function LiveChartSection() {
  const pairPath = "ethereum/0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc";
  return (
    <section id="live-demo" className="section">
      <div className="container">
        <h2 className="section-title">Live DEX Chart</h2>
        <DexScreenerChart pairPath={pairPath} theme="dark" height={560} />
      </div>
    </section>
  );
}

function Web3Section() {
  return (
    <section id="wallet" className="section alt">
      <div className="container">
        <h2 className="section-title">Connect your Phantom wallet</h2>
        <p className="section-sub">
          Try it on <strong>devnet</strong>: connect, view your address, refresh SOL balance, and sign a test message.
        </p>
        <ConnectWallet />
      </div>
    </section>
  );
}


function Footer() {
  return (
    <footer className="footer">
      <div className="container foot-inner">
        <div className="brand">TitCoin</div>
        <div className="foot-links">
          <a href="#privacy">Privacy</a>
          <a href="#terms">Terms</a>
        </div>
        <div className="foot-copy">© {new Date().getFullYear()} Tit Coin. All rights reserved.</div>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <>
      <Nav />
      <LiveChartSection />
      <BuySellUI tokenSymbol="TIT" tokenName="Tit Coin" tokenPriceUsd={0.1234} />
      <Web3Section />
      <Footer />
    </>
  );
}
