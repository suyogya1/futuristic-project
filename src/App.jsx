import React, { useEffect, useState } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import Landing from "./pages/Landing.jsx";
import BuySell from "./pages/BuySell.jsx";
import Axiom from "./pages/Axiom.jsx";
import Rewards from "./pages/Rewards.jsx";
import ImagePage from "./components/imagePage.jsx";
import FloatingAIAssistant from "./components/FloatingAssistant.jsx";
import SendMessagePage from "./components/sendMessagePage.jsx";

// --- NEW ENHANCED LOADING SCREEN ---

const loadingScreenCSS = `
  .loading-screen {
    position: fixed;
    inset: 0;
    background-color: #07090e;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    transition: opacity 0.8s ease-in-out;
    opacity: 1;
  }
  .loading-screen.exiting {
    opacity: 0;
    pointer-events: none;
  }
  .loading-screen > * {
    animation: fade-in 1s ease-out forwards;
  }
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(15px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .loading-logo {
    width: 120px;
    height: 150px;
    margin-bottom: 24px;
    animation: pulse-glow 3.5s ease-in-out infinite;
    filter: drop-shadow(0 0 15px rgba(236, 72, 153, 0.4));
  }
  @keyframes pulse-glow {
    0%, 100% {
      transform: scale(1);
      opacity: 0.9;
    }
    50% {
      transform: scale(1.05);
      opacity: 1;
    }
  }
  .loading-brand {
    font-size: 2.5rem;
    font-weight: 900;
    letter-spacing: .05em;
    margin-bottom: 24px;
    background: linear-gradient(135deg, #facc15, #d97706);
    -webkit-background-clip: text;
    color: transparent;
  }
  .progress-bar-container {
    width: 80%;
    max-width: 400px;
    height: 10px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 2px;
    overflow: hidden;
    box-shadow: 0 0 20px rgba(236, 72, 153, 0.2), inset 0 1px 2px rgba(0,0,0,0.5);
  }
  .progress-bar-fill {
    height: 100%;
    border-radius: 8px;
    background: linear-gradient(90deg, #8b5cf6, #ec4899, #f59e0b);
    background-size: 200% 200%;
    transition: width 0.15s linear;
    animation: gradient-animation 3s ease infinite;
    box-shadow: 0 0 10px #ec4899, 0 0 20px #8b5cf6;
  }
  @keyframes gradient-animation {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  .progress-text-container {
      margin-top: 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      min-width: 200px; /* Prevents layout shift */
      text-align: center;
  }
  .progress-text {
    font-size: 1rem;
    font-weight: 600;
    color: #94a3b8;
    font-family: 'Courier New', Courier, monospace;
  }
  .progress-subtext {
      font-size: 0.8rem;
      color: #64748b;
      font-family: 'Courier New', Courier, monospace;
      letter-spacing: .05em;
  }
`;

function LoadingScreen({ onLoaded }) {
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setIsExiting(true), 300);
          setTimeout(onLoaded, 1100); // Wait for fade out to complete
          return 100;
        }
        return prev + 1;
      });
    }, 25); // Adjust time for faster/slower loading

    return () => clearInterval(interval);
  }, [onLoaded]);

  return (
    <div className={`loading-screen ${isExiting ? 'exiting' : ''}`}>
      <img src="/public/1fa-logo.png" alt="Loading Logo" className="loading-logo" />
      <div className="loading-brand">One For All</div>
      <div className="progress-bar-container">
        <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
      </div>
      <div className="progress-text-container">
        <span className="progress-text">{progress}%</span>
        <span className="progress-subtext">Initializing systems...</span>
      </div>
    </div>
  );
}

// --- Your Existing Navigation Component ---

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
          <Link to="/meme-battle">Meme Battle</Link>
          <Link to="/send-message">Send Message</Link>
          {/* <Link to="/axiom">Axiom-like</Link>
          <Link to="/rewards">Rewards</Link> */}
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

// --- UPDATED APP COMPONENT ---

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Inject CSS for loading screen
    const styleTag = document.createElement("style");
    styleTag.id = "loading-screen-styles";
    if (!document.getElementById(styleTag.id)) {
        styleTag.textContent = loadingScreenCSS;
        document.head.appendChild(styleTag);
    }
    
    // Your existing background layer logic
    let bg = document.getElementById("page-bg-layer");
    if (!bg) {
      bg = document.createElement("div");
      bg.id = "page-bg-layer";
      bg.className = "page-bg";
      document.body.appendChild(bg);
    }
  }, []);

  if (isLoading) {
    return <LoadingScreen onLoaded={() => setIsLoading(false)} />;
  }

  return (
    <>
      <Nav />
      
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/buy-sell" element={<BuySell />} />
        {/* <Route path="/axiom" element={<Axiom />} />
        <Route path="/rewards" element={<Rewards />} /> */}
        <Route path="/meme-battle" element={<ImagePage />} />
        <Route path="/send-message" element={<SendMessagePage />} />
      </Routes>

      <FloatingAIAssistant />
    </>
  );
}