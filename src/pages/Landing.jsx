import React from "react";
import Reveal from "../components/Reveal";

export default function Landing() {
  return (
    <main>
      {/* Hero */}
      <section className="section hero" style={{ paddingTop: 56, paddingBottom: 64 }}>
        <div className="container">
          <Reveal as="div" className="hero-logo-wrap" y={22}>
            <img className="hero-logo" src="/1fa-logo.png" alt="One For All logo" />
          </Reveal>

          <Reveal as="h1" className="section-title" style={{ fontSize: 48, marginBottom: 12 }}>
            Welcome to <span className="gradient-text">One For All</span>
          </Reveal>

          <Reveal delay={80}>
            <p className="section-sub" style={{ maxWidth: 720 }}>
              The playful token with serious vibes. Explore the ecosystem and trade in a dedicated page.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Highlights (gives us content to scroll into view) */}
      <section className="section">
        <div className="container">
          <div className="grid3" style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))" }}>
            <Reveal as="div" className="panel" y={20}>
              <h3 style={{ marginTop: 0 }}>Fast & Low Cost</h3>
              <p className="hint">Solana finality in seconds and fees that round to zero.</p>
            </Reveal>
            <Reveal as="div" className="panel" y={20} delay={80}>
              <h3 style={{ marginTop: 0 }}>Composability</h3>
              <p className="hint">Works with leading DEXs, aggregators, and wallets.</p>
            </Reveal>
            <Reveal as="div" className="panel" y={20} delay={160}>
              <h3 style={{ marginTop: 0 }}>Community First</h3>
              <p className="hint">Transparent updates and incentives for long-term holders.</p>
            </Reveal>
          </div>
        </div>
      </section>
    </main>
  );
}
