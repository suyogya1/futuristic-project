import { useState } from "react";
import "./index.css";
import DexScreenerChart from "./components/DexScreenerChart";

function Nav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="nav">
      <div className="container nav-inner">
        <div className="brand">Tit Coin</div>
        <nav className={`links ${open ? "open" : ""}`}>
          <a href="#buy-sell-coin">Buy Sell Coin</a>
        </nav>
        <button className="menu" onClick={() => setOpen(!open)} aria-label="Menu">
          ☰
        </button>
      </div>
    </header>
  );
}


function LiveChartSection(){
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
      <Footer />
    </>
  );
}
