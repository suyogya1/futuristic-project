import React, { useEffect, useState } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import Landing from "./pages/Landing.jsx";
import BuySell from "./pages/BuySell.jsx";
import Axiom from "./pages/axiom.jsx";
import Rewards from "./pages/rewards.jsx";
import ImagePage from "./components/imagePage.jsx";
import FloatingAIAssistant from "./components/FloatingAssistant.jsx";
import SendMessagePage from "./components/sendMessagePage.jsx";  {/* Import the SendMessagePage */}

function Nav() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

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

        <nav className={`links ${open ? "open" : ""}`}>
          <a href="/buy-sell" target="_blank" rel="noopener noreferrer">
            Launch Web App
          </a>

          <Link to="/meme-battle">Meme Battle</Link> {/* Existing Meme Battle route */}
          <Link to="/send-message">Send Message</Link> {/* New link for Send Message */}

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

export default function App() {
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

  return (
    <>
      <Nav /> {/* Navigation with new route */}
      
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/buy-sell" element={<BuySell />} />
        <Route path="/axiom" element={<Axiom />} />
        <Route path="/rewards" element={<Rewards />} />
        <Route path="/meme-battle" element={<ImagePage />} />
        <Route path="/send-message" element={<SendMessagePage />} /> {/* New route for SendMessagePage */}
      </Routes>

      <FloatingAIAssistant /> {/* Floating Assistant */}
    </>
  );
}
