import React from "react";
import { Link } from "react-router-dom";
import Reveal from "./Reveal";

/** Generic clickable bento item
 * - Uses <Link> when `to` is provided
 * - Uses custom element (default "div") when `as` is provided (e.g. "a")
 * - Forwards ALL remaining props (href, target, rel, onClick, etc.)
 */
const Item = ({
  as: As = "div",
  className = "",
  children,
  to,
  style,
  ...rest
}) => {
  const Comp = to ? Link : As;
  const compProps = to ? { to } : { ...rest };

  return (
    <Reveal y={20} className={`bento-card ${className}`}>
      <Comp
        {...compProps}
        className="bento-inner"
        style={{ display: "block", height: "100%", ...style }}
        tabIndex={0}
      >
        {children}
      </Comp>
    </Reveal>
  );
};

export default function MagicBento() {
  return (
    <section className="section" aria-label="Highlights">
      <div className="container">
        <div className="bento-grid">
          {/* Big live chart tile — now navigates to /buy-sell */}
          <Item className="bento-span-2" to="/buy-sell">
            <div className="bento-head">
              <span className="bento-chip">Live</span>
              <h3>Market pulse</h3>
            </div>
            <p className="bento-sub">Track price action and volume in real time.</p>
            <div className="bento-sparkline" aria-hidden="true">
              {Array.from({ length: 34 }).map((_, i) => (
                <div key={i} style={{ height: `${28 + ((i * 13) % 48)}%` }} />
              ))}
            </div>
          </Item>

          {/* Connect wallet */}
          <Item className="bento-accent" to="/buy-sell">
            <div className="bento-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M3 7a2 2 0 0 1 2-2h11a3 3 0 0 1 3 3v1h-5a3 3 0 1 0 0 6h5v1a3 3 0 0 1-3 3H5a2 2 0 0 1-2-2V7Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <circle cx="16.5" cy="12" r="1.5" fill="currentColor" />
              </svg>
            </div>
            <h3>Connect wallet</h3>
            <p className="bento-sub">One click Phantom connect.</p>
          </Item>

          {/* Buy / Sell */}
          <Item to="/buy-sell">
            <div className="bento-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 7h16M4 12h10M4 17h7"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <h3>Buy / Sell</h3>
            <p className="bento-sub">Swap SOL ↔ 1FA with a clean UI.</p>
          </Item>

          {/* Rewards */}
          <Item to="/rewards">
            <div className="bento-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 3l2.4 4.9L20 9l-4 3.9.9 5.6L12 16.9 7.1 18.5 8 13 4 9l5.6-1.1L12 3z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
            </div>
            <h3>Rewards</h3>
            <p className="bento-sub">Share your code. Earn perks.</p>
          </Item>

          {/* Docs / Litepaper */}
          <Item
            as="a"
            href="https://example.com/litepaper"
            target="_blank"
            rel="noreferrer"
            className="bento-glass"
          >
            <div className="bento-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M7 4h7l4 4v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path d="M14 4v4h4" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </div>
            <h3>Docs</h3>
            <p className="bento-sub">Catch up on the basics.</p>
          </Item>

          {/* Community */}
          <Item as="a" href="https://x.com/oneforall" target="_blank" rel="noreferrer">
            <div className="bento-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 8c2 6 7 10 12 12M20 4c-3 4-6 7-9 10"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <h3>Community</h3>
            <p className="bento-sub">Join us on X & Discord.</p>
          </Item>
        </div>
      </div>
    </section>
  );
}
