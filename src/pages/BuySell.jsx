// src/pages/BuySell.jsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DexScreenerChart from "../components/dexScreenerChart.jsx";
import ConnectWallet from "../components/connectWallet.jsx";

export default function BuySell() {
  const navigate = useNavigate();
  const location = useLocation();

  // Chart pair (for DexScreener embed only)
  const pairPath = "solana/acz8umucngsdqkrpjihuvksgvgoyapduemkr2zcq2vxi";

  // --- Modal state + refs (focus trap) ---
  const [showOptions, setShowOptions] = useState(false);
  const modalRef = useRef(null);

  // Links for the 4 launch options
  const LINKS = {
    pumpfun: "https://pump.fun/coin/F5WgVZX3foCzdG1hcLoG8PdbyWaczDDNqSAxvnvspump",
    axiom: "https://axiom.trade/meme/AcZ8uMuCnGsDQKrPjiHuVksgvgoYAPDuEMkr2zcq2vXi?chain=sol", 
    bnb: "https://nova.trade/token/F5WgVZX3foCzdG1hcLoG8PdbyWaczDDNqSAxvnvspump",
    jupiter: "https://gmgn.ai/sol/token/F5WgVZX3foCzdG1hcLoG8PdbyWaczDDNqSAxvnvspump",
  };

  const openExternal = (url) => window.open(url, "_blank", "noopener,noreferrer");

  const handleOpenModal = () => setShowOptions(true);
  const handleCloseModal = () => setShowOptions(false);

  // Focus the first option when modal opens + trap focus inside
  useEffect(() => {
    if (!showOptions || !modalRef.current) return;

    const focusables = modalRef.current.querySelectorAll(
      'button, [href], [tabindex]:not([tabindex="-1"])'
    );
    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    first && first.focus();

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleCloseModal();
      }
      if (e.key === "Tab") {
        // trap focus
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [showOptions]);

  // Smooth-scroll utility (kept from your existing flow)
  useEffect(() => {
    const decodeHash = () => {
      const m = window.location.hash.match(/^#scroll=(.+)$/);
      return m ? decodeURIComponent(m[1]) : null;
    };

    const selector =
      location.state?.scrollTarget ||
      new URLSearchParams(window.location.search).get("scroll") ||
      decodeHash() ||
      sessionStorage.getItem("of_scroll_target");

    if (!selector) return;
    sessionStorage.removeItem("of_scroll_target");

    let tries = 0;
    const maxTries = 150;
    const interval = 100;

    const findTarget = () => {
      let el = document.querySelector(selector);
      if (!el && selector.includes(".chart-page")) {
        el =
          document.querySelector(".chart-host") ||
          document.querySelector(".dexscreener-widget") ||
          document.querySelector('iframe[src*="dexscreener"]') ||
          document.querySelector("[data-chart]") ||
          document.querySelector("[data-widget='chart']");
      }
      if (!el && selector === ".wallet-card") {
        el =
          document.querySelector(".wallet-card") ||
          document.querySelector("#wallet-card") ||
          document.querySelector('[class*="wallet-card"]');
      }
      if (!el && selector === ".launch-button") {
        el =
          document.querySelector(".launch-button") ||
          document.querySelector("#launch-button") ||
          document.querySelector('[class*="launch-button"]');
      }
      return el;
    };

    const tick = () => {
      const el = findTarget();
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("of-flash-focus");
        setTimeout(() => el.classList.remove("of-flash-focus"), 1800);
        clearInterval(timer);
      } else if (++tries >= maxTries) {
        clearInterval(timer);
      }
    };

    const timer = setInterval(tick, interval);
    tick();
    return () => clearInterval(timer);
  }, [location]);

  return (
    <main>
      {/* Styles */}
      <style>{`
        .of-flash-focus {
          outline: 2px solid var(--brand, #6ee7ff);
          outline-offset: 2px;
          transition: outline-color .3s ease;
        }

        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&display=swap');

        :root {
          --of-bg: #0a0f1a;
          --of-card: #0f1524;
          --of-card-2: #0c1220;
          --of-border: rgba(126,231,255,0.18);
          --of-border-strong: rgba(126,231,255,0.45);
          --of-text: #e8f7ff;
          --of-sub: #a8c8d6;
          --of-glow-a: #6ee7ff;
          --of-glow-b: #a78bfa;
          --of-radius: 20px;
        }

        /* Button animation (with reduced-motion support) */
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(102,126,234,0.35),
                        0 0 40px rgba(102,126,234,0.18),
                        0 10px 40px rgba(102,126,234,0.35);
          }
          50% {
            box-shadow: 0 0 30px rgba(102,126,234,0.55),
                        0 0 60px rgba(102,126,234,0.35),
                        0 10px 50px rgba(102,126,234,0.55);
          }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .launch-button { animation: none !important; }
        }

        .launch-button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
          background-size: 200% 200%;
          color: white;
          font-family: 'Space Grotesk', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          font-size: 22px;
          font-weight: 700;
          padding: 22px 64px;
          border: none;
          border-radius: var(--of-radius);
          cursor: pointer;
          position: relative;
          overflow: hidden;
          text-transform: uppercase;
          letter-spacing: 2px;
          animation: pulse-glow 3s ease-in-out infinite, float 4s ease-in-out infinite;
          transition: transform .35s cubic-bezier(.2,.9,.25,1), filter .2s ease;
        }
        .launch-button::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.35), transparent);
          transform: translateX(-100%);
          transition: transform .6s ease;
        }
        .launch-button:hover::before { transform: translateX(100%); }
        .launch-button:hover { transform: translateY(-6px) scale(1.04); filter: brightness(1.05); }
        .launch-button:active { transform: translateY(-2px) scale(1.02); }
        .launch-button:focus-visible { outline: 3px solid var(--of-glow-a); outline-offset: 3px; }

        /* Modal */
        .of-modal-overlay {
          position: fixed;
          inset: 0;
          background: radial-gradient(1000px 700px at 50% 50%, rgba(23,27,44,.75), rgba(7,11,20,.92));
          backdrop-filter: blur(5px);
          display: grid;
          place-items: center;
          z-index: 1000;
          animation: fadeIn .18s ease-out;
        }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }

        .of-modal {
          width: min(940px, calc(100% - 24px));
          border-radius: var(--of-radius);
          background:
            linear-gradient(180deg, rgba(16,20,36,.98), rgba(10,14,26,.98)),
            radial-gradient(120% 120% at 10% 10%, rgba(110,231,255,.08), transparent 50%),
            radial-gradient(120% 120% at 90% 90%, rgba(167,139,250,.08), transparent 50%);
          border: 1px solid var(--of-border);
          box-shadow:
            0 22px 80px rgba(0,0,0,.55),
            inset 0 0 60px rgba(126,231,255,.06);
          padding: 22px 22px 26px;
          transform: translateY(12px) scale(.98);
          animation: popIn .2s ease-out forwards;
        }
        @keyframes popIn { to { transform: translateY(0) scale(1) } }

        .of-modal-header {
          display: flex; align-items: center; justify-content: space-between;
          gap: 12px; margin-bottom: 14px;
        }
        .of-modal-title {
          font-family: 'Space Grotesk', 'Inter', sans-serif;
          font-size: 22px; font-weight: 700; letter-spacing: .5px; color: var(--of-text);
        }
        .of-modal-close {
          background: rgba(110,231,255,.06);
          border: 1px solid var(--of-border);
          color: #cfefff;
          border-radius: 10px; width: 40px; height: 40px;
          font-size: 18px; cursor: pointer;
          transition: transform .15s ease, background .15s ease, border-color .15s ease;
        }
        .of-modal-close:hover { transform: translateY(-2px); background: rgba(126,231,255,.12); border-color: var(--of-border-strong); }
        .of-modal-close:focus-visible { outline: 3px solid var(--of-glow-a); outline-offset: 3px; }

        .of-option-grid {
          display: grid; gap: 14px; grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        @media (max-width: 700px) { .of-option-grid { grid-template-columns: 1fr } }

        .of-option-card {
          display: flex; align-items: center; justify-content: space-between;
          gap: 14px; padding: 16px 18px; border-radius: 16px; width: 100%;
          background: linear-gradient(180deg, var(--of-card), var(--of-card-2));
          border: 1px solid var(--of-border);
          cursor: pointer;
          transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease, background .18s ease;
          position: relative;
        }
        .of-option-card::after {
          content: "";
          position: absolute; inset: 0;
          border-radius: 16px; padding: 1px;
          background: linear-gradient(135deg, rgba(110,231,255,.35), rgba(167,139,250,.35));
          -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          -webkit-mask-composite: xor; mask-composite: exclude;
          opacity: .0; transition: opacity .2s ease;
        }
        .of-option-card:hover { transform: translateY(-3px); border-color: var(--of-border-strong); box-shadow: 0 12px 40px rgba(0,0,0,.45); }
        .of-option-card:hover::after { opacity: .6; }
        .of-option-card:focus-visible { outline: 3px solid var(--of-glow-a); outline-offset: 3px; }

        .of-option-left { display: flex; align-items: center; gap: 12px; text-align: left; }
        .of-option-icon {
          width: 42px; height: 42px; border-radius: 12px; display: grid; place-items: center;
          background: radial-gradient(60% 60% at 50% 40%, rgba(126,231,255,.35), rgba(126,231,255,.08));
          border: 1px solid var(--of-border);
        }
        .of-option-title {
          font-family: 'Space Grotesk', 'Inter', sans-serif;
          color: var(--of-text); font-size: 16px; font-weight: 700; letter-spacing: .3px;
        }
        .of-option-sub { color: var(--of-sub); font-size: 12px; opacity: .95; }
        .of-option-cta {
          font-size: 12px; color: #cfefff; border: 1px dashed rgba(126,231,255,.35);
          padding: 6px 10px; border-radius: 999px; opacity: .95;
        }
      `}</style>

      <section className="section" style={{ paddingTop: 32 }}>
        <div className="container">
          <h1 className="section-title" style={{ marginBottom: 8 }}>
            Buy / Sell 1FA
          </h1>
          <p className="section-sub" style={{ marginBottom: 20 }}>
            View the live market and explore our platform
          </p>

          {/* Wallet */}
          <div className="wallet-card" style={{ marginTop: 24, marginBottom: 32 }}>
            <ConnectWallet />
          </div>

          {/* Live chart */}
          <div style={{ marginTop: 8 }}>
            <h3 className="section-title" style={{ fontSize: 18, marginBottom: 8 }}>
              Live Chart
            </h3>
            <div
              className="chart-host chart-page unselectable on-widget"
              data-chart
              data-widget="chart"
              style={{ borderRadius: 12, overflow: "hidden" }}
            >
              <DexScreenerChart pairPath={pairPath} theme="dark" height={560} />
            </div>
          </div>

          {/* Launch Button */}
          <div
            style={{
              marginTop: 48,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: "40px 0",
            }}
          >
            <button
              id="launch-button"
              onClick={handleOpenModal}
              className="launch-button"
              aria-haspopup="dialog"
              aria-expanded={showOptions ? "true" : "false"}
            >
              Launch Trading Platform
            </button>
          </div>
        </div>
      </section>

      {/* Modal */}
      {showOptions && (
        <div
          className="of-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="of-modal-title"
          onClick={handleCloseModal}
        >
          <div
            className="of-modal"
            role="document"
            ref={modalRef}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="of-modal-header">
              <div id="of-modal-title" className="of-modal-title">Choose where to go</div>
              <button className="of-modal-close" aria-label="Close" onClick={handleCloseModal}>
                ×
              </button>
            </div>

            <div className="of-option-grid">
              {/* Pump.fun */}
              <button
                type="button"
                className="of-option-card"
                onClick={() => openExternal(LINKS.pumpfun)}
              >
                <div className="of-option-left">
                  <div className="of-option-icon" aria-hidden="true">
                    {/* Rocket */}
                    <svg width="20" height="20" viewBox="0 0 24 24">
                      <path d="M12 3l3 3-7.5 7.5L6 18l4.5-1.5L18 9l-6-6z" fill="currentColor"/>
                      <path d="M7 20c.5-1.8 2.2-3.5 4-4" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                    </svg>
                  </div>
                  <div>
                    <div className="of-option-title">Pump.fun</div>
                    <div className="of-option-sub">Mint & trade memecoins</div>
                  </div>
                </div>
                <span className="of-option-cta">Open ↗</span>
              </button>

              {/* Axiom (internal route) */}
              <button
                type="button"
                className="of-option-card"
                onClick={() => openExternal(LINKS.axiom)}
              >
                <div className="of-option-left">
                  <div className="of-option-icon" aria-hidden="true">
                    {/* Atom */}
                    <svg width="20" height="20" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="2" fill="currentColor"/>
                      <ellipse cx="12" cy="12" rx="8" ry="3.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                      <ellipse cx="12" cy="12" rx="3.5" ry="8" transform="rotate(60 12 12)" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                      <ellipse cx="12" cy="12" rx="3.5" ry="8" transform="rotate(-60 12 12)" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                    </svg>
                  </div>
                  <div>
                    <div className="of-option-title">Axiom</div>
                    <div className="of-option-sub">Trade via our Axiom flow</div>
                  </div>
                </div>
                <span className="of-option-cta">Open ↗ </span>
              </button>

              {/* BNB / PancakeSwap */}
              <button
                type="button"
                className="of-option-card"
                onClick={() => openExternal(LINKS.bnb)}
              >
                <div className="of-option-left">
                  <div className="of-option-icon" aria-hidden="true">
                    {/* BNB hex */}
                    <svg width="20" height="20" viewBox="0 0 24 24">
                      <path d="M12 2l8 4.5v9L12 20l-8-4.5v-9L12 2z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                      <path d="M12 7l4 2.2v4.6L12 16l-4-2.2V9.2L12 7z" fill="currentColor"/>
                    </svg>
                  </div>
                  <div>
                    <div className="of-option-title">Nova </div>
                    <div className="of-option-sub">Trade via Nova trade</div>
                  </div>
                </div>
                <span className="of-option-cta">Open ↗</span>
              </button>

              {/* GMGN */}
              <button
                type="button"
                className="of-option-card"
                onClick={() => openExternal(LINKS.jupiter)}
              >
                <div className="of-option-left">
                  <div className="of-option-icon" aria-hidden="true">
                    {/* Planet */}
                    <svg width="20" height="20" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                      <path d="M3 12c2-2 10-4 18-2M3 12c2 2 10 4 18 2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                    </svg>
                  </div>
                  <div>
                    <div className="of-option-title">GMGN</div>
                    <div className="of-option-sub">Best routes on Solana</div>
                  </div>
                </div>
                <span className="of-option-cta">Open ↗</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
