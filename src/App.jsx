// src/App.jsx
import React, { useEffect, useState } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";

import Landing from "./pages/landing.jsx";
import BuySell from "./pages/buySell.jsx";
import Axiom from "./pages/axiom.jsx";
import Rewards from "./pages/rewards.jsx";
import FloatingAIAssistant from "./components/FloatingAssistant.jsx";

function Nav() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // Close the mobile menu on route change or Escape
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onEsc = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, []);

  return (
    <header className="nav">
      <div className="container nav-inner">
        <div className="brand">
          <Link to="/" style={{ textDecoration: "none" }}>One For All</Link>
        </div>

        {/* Desktop / Mobile links */}
        <nav className={`links ${open ? "open" : ""}`}>
          {/* Opens new tab as requested */}
          <a href="/buy-sell" target="_blank" rel="noopener noreferrer">
            Launch Web App
          </a>

          {/* Same-tab pages */}
          <Link to="/axiom">Axiom-like</Link>
          <Link to="/rewards">Rewards</Link>
        </nav>

        <button
          className="menu"
          aria-label="Menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          ☰
        </button>
      </div>
    </header>
  );
}

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
        <div className="foot-copy">
          © {new Date().getFullYear()} One For All. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  // Global background layer (keeps gradient consistent across routes)
  useEffect(() => {
    let bg = document.getElementById("page-bg-layer");
    if (!bg) {
      bg = document.createElement("div");
      bg.id = "page-bg-layer";
      bg.className = "page-bg";
      document.body.appendChild(bg);
    }
    return () => {};
  }, []);

  // Pointer-follow glow for .bento-card
  useEffect(() => {
    const onMove = (e) => {
      document.querySelectorAll(".bento-card").forEach((el) => {
        const r = el.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width) * 100;
        el.style.setProperty("--mx", `${x}%`);
      });
    };
    document.addEventListener("pointermove", onMove);
    return () => document.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <>
      <Nav />

      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/buy-sell" element={<BuySell />} />
        <Route path="/axiom" element={<Axiom />} />
        <Route path="/rewards" element={<Rewards />} />
      </Routes>

      {/* ✅ Correct component usage */}
      <FloatingAIAssistant />

      <Footer />
    </>
  );
}
