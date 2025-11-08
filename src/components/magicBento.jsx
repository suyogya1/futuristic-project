import React from "react";
import { useNavigate } from "react-router-dom";
import Reveal from "./Reveal";

/** Small lock badge shown on locked tiles */
const LockBadge = () => (
  <span
    className="bento-chip"
    style={{
      position: "absolute",
      top: 12,
      right: 12,
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      pointerEvents: "none",
    }}
  >
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 10V7a4 4 0 1 1 8 0v3" stroke="currentColor" strokeWidth="1.5" />
    </svg>
    Locked
  </span>
);

/** Generic bento item — renders <button> for clickable tiles */
const Item = ({
  as: As = "div",
  className = "",
  children,
  locked = false,
  onClick,
  style,
  ...rest
}) => {
  const isInteractive = !!onClick && !locked && As === "div";
  const Comp = isInteractive ? "button" : As;

  const handleKey = (e) => {
    if (!locked && onClick && !isInteractive && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onClick(e);
    }
  };

  return (
    <Reveal y={20} className={`bento-card ${className} ${locked ? "is-locked" : ""}`}>
      <Comp
        {...rest}
        type={Comp === "button" ? "button" : undefined}
        className="bento-inner"
        style={{
          display: "block",
          height: "100%",
          position: "relative",
          background: "none",
          border: "none",
          padding: 0,
          textAlign: "left",
          cursor: locked ? "not-allowed" : onClick ? "pointer" : undefined,
          opacity: locked ? 0.6 : undefined,
          filter: locked ? "saturate(0.75) brightness(0.95)" : undefined,
          ...style,
        }}
        role={!locked && onClick && !isInteractive ? "button" : undefined}
        tabIndex={isInteractive ? undefined : 0}
        aria-disabled={locked || undefined}
        onClick={locked ? (e) => e.preventDefault() : onClick}
        onKeyDown={handleKey}
        data-targetable={!locked && !!onClick ? "true" : undefined}
      >
        {locked && <LockBadge />}
        {children}
      </Comp>
    </Reveal>
  );
};

export default function MagicBento() {
  const navigate = useNavigate();

  const go = (selector) => {
    try {
      sessionStorage.setItem("of_scroll_target", selector);
    } catch {}
    navigate("/buy-sell", { state: { scrollTarget: selector } });
  };

  return (
    <section className="section" aria-label="Highlights">
      {/* Unify typography & spacing so all tiles look even */}
      <style>{`
        :root {
          --bento-title: #e7eefb;
          --bento-sub:   #9fb0c2;
        }
        .bento-title {
          font-family: inherit;
          font-weight: 700;
          font-size: 20px;
          line-height: 1.25;
          color: var(--bento-title);
          letter-spacing: 0.2px;
          margin: 0;
        }
        .bento-sub {
          font-size: 15px;
          line-height: 1.6;
          color: var(--bento-sub);
          margin: 6px 0 0 0;
        }
        .bento-inner > .bento-icon { margin: 6px 0 10px 0; } /* same gap before titles everywhere */
      `}</style>

      <div className="container">
        <div className="bento-grid">
          {/* Market pulse — now same structure: icon → title → subtext */}
          <Item className="bento-span-2" onClick={() => go(".chart-page.unselectable.on-widget")}>
            <span className="bento-chip"></span>
            <div className="bento-icon">
              {/* candlestick/market icon */}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 20V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <rect x="3" y="7" width="2" height="6" rx="1" fill="currentColor" />
                <path d="M10 20V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <rect x="9" y="4" width="2" height="7" rx="1" fill="currentColor" />
                <path d="M16 20V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <rect x="15" y="9" width="2" height="5" rx="1" fill="currentColor" />
                <path d="M22 20V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <rect x="21" y="6" width="2" height="6" rx="1" fill="currentColor" transform="translate(-1 0)" />
              </svg>
            </div>
            <h3 className="bento-title">Market pulse</h3>
            <p className="bento-sub">Track price action and volume in real time.</p>

            <div className="bento-sparkline" aria-hidden="true">
              {Array.from({ length: 34 }).map((_, i) => (
                <div key={i} style={{ height: `${28 + ((i * 13) % 48)}%` }} />
              ))}
            </div>
          </Item>

          {/* Connect wallet */}
          <Item className="bento-accent" onClick={() => go(".wallet-card")}>
            <div className="bento-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M3 7a2 2 0 0 1 2-2h11a3 3 0 0 1 3 3v1h-5a3 3 0 1 0 0 6h5v1a3 3 0 0 1-3 3H5a2 2 0 0 1-2-2V7Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <circle cx="16.5" cy="12" r="1.5" fill="currentColor" />
              </svg>
            </div>
            <h3 className="bento-title">Connect wallet</h3>
            <p className="bento-sub">One click Phantom connect.</p>
          </Item>

          {/* Buy / Sell */}
          <Item onClick={() => go("launch-button")}>
            <div className="bento-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 7h16M4 12h10M4 17h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <h3 className="bento-title">Buy / Sell</h3>
            <p className="bento-sub">Swap SOL ↔ 1FA with a clean UI.</p>
          </Item>

          {/* Rewards — LOCKED */}
          <Item locked>
            <div className="bento-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 3l2.4 4.9L20 9l-4 3.9.9 5.6L12 16.9 7.1 18.5 8 13 4 9l5.6-1.1L12 3z" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </div>
            <h3 className="bento-title">Rewards</h3>
            <p className="bento-sub">Share your code. Earn perks.</p>
          </Item>

          {/* Axiom — LOCKED */}
          <Item className="bento-glass" locked>
            <div className="bento-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="2" fill="currentColor" />
                <ellipse cx="12" cy="12" rx="8" ry="4.5" stroke="currentColor" strokeWidth="1.5" />
                <ellipse cx="12" cy="12" rx="4.5" ry="8" transform="rotate(60 12 12)" stroke="currentColor" strokeWidth="1.5" />
                <ellipse cx="12" cy="12" rx="4.5" ry="8" transform="rotate(-60 12 12)" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </div>
            <h3 className="bento-title">Allverse</h3>
            <p className="bento-sub">Core protocol &amp; docs (coming soon).</p>
          </Item>

          {/* Community */}
          <Item as="a" href="https://x.com/oneforall246396" target="_blank" rel="noopener noreferrer">
            <div className="bento-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 8c2 6 7 10 12 12M20 4c-3 4-6 7-9 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <h3 className="bento-title">Community</h3>
            <p className="bento-sub">Join us on X &amp; Discord.</p>
          </Item>
        </div>
      </div>
    </section>
  );
}
