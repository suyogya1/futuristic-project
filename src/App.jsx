import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import Landing from "./pages/Landing.jsx";
import BuySell from "./pages/BuySell.jsx";
import Axiom from "./pages/axiom.jsx";
import Rewards from "./pages/rewards.jsx";
import FloatingAssistant from "./components/FloatingAssistant.jsx";

function Nav() {
  return (
    <header className="nav">
      <div className="container nav-inner">
        <div className="brand">
          <Link to="/" style={{ textDecoration: "none" }}>One For All </Link>
        </div>
        <nav className="links">
          <a href="/buy-sell" target="_blank" rel="noopener noreferrer">Buy/Sell Coin</a>
          <a href="/axiom" target="_blank" rel="noopener noreferrer">Axiom-like</a>
          <a href="/rewards" target="_blank" rel="noopener noreferrer">Rewards</a>
        </nav>
        <button className="menu" aria-label="Menu">☰</button>
      </div>
    </header>
  );
}

// function

function Footer() {
  return (
    <footer className="footer">
      <div className="container foot-inner">
        <div className="brand">One For All</div>
        <div className="foot-links">
          <a href="https://x.com/oneforall" target="_blank" rel="noopener noreferrer">
            X - Connect
          </a>
        </div>
        <div className="foot-copy">© {new Date().getFullYear()} One For All. All rights reserved.</div>
      </div>
    </footer>
  );
}


export default function App() {
  return (
    <>
      <Nav />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/buy-sell" element={<BuySell />} />
        <Route path="/axiom" element={<Axiom />} />
        <Route path="/rewards" element={<Rewards />} />
      </Routes>
      <FloatingAssistant />
      <Footer />
    </>
  );
}
