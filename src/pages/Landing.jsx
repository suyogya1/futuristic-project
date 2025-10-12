import React from "react";
import MagicBento from "../components/magicBento";
import "../Landing.css";

export default function Landing() {
  return (
    <main>
      <section className="hero section">
        <div className="container">
          <div className="hero-logo-wrap">
            <img
              src="/1fa-logo.png"
              alt="One For All Logo"
              className="hero-logo"
            />
          </div>
          <h1 className="gradient-text" style={{ fontSize: "clamp(2.5rem, 8vw, 5rem)", marginBottom: "1rem" }}>
            One For All
          </h1>
          <p style={{ fontSize: "1.25rem", color: "var(--muted)", maxWidth: "600px", margin: "0 auto 2rem" }}>
            The ultimate DeFi platform for trading, swapping, and discovering meme coins on Solana.
          </p>
        </div>
      </section>

      <MagicBento />
    </main>
  );
}
