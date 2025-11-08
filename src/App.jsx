import React, { useEffect, useState, useRef } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";

// Components & Pages
import TargetCursor from "./components/targetCursor.jsx";
import Landing from "./pages/Landing.jsx";
import BuySell from "./pages/BuySell.jsx";
import ImagePage from "./components/imagePage.jsx";
import SendMessagePage from "./components/sendMessagePage.jsx";
import FloatingAIAssistant from "./components/FloatingAssistant.jsx";

/* ======================================
   ULTRA-CENTERED, POLISHED LOADER (v3)
   ====================================== */
const loadingScreenCSS = `
  :root {
    --ls-bg: #070b14;
    --ls-brand-grad: linear-gradient(135deg, #a855f7 0%, #6366f1 50%, #38bdf8 100%);
    --ls-card: rgba(17, 24, 39, 0.55);
    --ls-border: rgba(148, 163, 184, 0.25);
    --ls-glow: rgba(99, 102, 241, 0.55);
    --ls-text: #e5e7eb;
    --ls-muted: #94a3b8;
  }

  .loading-screen {
    position: fixed;
    inset: 0;
    z-index: 99999;
    display: grid;
    place-items: center;
    background: radial-gradient(1200px 700px at 20% 20%, rgba(99,102,241,.18), transparent 60%),
                radial-gradient(1000px 600px at 80% 80%, rgba(168,85,247,.20), transparent 60%),
                var(--ls-bg);
    opacity: 1;
    transition: opacity 650ms ease, filter 650ms ease;
    pointer-events: auto;
    overflow: hidden;
  }

  .loading-screen.exiting {
    opacity: 0;
    filter: blur(2px);
    pointer-events: none;
  }

  .loading-bg-noise {
    position: absolute;
    inset: 0;
    opacity: .07;
    background-image: url("data:image/svg+xml;utf8,\
      <svg xmlns='http://www.w3.org/2000/svg' width='140' height='140' viewBox='0 0 140 140'>\
        <filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter>\
        <rect width='100%' height='100%' filter='url(%23n)' opacity='0.35'/>\
      </svg>");
    pointer-events: none;
  }

  .loading-stars {
    position: absolute;
    inset: -20%;
    background: radial-gradient(1px 1px at 20% 30%, #fff 60%, transparent 61%),
                radial-gradient(1px 1px at 80% 70%, #fff 60%, transparent 61%),
                radial-gradient(1px 1px at 35% 85%, #fff 60%, transparent 61%),
                radial-gradient(1px 1px at 65% 15%, #fff 60%, transparent 61%);
    opacity: .35;
    animation: twinkle 4.5s ease-in-out infinite alternate;
    pointer-events: none;
  }

  @keyframes twinkle {
    0%   { opacity: .20; transform: scale(1); }
    100% { opacity: .45; transform: scale(1.02); }
  }

  .loading-inner {
    position: relative;
    width: min(92vw, 560px);
    display: grid;
    gap: 20px;
    align-items: center;
    justify-items: center;
    text-align: center;
    padding: 28px 26px;
    background: linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.02));
    background-color: var(--ls-card);
    border: 1px solid var(--ls-border);
    border-radius: 20px;
    backdrop-filter: blur(12px) saturate(120%);
    box-shadow:
      0 10px 40px rgba(0,0,0,.45),
      0 0 60px 10px rgba(99,102,241,.15),
      inset 0 0 0 1px rgba(255,255,255,.04);
    transform: translateZ(0);
  }

  .loading-border-sheen {
    position: absolute;
    inset: -2px;
    border-radius: 22px;
    background: conic-gradient(from 0deg,
      rgba(56, 189, 248, 0.0) 0deg,
      rgba(56, 189, 248, 0.35) 70deg,
      rgba(129, 140, 248, 0.35) 140deg,
      rgba(168, 85, 247, 0.35) 210deg,
      rgba(56, 189, 248, 0.0) 360deg
    );
    -webkit-mask: linear-gradient(#000, #000) content-box, linear-gradient(#000, #000);
    -webkit-mask-composite: xor;
            mask-composite: exclude;
    padding: 2px;
    animation: rotateSheen 6s linear infinite;
    opacity: .55;
    pointer-events: none;
  }

  @keyframes rotateSheen {
    to { transform: rotate(360deg); }
  }

  .ring { width: 190px; height: 190px; display: grid; place-items: center; position: relative; }
  .ring-glow { position: absolute; inset: 0; filter: blur(18px); background: radial-gradient(closest-side, var(--ls-glow), transparent 70%); opacity: .45; pointer-events: none; }
  .ring-svg { width: 190px; height: 190px; transform: rotate(-90deg); }
  .ring-track { stroke: rgba(148, 163, 184, 0.2); stroke-width: 10; }

  .ring-progress {
    stroke: url(#ringGradient);
    stroke-width: 10;
    stroke-linecap: round;
    filter: drop-shadow(0 0 12px rgba(99,102,241,.65));
    transition: stroke-dashoffset 200ms ease;
  }

  .loading-logo {
    position: absolute;
    left: -15px;
    top: -15px;
    transform: translate(-50%, -50%);
    width: 220px;
    height: 240px;
    display: block;
    border-radius: 9999px;
    object-fit: contain;
    animation: logoPulse 3.2s ease-in-out infinite;
    user-select: none;
    background: transparent;
    filter: drop-shadow(0 0 24px rgba(99,102,241,.45));
  }

  @keyframes logoPulse {
    0%, 100% { transform: scale(1); opacity: .96; }
    50%      { transform: scale(1.05); opacity: 1; }
  }

  .loading-brand {
    font-size: clamp(1.6rem, 3.5vw, 2.4rem);
    font-weight: 900;
    letter-spacing: .18em;
    text-transform: uppercase;
    background: var(--ls-brand-grad);
    -webkit-background-clip: text;
            background-clip: text;
    color: transparent;
    text-shadow: 0 0 16px rgba(168,85,247,.45);
  }

  .progress-wrap { width: 100%; display: grid; gap: 10px; justify-items: center; }
  .progress-bar {
    width: min(92%, 460px);
    height: 14px;
    background: rgba(148, 163, 184, .14);
    border: 1px solid rgba(51, 65, 85, .8);
    border-radius: 999px;
    padding: 2px;
    box-shadow: inset 0 1px 3px rgba(0,0,0,.8), 0 0 30px rgba(100,116,139,.28);
    overflow: hidden;
  }
  .progress-fill {
    height: 100%; width: 0%; border-radius: 999px;
    background: linear-gradient(90deg, #38bdf8, #818cf8, #a855f7);
    background-size: 200% 200%;
    animation: gradFlow 4s ease infinite;
    transition: width 220ms cubic-bezier(.25,.1,.25,1);
    box-shadow: 0 0 16px #a855f7, 0 0 26px #38bdf8;
    border-right: 2px solid rgba(255,255,255,.85);
  }
  @keyframes gradFlow { 0%{background-position: 0% 50%}50%{background-position: 100% 50%}100%{background-position: 0% 50%} }
  .progress-nums { font-weight: 800; font-size: 1.05rem; color: var(--ls-text); text-shadow: 0 0 5px rgba(168,85,247,.5); }
  .progress-msg { color: var(--ls-muted); font-size: .95rem; letter-spacing: .08em; min-height: 1.2em; }
  .tip { color: var(--ls-muted); font-size: .85rem; letter-spacing: .05em; opacity: .9; }

  .skip-btn {
    margin-top: 4px; padding: 10px 14px; border-radius: 999px;
    background: rgba(2,6,23,.35); color: #e5e7eb;
    border: 1px solid var(--ls-border);
    cursor: pointer;
    transition: transform 160ms ease, background 160ms ease, border-color 160ms ease;
  }
  .skip-btn:hover { transform: translateY(-1px); background: rgba(2,6,23,.55); border-color: rgba(148,163,184,.45); }
  .skip-btn:active { transform: translateY(0); }

  @media (prefers-reduced-motion: reduce) {
    .loading-bg-noise, .loading-stars, .loading-logo, .progress-fill { animation: none !important; }
    .loading-screen { transition: none; }
  }
`;

/* ================================
   NAVBAR STYLES (clean + quiet CTA)
   ================================ */
const navCSS = `
  :root{
    --nav-bg-1: rgba(2,6,23,.80);
    --nav-bg-2: rgba(2,6,23,.55);
    --nav-border: rgba(148,163,184,.16);
    --nav-text: #e5e7eb;
    --nav-muted: #cbd5e1;

    /* Calm CTA palette */
    --cta-bg: linear-gradient(180deg, rgba(99,102,241,.16) 0%, rgba(99,102,241,.08) 100%);
    --cta-bg-hover: linear-gradient(180deg, rgba(99,102,241,.22) 0%, rgba(99,102,241,.10) 100%);
    --cta-border: rgba(99,102,241,.35);
    --cta-border-hover: rgba(99,102,241,.55);
  }

  .nav {
    position: sticky;
    top: 0;
    z-index: 1000;
    backdrop-filter: blur(8px) saturate(130%);
    background: linear-gradient(180deg, var(--nav-bg-1), var(--nav-bg-2));
    border-bottom: 1px solid var(--nav-border);
  }

  .nav-inner {
    max-width: 1200px;
    margin: 0 auto;
    padding: 10px 18px;
    display: flex;
    align-items: center;
    gap: 14px;
  }

  /* Left: brand */
  .brand { display: inline-flex; align-items: center; gap: 10px; }
  .brand-name {
    font-weight: 800;
    font-size: 1.02rem;
    letter-spacing: .01em;
    color: var(--nav-text);
    text-decoration: none;
  }

  /* Right: links + wallet + menu */
  .right-rail {
    margin-left: auto;
    display: inline-flex;
    align-items: center;
    gap: 12px;
  }

  .links {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .links a,
  .links span {
    position: relative;
    padding: 8px 12px;
    border-radius: 10px;
    color: var(--nav-muted);
    text-decoration: none;
    user-select: none;
    transition: color .16s ease, background .16s ease, border-color .16s ease, transform .12s ease;
  }

  .links a:hover { color: #fff; background: rgba(148,163,184,.08); }
  .links a[data-active="true"] { color: #fff; }

  /* Subtle underline for normal links */
  .links a::after {
    content:"";
    position:absolute;
    left:12px; right:12px; bottom:6px;
    height:2px; border-radius:999px;
    background: rgba(148,163,184,.25);
    opacity:0; transform: translateY(2px);
    transition: opacity .16s ease, transform .16s ease;
  }
  .links a:hover::after,
  .links a[data-active="true"]::after {
    opacity:1; transform: translateY(0);
  }

  /* ===== Calm CTA (Launch Web App) ===== */
  .links a.launch-cta {
    padding: 9px 14px;
    border-radius: 12px;
    color: #e8e9ff;
    background: var(--cta-bg);
    border: 1px solid var(--cta-border);
    box-shadow: inset 0 -1px 0 rgba(255,255,255,.06);
    font-weight: 800;
    letter-spacing: .01em;
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  .links a.launch-cta::after { display: none; } /* remove underline on CTA */

  .links a.launch-cta:hover {
    background: var(--cta-bg-hover);
    border-color: var(--cta-border-hover);
    color: #ffffff;
    transform: translateY(-1px);
  }
  .links a.launch-cta:active { transform: translateY(0); }

  .links a.launch-cta .i-rocket {
    display: inline-grid;
    place-items: center;
    font-size: 15px;
    line-height: 1;
    opacity: .95;
    transform: translateY(0);
    transition: transform .16s ease, opacity .16s ease;
  }
  .links a.launch-cta:hover .i-rocket { transform: translateY(-1px); opacity: 1; }

  /* Wallet button aligned + quiet */
  .nav .wallet-adapter-button {
    height: 34px;
    padding: 0 10px;
    border-radius: 10px !important;
    background: rgba(148,163,184,.10) !important;
    border: 1px solid var(--nav-border) !important;
    color: #e5e7eb !important;
    font-weight: 700 !important;
    box-shadow: none !important;
  }
  .nav .wallet-adapter-button:hover {
    background: rgba(148,163,184,.18) !important;
  }

  .menu {
    display: none;
    font-size: 20px;
    line-height: 1;
    padding: 6px 10px;
    color: var(--nav-text);
    background: transparent;
    border: 1px solid var(--nav-border);
    border-radius: 10px;
  }

  @media (max-width: 820px) {
    .menu { display: inline-flex; }
    .links { display: none; }
    .links.open {
      display: grid;
      gap: 8px;
      position: absolute;
      top: 62px; right: 12px; left: 12px;
      padding: 12px;
      background: rgba(2,6,23,.94);
      border: 1px solid var(--nav-border);
      border-radius: 14px;
      box-shadow: 0 20px 40px rgba(0,0,0,.45);
      z-index: 1001;
    }
    .links.open a, .links.open span { padding: 10px 12px; }
    .links.open a.launch-cta { width: 100%; justify-content: center; }
    .right-rail { gap: 10px; }
    .nav .wallet-adapter-button { height: 32px; padding: 0 10px; }
  }

  /* ===== Launch button (no bounce) ===== */
  @keyframes pulse-glow {
    0%,100% { box-shadow: inset 0 -1px 0 rgba(255,255,255,.06); }
    50% { box-shadow: inset 0 -1px 0 rgba(255,255,255,.12); }
  }
  @media (prefers-reduced-motion: reduce){ .launch-button{ animation: none !important; } }

  .links a.launch-button{
    background: linear-gradient(135deg,#667eea 0%,#764ba2 50%,#f093fb 100%);
    background-size: 200% 200%;
    color: #fff;
    font: inherit;
    text-transform: none;
    letter-spacing: 0;
    padding: 10px 14px;
    border: none;
    border-radius: var(--of-radius, 12px);
    cursor: pointer;
    position: relative;
    overflow: hidden;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    transition: transform .35s cubic-bezier(.2,.9,.25,1), filter .2s ease;
    animation: pulse-glow 3s ease-in-out infinite;
  }
  .links a.launch-button::after{ display:none; }

  .links a.launch-button::before{
    content:"";
    position:absolute; inset:0;
    background: linear-gradient(90deg,transparent,rgba(255,255,255,.35),transparent);
    transform: translateX(-100%);
    transition: transform .6s ease;
  }
  .links a.launch-button:hover::before{ transform: translateX(100%); }
  .links a.launch-button:hover{ transform: translateY(-3px); filter: brightness(1.05); }
  .links a.launch-button:active{ transform: translateY(-1px); }
  .links a.launch-button:focus-visible{ outline: 3px solid rgba(99,102,241,.5); outline-offset: 3px; }
  .links a.launch-button .i-rocket{ font-size: 15px; line-height: 1; }
  @media (max-width:820px){ .links.open a.launch-button{ width:100%; justify-content:center; } }

  /* --- CA copy button --- */
  .ca-btn{
    height: 34px;
    padding: 0 12px;
    border-radius: 10px;
    background: rgba(148,163,184,.10);
    border: 1px solid var(--nav-border);
    color: var(--nav-text);
    font-weight: 800;
    letter-spacing: .02em;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    transition: transform .12s ease, background .12s ease, border-color .12s ease;
  }
  .ca-btn:hover{ background: rgba(148,163,184,.18); transform: translateY(-1px); }
  .ca-btn:active{ transform: translateY(0); }
  .ca-btn .icon{ font-size:14px; line-height:1; }
  .ca-btn[data-copied="true"]{
    background: rgba(34,197,94,.16);
    border-color: rgba(34,197,94,.45);
    color: #dcfce7;
  }

  /* screen-reader utility */
  .sr-only{
    position:absolute; width:1px; height:1px; padding:0; margin:-1px;
    overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0;
  }

  @media (max-width: 820px){
    .ca-btn{ height: 32px; padding: 0 10px; }
  }
`;

// --- Contract Address (Vite env fallback) ---
// const TOKEN_CA =
//   (typeof import.meta !== "undefined" &&
//     import.meta.env &&
//     import.meta.env.VITE_TOKEN_CA) ||
//   "F5WgVZX3foCzdG1hcLoG8PdbyWaczDDNqSAxvnvspump"; // << replace with your real CA


/* ================================
   GUIDELINES GATE STYLES
   ================================ */
const guidelinesCSS = `
  :root {
    --g-bg: radial-gradient(1000px 600px at 20% 20%, rgba(99,102,241,.15), transparent 60%),
            radial-gradient(900px 500px at 80% 80%, rgba(168,85,247,.18), transparent 60%),
            #0b1220;
    --g-card: rgba(15, 23, 42, 0.7);
    --g-border: rgba(148,163,184,.25);
    --g-muted: #a3b2c7;
    --g-text: #e5e7eb;
  }
  .gate-wrap {
    min-height: calc(100vh - 64px);
    display: grid;
    place-items: center;
    padding: 24px;
    background: var(--g-bg);
  }
  .gate-card {
    width: min(720px, 92vw);
    display: grid;
    gap: 18px;
    padding: 24px;
    border-radius: 20px;
    border: 1px solid var(--g-border);
    background: linear-gradient(180deg, rgba(255,255,255,.05), rgba(255,255,255,.02));
    background-color: var(--g-card);
    backdrop-filter: blur(10px) saturate(120%);
    box-shadow:
      0 10px 40px rgba(0,0,0,.45),
      0 0 60px 10px rgba(99,102,241,.12),
      inset 0 0 0 1px rgba(255,255,255,.04);
    color: var(--g-text);
  }
  .gate-head { display: flex; align-items: center; gap: 12px; }
  .gate-head h2 {
    margin: 0;
    font-size: clamp(1.2rem, 2.2vw, 1.5rem);
    font-weight: 800;
    letter-spacing: .02em;
  }
  .gate-desc { color: var(--g-muted); line-height: 1.6; margin-top: -2px; }
  .gate-list { margin: 4px 0 0 0; padding: 0; list-style: none; display: grid; gap: 10px; }
  .gate-item { display: grid; grid-template-columns: 24px 1fr; gap: 10px; align-items: start; }
  .gate-item input[type="checkbox"] {
    width: 20px; height: 20px; cursor: pointer; accent-color: #6366f1; margin-top: 2px;
  }
  .gate-actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-top: 6px; }
  .gate-btn {
    height: 42px; padding: 0 16px; border-radius: 12px; border: 1px solid var(--g-border);
    background: rgba(148,163,184,.14); color: #fff; font-weight: 800; letter-spacing: .02em;
    cursor: pointer; transition: transform .12s ease, background .12s ease, border-color .12s ease;
  }
  .gate-btn:hover { transform: translateY(-1px); background: rgba(148,163,184,.2); }
  .gate-btn:disabled { opacity: .55; cursor: not-allowed; transform: none; }
  .gate-note { color: var(--g-muted); font-size: .9rem; }
  .gate-wallet {
    display: inline-flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 10px;
    background: rgba(2,6,23,.55); border: 1px solid var(--g-border); color: #e5e7eb;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  }
`;

/* -----------------
   LoadingScreen
   ----------------- */
function LoadingScreen({ onLoaded }) {
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const rafRef = useRef(null);
  const startRef = useRef(null);

  const RING_CIRCUMFERENCE = 2 * Math.PI * 80; // r=80 (see SVG)
  const LOADING_DURATION = 2300; // ms

  const messages = [
    "Booting core systems",
    "Calibrating sensors",
    "Linking neural mesh",
    "Preparing interface",
    "Almost ready",
  ];

  const currentMsg = (() => {
    if (progress < 20) return messages[0];
    if (progress < 40) return messages[1];
    if (progress < 65) return messages[2];
    if (progress < 85) return messages[3];
    return messages[4];
  })();

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev || ""; };
  }, []);

  useEffect(() => {
    const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

    const tick = (ts) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const t = Math.min(1, elapsed / LOADING_DURATION);
      const eased = easeInOutCubic(t);
      const pct = Math.round(eased * 100);
      setProgress(pct);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setTimeout(() => startExit(), 200);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Enter" || e.key === "Escape") {
        e.preventDefault();
        skip();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const startExit = () => {
    if (isExiting) return;
    setIsExiting(true);
    setTimeout(onLoaded, 650);
  };

  const skip = () => {
    setProgress(100);
    startExit();
  };

  const dashOffset = RING_CIRCUMFERENCE * (1 - progress / 100);

  return (
    <div className={`loading-screen ${isExiting ? "exiting" : ""}`} aria-busy="true">
      <div className="loading-bg-noise" />
      <div className="loading-stars" />
      <div className="loading-inner" role="dialog" aria-label="Loading One For All">
        <div className="loading-border-sheen" aria-hidden="true" />
        <div className="ring">
          <div className="ring-glow" aria-hidden="true" />
          <svg className="ring-svg" viewBox="0 0 200 200" role="img" aria-label="Loading ring">
            <defs>
              <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="50%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>
            <circle className="ring-track" cx="100" cy="100" r="80" fill="none" />
            <circle
              className="ring-progress"
              cx="100"
              cy="100"
              r="80"
              fill="none"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
            />
          </svg>

          <img
            src="/loading-screen.png"
            alt="One For All logo"
            className="loading-logo"
            draggable={false}
          />
        </div>

        <div className="loading-brand">ONE FOR ALL</div>

        <div className="progress-wrap">
          <div
            className="progress-bar"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            aria-label="Loading progress"
          >
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="progress-nums">{progress}%</div>
          <div className="progress-msg" aria-live="polite">{currentMsg}</div>
          <button type="button" className="skip-btn cursor-target" onClick={skip} aria-label="Skip loading">
            Skip intro
          </button>
        </div>

        <div className="tip">Tip: Press <strong>Enter</strong> or <strong>Esc</strong> to skip.</div>
      </div>
    </div>
  );
}

/* -------------
   Nav
   ------------- */
/* -------------
   Nav
   ------------- */
function Nav() {
  const [open, setOpen] = useState(false);
  const [copiedCA, setCopiedCA] = useState(false); // keeps CA feedback
  const location = useLocation();

  useEffect(() => { setOpen(false); }, [location.pathname]);
  useEffect(() => {
    const onEsc = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, []);

  const isActive = (path) => (location.pathname === path ? "true" : undefined);

  const disabledStyle = {
    opacity: 0.55,
    cursor: "not-allowed",
    textDecoration: "none",
    userSelect: "none",
  };

  // const copyCA = async () => {
  //   const ca = TOKEN_CA;
  //   try {
  //     await navigator.clipboard.writeText(ca);
  //     setCopiedCA(true);
  //     setTimeout(() => setCopiedCA(false), 1200);
  //   } catch {
  //     const ta = document.createElement("textarea");
  //     ta.value = ca;
  //     document.body.appendChild(ta);
  //     ta.select();
  //     try { document.execCommand("copy"); } catch {}
  //     document.body.removeChild(ta);
  //     setCopiedCA(true);
  //     setTimeout(() => setCopiedCA(false), 1200);
  //   }
  // };

  return (
    <header className="nav">
      <div className="nav-inner">
        {/* Left: logo + title */}
        <div className="brand">
          <img
            src="/loading-screen.png"
            alt="One For All"
            width={44}
            height={54}
            style={{ display: "block", borderRadius: "50%", objectFit: "cover" }}
            className="cursor-target"
          />
        </div>
        <Link to="/" className="brand-name cursor-target">One For All</Link>

        {/* Right: links (left), wallet + menu (middle), CA (rightmost) */}
        <div className="right-rail" style={{ marginLeft: "auto" }}>
          <nav className={`links ${open ? "open" : ""}`}>
            <Link
              to="/buy-sell"
              className="cursor-target launch-button"
              aria-label="Launch Web App"
              aria-current={location.pathname === "/buy-sell" ? "page" : undefined}
              data-active={isActive("/buy-sell")}
            >
              {/* <span className="i-rocket" aria-hidden="true">🚀</span> */}
              <span>Launch Web App</span>
            </Link>

            <Link
              to="/meme-battle"
              className="cursor-target"
              aria-current={location.pathname === "/meme-battle" ? "page" : undefined}
              data-active={isActive("/meme-battle")}
            >
              Meme Battle
            </Link>

            <Link
              to="/send-message"
              className="cursor-target"
              aria-current={location.pathname === "/send-message" ? "page" : undefined}
              data-active={isActive("/send-message")}
            >
              Send Message
            </Link>

            <span className="cursor-target" role="link" aria-disabled="true" title="Coming soon" style={disabledStyle}>
              Allverse
            </span>

            <span className="cursor-target" role="link" aria-disabled="true" title="Coming soon" style={disabledStyle}>
              Rewards
            </span>
          </nav>

          {/* Wallet button */}
          <WalletMultiButton />

          {/* Mobile toggle */}
          <button
            className="menu cursor-target"
            aria-label="Menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            ☰
          </button>

          {/* RIGHTMOST: CA copy button */}
          {/* <button
            type="button"
            className="ca-btn cursor-target"
            onClick={copyCA}
            data-copied={copiedCA ? "true" : undefined}
            title={`${TOKEN_CA} — click to copy`}
            aria-label={copiedCA ? "Copied contract address" : "Copy contract address"}
          >
            <span className="icon" aria-hidden="true">⧉</span>
            <span>{copiedCA ? "Copied!" : "CA"}</span>
          </button> */}
          <span className="sr-only" aria-live="polite">
            {copiedCA ? "Contract address copied" : ""}
          </span>
        </div>
      </div>
    </header>
  );
}

/* -------------------------------------------------
   Guidelines Gate (per-wallet acceptance required)
   ------------------------------------------------- */
const GUIDELINES_VERSION = "v1";
const storageKeyFor = (wallet) => `ofa_guidelines_${GUIDELINES_VERSION}_${wallet}`;

function GuidelinesPanel({ onAgreed }) {
  const { publicKey } = useWallet();
  const walletAddr = publicKey?.toBase58() ?? null;

  const [noBully, setNoBully] = useState(false);
  const [noMisuse, setNoMisuse] = useState(false);
  const [noHate, setNoHate] = useState(false);

  // Inject styles for this panel
  useEffect(() => {
    const id = "guidelines-styles";
    let tag = document.getElementById(id);
    if (!tag) {
      tag = document.createElement("style");
      tag.id = id;
      tag.textContent = guidelinesCSS;
      document.head.appendChild(tag);
    }
    return () => {
      const t = document.getElementById(id);
      if (t) document.head.removeChild(t);
    };
  }, []);

  const canAgree = walletAddr && noBully && noMisuse && noHate;

  const shortAddr = walletAddr
    ? `${walletAddr.slice(0, 4)}…${walletAddr.slice(-4)}`
    : "—";

  return (
    <div className="gate-wrap">
      <div className="gate-card" role="dialog" aria-labelledby="gate-title" aria-describedby="gate-desc">
        <div className="gate-head">
          <img src="/loading-screen.png" alt="" width={36} height={36} style={{ borderRadius: 10 }} />
          <h2 id="gate-title">Community Guidelines Agreement</h2>
        </div>
        <p id="gate-desc" className="gate-desc">
          To participate in social features, you must connect a wallet and agree to follow our rules. Violations may lead to removal of content or account restrictions.
        </p>

        <ul className="gate-list">
          <li className="gate-item">
            <input id="g1" type="checkbox" checked={noBully} onChange={(e) => setNoBully(e.target.checked)} />
            <label htmlFor="g1"><strong>No bullying or harassment.</strong> Treat others with respect at all times.</label>
          </li>
          <li className="gate-item">
            <input id="g2" type="checkbox" checked={noMisuse} onChange={(e) => setNoMisuse(e.target.checked)} />
            <label htmlFor="g2"><strong>No misuse.</strong> Don’t spam, scam, impersonate, or share illegal content.</label>
          </li>
          <li className="gate-item">
            <input id="g3" type="checkbox" checked={noHate} onChange={(e) => setNoHate(e.target.checked)} />
            <label htmlFor="g3"><strong>No hateful speech.</strong> Zero tolerance for hate targeting protected groups.</label>
          </li>
        </ul>

        <div className="gate-actions">
          <button
            type="button"
            className="gate-btn cursor-target"
            disabled={!canAgree}
            onClick={onAgreed}
          >
            Agree & Continue
          </button>

          {!walletAddr && (
            <div className="gate-note">
              Connect a wallet to continue:
              &nbsp; <WalletMultiButton />
            </div>
          )}

          {walletAddr && (
            <div className="gate-wallet" aria-live="polite">
              Agreeing as <span>{shortAddr}</span>
            </div>
          )}
        </div>

        <div className="gate-note">
          Your consent is stored locally per wallet (version ${GUIDELINES_VERSION}). Switching wallets will require re-acceptance.
        </div>
      </div>
    </div>
  );
}

function GuidelinesGate({ children }) {
  const { publicKey } = useWallet();
  const walletAddr = publicKey?.toBase58() ?? null;

  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (!walletAddr) {
      setAccepted(false);
      return;
    }
    const v = localStorage.getItem(storageKeyFor(walletAddr));
    setAccepted(v === "true");
  }, [walletAddr]);

  const handleAgree = () => {
    if (!walletAddr) return;
    localStorage.setItem(storageKeyFor(walletAddr), "true");
    setAccepted(true);
  };

  if (!walletAddr || !accepted) {
    return <GuidelinesPanel onAgreed={handleAgree} />;
  }

  return children;
}

/* -------------
   App
   ------------- */
export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const mouseDataRef = useRef({ x: 0.5, y: 0.5, active: 0.0 });
  const { publicKey } = useWallet();
  const senderWallet = publicKey?.toBase58() ?? null;

  // Inject loader CSS and ensure bg layer exists
  useEffect(() => {
    const styleTagId = "loading-screen-styles";
    let styleTag = document.getElementById(styleTagId);

    if (!styleTag) {
      styleTag = document.createElement("style");
      styleTag.id = styleTagId;
      styleTag.textContent = loadingScreenCSS;
      document.head.appendChild(styleTag);
    }

    let bg = document.getElementById("page-bg-layer");
    if (!bg) {
      bg = document.createElement("div");
      bg.id = "page-bg-layer";
      bg.className = "page-bg";
      document.body.appendChild(bg);
    }

    return () => {
      const existingStyleTag = document.getElementById(styleTagId);
      if (existingStyleTag) document.head.removeChild(existingStyleTag);
    };
  }, []);

  // Inject navbar CSS
  useEffect(() => {
    const styleId = "nav-styles";
    let tag = document.getElementById(styleId);
    if (!tag) {
      tag = document.createElement("style");
      tag.id = styleId;
      tag.textContent = navCSS;
      document.head.appendChild(tag);
    }
    return () => {
      const existing = document.getElementById(styleId);
      if (existing) document.head.removeChild(existing);
    };
  }, []);

  // Global mouse listeners (kept for other components like ImagePage)
  useEffect(() => {
    const handleMouseMove = (e) => {
      mouseDataRef.current = {
        x: e.clientX / window.innerWidth,
        y: 1.0 - e.clientY / window.innerHeight,
        active: 1.0,
      };
    };
    const handleMouseLeave = () => {
      mouseDataRef.current = { ...mouseDataRef.current, active: 0.0 };
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  if (isLoading) return <LoadingScreen onLoaded={() => setIsLoading(false)} />;

  return (
    <>
      {/* 1. Custom Cursor */}
      <TargetCursor
        targetSelector="button, a, .cursor-target"
        hideDefaultCursor={true}
        spinDuration={2}
      />

      {/* 2. Main Content */}
      <div style={{ position: "relative", zIndex: 1, minHeight: "100vh" }}>
        <Nav />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/buy-sell" element={<BuySell />} />

          {/* Protected routes */}
          <Route
            path="/meme-battle"
            element={
              <GuidelinesGate>
                <ImagePage mouseDataRef={mouseDataRef} />
              </GuidelinesGate>
            }
          />
          <Route
            path="/send-message"
            element={
              <GuidelinesGate>
                <SendMessagePage senderWallet={senderWallet} />
              </GuidelinesGate>
            }
          />
        </Routes>
      </div>

      {/* 3. Floating Assistant */}
      <FloatingAIAssistant />
    </>
  );
}
