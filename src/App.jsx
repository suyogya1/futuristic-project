<<<<<<< HEAD
import React, { useEffect, useState, useRef } from "react";
=======
import React, { useEffect, useState } from "react";
>>>>>>> 3e76c714ca5b59cf027fe15d5f1076e4d692e0c7
import { Routes, Route, Link, useLocation } from "react-router-dom";
import TargetCursor from "./components/targetCursor.jsx";
import Galaxy from "./components/galaxy.jsx";
import Landing from "./pages/Landing.jsx";
import BuySell from "./pages/BuySell.jsx";
import Axiom from "./pages/Axiom.jsx";
<<<<<<< HEAD
import Rewards from "./pages/rewards.jsx";
// Assuming ImagePage is now correctly in the 'pages' folder based on previous steps
import ImagePage from "./components/imagePage.jsx";
import FloatingAIAssistant from "./components/floatingAssistant.jsx";
import SendMessagePage from "./components/sendMessagePage.jsx";

// --- ENHANCED LOADING SCREEN ---
=======
import Rewards from "./pages/Rewards.jsx";
import ImagePage from "./components/imagePage.jsx";
import FloatingAIAssistant from "./components/FloatingAssistant.jsx";
import SendMessagePage from "./components/sendMessagePage.jsx";

// --- NEW ENHANCED LOADING SCREEN ---
>>>>>>> 3e76c714ca5b59cf027fe15d5f1076e4d692e0c7

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
<<<<<<< HEAD
    width: 500px;
    height: 250px;
=======
    width: 120px;
    height: 150px;
>>>>>>> 3e76c714ca5b59cf027fe15d5f1076e4d692e0c7
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
<<<<<<< HEAD
      min-width: 200px;
=======
      min-width: 200px; /* Prevents layout shift */
>>>>>>> 3e76c714ca5b59cf027fe15d5f1076e4d692e0c7
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
<<<<<<< HEAD
          setTimeout(onLoaded, 1100); // Wait for fade out
=======
          setTimeout(onLoaded, 1100); // Wait for fade out to complete
>>>>>>> 3e76c714ca5b59cf027fe15d5f1076e4d692e0c7
          return 100;
        }
        return prev + 1;
      });
    }, 25); // Adjust time for faster/slower loading

    return () => clearInterval(interval);
  }, [onLoaded]);

  return (
    <div className={`loading-screen ${isExiting ? 'exiting' : ''}`}>
<<<<<<< HEAD
      <img src="/loading-screen.png" alt="Loading Logo" className="loading-logo" /> {/* Ensure path is correct, usually relative to public folder */}
=======
      <img src="/public/1fa-logo.png" alt="Loading Logo" className="loading-logo" />
>>>>>>> 3e76c714ca5b59cf027fe15d5f1076e4d692e0c7
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

<<<<<<< HEAD
// --- Navigation Component ---
=======
// --- Your Existing Navigation Component ---
>>>>>>> 3e76c714ca5b59cf027fe15d5f1076e4d692e0c7

function Nav() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false); // Close menu on route change
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
          <Link to="/" className="cursor-target" style={{ textDecoration: "none" }}>One For All</Link> {/* Added cursor-target */}
        </div>

        <nav className={`links ${open ? "open" : ""}`}>
          <a href="/buy-sell" className="cursor-target" rel="noopener noreferrer"> {/* Added cursor-target */}
            Launch Web App
          </a>
<<<<<<< HEAD
          <Link to="/meme-battle" className="cursor-target">Meme Battle</Link> {/* Added cursor-target */}
          <Link to="/send-message" className="cursor-target">Send Message</Link> {/* Added cursor-target */}
          {/* <Link to="/axiom" className="cursor-target">Axiom-like</Link>
          <Link to="/rewards" className="cursor-target">Rewards</Link> */}
=======
          <Link to="/meme-battle">Meme Battle</Link>
          <Link to="/send-message">Send Message</Link>
          {/* <Link to="/axiom">Axiom-like</Link>
          <Link to="/rewards">Rewards</Link> */}
>>>>>>> 3e76c714ca5b59cf027fe15d5f1076e4d692e0c7
        </nav>

        <button
          className="menu cursor-target" // Already had cursor-target
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

// --- Main App Component ---

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

<<<<<<< HEAD
  // Global mouse data reference
  const mouseDataRef = useRef({ x: 0.5, y: 0.5, active: 0.0 }); // x: 0-1 (left-right), y: 0-1 (bottom-top for WebGL)

  // Inject CSS for loading screen
=======
>>>>>>> 3e76c714ca5b59cf027fe15d5f1076e4d692e0c7
  useEffect(() => {
    const styleTag = document.createElement("style");
    styleTag.id = "loading-screen-styles";
    if (!document.getElementById(styleTag.id)) {
        styleTag.textContent = loadingScreenCSS;
        document.head.appendChild(styleTag);
<<<<<<< HEAD
    }
    return () => {
        const styleTagToRemove = document.getElementById(styleTag.id);
        if (styleTagToRemove) {
            document.head.removeChild(styleTagToRemove);
        }
    };
  }, []);

  // Global mouse listeners to update the ref
  useEffect(() => {
    const handleMouseMove = (e) => {
      // Update ref with normalized coordinates (0 to 1), Y inverted for WebGL
      mouseDataRef.current = {
        x: e.clientX / window.innerWidth,
        y: 1.0 - (e.clientY / window.innerHeight), // Invert Y: 0 at bottom, 1 at top
        active: 1.0
      };
    };

    const handleMouseLeave = () => {
      // Optionally reset to center or just mark inactive
      mouseDataRef.current = {
         ...mouseDataRef.current, // Keep last position?
         // x: 0.5, y: 0.5, // Or reset to center
         active: 0.0
      };
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave); // Track leaving window

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []); // Run only once on mount

=======
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
>>>>>>> 3e76c714ca5b59cf027fe15d5f1076e4d692e0c7

  if (isLoading) {
    return <LoadingScreen onLoaded={() => setIsLoading(false)} />;
  }

  // --- Render Structure ---
  return (
    <>
<<<<<<< HEAD
      {/* 1. Custom Cursor (Highest z-index, renders on top) */}
      <TargetCursor
        targetSelector="button, a, .cursor-target" // Selects links, buttons, and elements with the class
        hideDefaultCursor={true}
        spinDuration={2}
      />
=======
      <Nav />
      
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/buy-sell" element={<BuySell />} />
        {/* <Route path="/axiom" element={<Axiom />} />
        <Route path="/rewards" element={<Rewards />} /> */}
        <Route path="/meme-battle" element={<ImagePage />} />
        <Route path="/send-message" element={<SendMessagePage />} />
      </Routes>
>>>>>>> 3e76c714ca5b59cf027fe15d5f1076e4d692e0c7

      {/* 2. Galaxy Background (Fixed position, lowest z-index) */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0 // Base layer
      }}>
        <Galaxy
          mouseDataRef={mouseDataRef} // Pass the ref for interaction
          mouseInteraction={true}    // Enable interaction
          mouseRepulsion={true}      // Enable repulsion effect
          // Other Galaxy props...
          density={1}
          glowIntensity={0.3}
          twinkleIntensity={0.3}
        />
      </div>

      {/* 3. Main Content Layer (Relative position, middle z-index) */}
      <div style={{
        position: 'relative', // Allows children to be positioned normally
        zIndex: 1,           // Renders above Galaxy
        minHeight: '100vh', // Ensure it covers the screen height
        // background: 'transparent' // Ensure this layer is transparent
      }}>
        <Nav />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/buy-sell" element={<BuySell />} />

          {/* Pass mouseDataRef down to ImagePage */}
          <Route
             path="/meme-battle"
             element={<ImagePage mouseDataRef={mouseDataRef} />}
          />

          <Route path="/send-message" element={<SendMessagePage />} />
          {/* <Route path="/axiom" element={<Axiom />} />
          <Route path="/rewards" element={<Rewards />} /> */}
        </Routes>
      </div>

      {/* 4. Floating Assistant (Renders on top due to its own high z-index) */}
      <FloatingAIAssistant />
    </>
  );
}