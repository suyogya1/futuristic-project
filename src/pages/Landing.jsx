import React from "react";
import Reveal from "../components/reveal";

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

      {/* ===== New content (scroll-in with varied angles & delays) ===== */}

      {/* What is 1FA (alternating angles) */}
      <section className="section">
        <div className="container" style={{ display: "grid", gap: 12 }}>
          <Reveal as="h2" className="section-title" y={-18}>
            What is <span className="gradient-text">1FA</span>?
          </Reveal>
          <Reveal y={22} delay={60}>
            <p className="section-sub" style={{ maxWidth: 860 }}>
              A meme coin with real polish. We keep it simple: ship useful UI, stay transparent, and let the community have fun.
            </p>
          </Reveal>

          <div style={{ display: "grid", gap: 12 }}>
            <Reveal as="div" className="panel" y={26}>
              <h3 style={{ margin: "0 0 6px" }}>Why it exists</h3>
              <p className="hint" style={{ margin: 0 }}>
                Memes move culture, but tools create staying power. 1FA mixes both — fast swaps, friendly UX, and rewards.
              </p>
            </Reveal>

            <Reveal as="div" className="panel" y={-28} delay={80}>
              <h3 style={{ margin: "0 0 6px" }}>Built for speed</h3>
              <p className="hint" style={{ margin: 0 }}>
                Solana settles in seconds with near-zero fees, perfect for active trading and playful experimentation.
              </p>
            </Reveal>

            <Reveal as="div" className="panel" y={30} delay={140}>
              <h3 style={{ margin: "0 0 6px" }}>Community-first</h3>
              <p className="hint" style={{ margin: 0 }}>
                We ship publicly and iterate with holders. No mystery boxes — only features you can touch.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Token quick facts (staggered) */}
      <section className="section alt">
        <div className="container">
          <Reveal as="h2" className="section-title" y={-18}>
            Token quick facts
          </Reveal>
          <div
            className="grid3"
            style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", marginTop: 10 }}
          >
            <Reveal as="div" className="panel" y={28}>
              <div className="row between">
                <div className="label">Supply</div>
                <div className="badge">placeholder</div>
              </div>
              <div className="divider" />
              <p className="hint" style={{ margin: 0 }}>1,000,000,000 1FA</p>
            </Reveal>

            <Reveal as="div" className="panel" y={-28} delay={80}>
              <div className="row between">
                <div className="label">Fees</div>
                <div className="badge">v1</div>
              </div>
              <div className="divider" />
              <p className="hint" style={{ margin: 0 }}>0% buy / sell (placeholder)</p>
            </Reveal>

            <Reveal as="div" className="panel" y={30} delay={140}>
              <div className="row between">
                <div className="label">LP</div>
                <div className="badge">locked</div>
              </div>
              <div className="divider" />
              <p className="hint" style={{ margin: 0 }}>Details will be published openly.</p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* How to buy (angled steps) */}
      <section className="section">
        <div className="container">
          <Reveal as="h2" className="section-title" y={-18}>
            How to buy in 3 steps
          </Reveal>
          <div
            className="grid3"
            style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", marginTop: 10 }}
          >
            <Reveal as="div" className="panel" y={24}>
              <div className="badge" style={{ marginBottom: 6 }}>Step 1</div>
              <h3 style={{ margin: 0 }}>Install Phantom</h3>
              <p className="hint" style={{ margin: 0 }}>
                Create a wallet and safely back up your seed phrase.
              </p>
            </Reveal>

            <Reveal as="div" className="panel" y={-26} delay={80}>
              <div className="badge" style={{ marginBottom: 6 }}>Step 2</div>
              <h3 style={{ margin: 0 }}>Fund with SOL</h3>
              <p className="hint" style={{ margin: 0 }}>
                Buy SOL on an exchange or on-ramp, then send to Phantom.
              </p>
            </Reveal>

            <Reveal as="div" className="panel" y={28} delay={140}>
              <div className="badge" style={{ marginBottom: 6 }}>Step 3</div>
              <h3 style={{ margin: 0 }}>Open App</h3>
              <p className="hint" style={{ margin: 0 }}>
                Use the dedicated page to connect Phantom and trade 1FA.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* FAQ (accordion-like blocks, alternating angles) */}
      <section className="section alt">
        <div className="container" style={{ display: "grid", gap: 12 }}>
          <Reveal as="h2" className="section-title" y={-20}>
            FAQ
          </Reveal>

          <Reveal as="div" className="panel" y={22}>
            <div className="row between">
              <strong>Is this financial advice?</strong>
              <div className="badge">Nope</div>
            </div>
            <div className="divider" />
            <p className="hint" style={{ margin: 0 }}>
              Crypto is risky. Do your own research and never invest more than you can afford to lose.
            </p>
          </Reveal>

          <Reveal as="div" className="panel" y={-24} delay={80}>
            <div className="row between">
              <strong>Which wallets are supported?</strong>
              <div className="badge">Phantom</div>
            </div>
            <div className="divider" />
            <p className="hint" style={{ margin: 0 }}>
              Phantom is supported out of the box. More wallets can be added later via the Solana Wallet Adapter.
            </p>
          </Reveal>

          <Reveal as="div" className="panel" y={26} delay={140}>
            <div className="row between">
              <strong>Are the numbers final?</strong>
              <div className="badge">Placeholder</div>
            </div>
            <div className="divider" />
            <p className="hint" style={{ margin: 0 }}>
              All tokenomics above are placeholders until finalized. We’ll publish changes clearly.
            </p>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
