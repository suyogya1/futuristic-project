import React from "react";
import { Link } from "react-router-dom";
import Reveal from "../components/Reveal";
import "../Landing.css";

export default function Landing() {
  return (
    <main>
      {/* Hero Section */}
      <section className="section hero">
        <div className="container">
          <div className="hero-inner">
            <img
              src="/1fa-logo.png"
              alt="One For All"
              className="hero-logo"
            />
            <h1 className="section-title gradient-text">
              Trade Meme Coins with Confidence
            </h1>
            <p className="section-sub">
              The ultimate platform for discovering, trading, and tracking meme coins on Solana.
              Lightning-fast swaps, real-time data, and a community-driven experience.
            </p>
            <Link to="/buy-sell" className="cta-btn large">
              Launch App →
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section alt">
        <div className="container">
          <Reveal>
            <h2 className="section-title" style={{ textAlign: "center", marginBottom: "32px" }}>
              Why Choose One For All?
            </h2>
          </Reveal>

          <div className="grid-3">
            <Reveal delay={100}>
              <div className="card">
                <h3 className="card-title">⚡ Lightning Fast</h3>
                <p className="card-body">
                  Execute trades in milliseconds with our optimized swap engine.
                  No delays, no missed opportunities.
                </p>
              </div>
            </Reveal>

            <Reveal delay={200}>
              <div className="card">
                <h3 className="card-title">📊 Real-Time Data</h3>
                <p className="card-body">
                  Live price feeds, volume tracking, and market analytics.
                  Stay ahead with instant updates.
                </p>
              </div>
            </Reveal>

            <Reveal delay={300}>
              <div className="card">
                <h3 className="card-title">🔒 Secure & Safe</h3>
                <p className="card-body">
                  Non-custodial swaps through Jupiter. Your keys, your coins.
                  Always in control.
                </p>
              </div>
            </Reveal>

            <Reveal delay={100}>
              <div className="card">
                <h3 className="card-title">🎯 Trending Tokens</h3>
                <p className="card-body">
                  Discover the hottest meme coins before they moon.
                  Live feeds from Pump.fun and DEX Screener.
                </p>
              </div>
            </Reveal>

            <Reveal delay={200}>
              <div className="card">
                <h3 className="card-title">💎 Community Driven</h3>
                <p className="card-body">
                  Join battles, share memes, and compete with other traders.
                  Built by the community, for the community.
                </p>
              </div>
            </Reveal>

            <Reveal delay={300}>
              <div className="card">
                <h3 className="card-title">🚀 Low Fees</h3>
                <p className="card-body">
                  Minimal transaction costs powered by Solana.
                  More gains, less gas.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="section">
        <div className="container">
          <Reveal>
            <h2 className="section-title" style={{ textAlign: "center", marginBottom: "32px" }}>
              How It Works
            </h2>
          </Reveal>

          <div className="grid-2">
            <Reveal delay={100}>
              <div className="step">
                <div className="step-num">Step 1</div>
                <h3 className="step-title">Connect Your Wallet</h3>
                <p className="step-body">
                  Connect your Phantom or Solflare wallet to get started.
                  Quick, secure, and seamless.
                </p>
              </div>
            </Reveal>

            <Reveal delay={200}>
              <div className="step">
                <div className="step-num">Step 2</div>
                <h3 className="step-title">Discover Tokens</h3>
                <p className="step-body">
                  Browse trending coins, check live stats, or search by token address.
                  Find your next gem.
                </p>
              </div>
            </Reveal>

            <Reveal delay={300}>
              <div className="step">
                <div className="step-num">Step 3</div>
                <h3 className="step-title">Execute Trades</h3>
                <p className="step-body">
                  Swap with confidence using Jupiter's best-in-class routing.
                  Set slippage and confirm.
                </p>
              </div>
            </Reveal>

            <Reveal delay={400}>
              <div className="step">
                <div className="step-num">Step 4</div>
                <h3 className="step-title">Track & Earn</h3>
                <p className="step-body">
                  Monitor your portfolio, join meme battles, and earn rewards.
                  Stay engaged, stay winning.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Features Breakdown */}
      <section className="section alt">
        <div className="container">
          <div className="grid-2">
            <Reveal>
              <div className="card">
                <h3 className="card-title">🔥 Meme Battle Arena</h3>
                <p className="card-body">
                  Upload your best memes and compete for glory. Vote, react, and engage with the community.
                </p>
                <ul className="bullets">
                  <li>Upload and share memes</li>
                  <li>Vote on community submissions</li>
                  <li>Track leaderboards and stats</li>
                  <li>Earn rewards for top memes</li>
                </ul>
                <Link to="/meme-battle" className="cta-btn" style={{ marginTop: "12px" }}>
                  Enter Arena →
                </Link>
              </div>
            </Reveal>

            <Reveal delay={200}>
              <div className="card">
                <h3 className="card-title">📱 Send Messages</h3>
                <p className="card-body">
                  Stay connected with the community. Share alpha, discuss trends, and coordinate plays.
                </p>
                <ul className="bullets">
                  <li>Direct messaging system</li>
                  <li>Group chats and channels</li>
                  <li>Share trades and portfolios</li>
                  <li>Real-time notifications</li>
                </ul>
                <Link to="/send-message" className="cta-btn" style={{ marginTop: "12px" }}>
                  Start Chatting →
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section cta">
        <div className="container">
          <Reveal>
            <h2 className="cta-title">Ready to Start Trading?</h2>
            <p className="section-sub">
              Join thousands of traders already making moves on One For All.
            </p>
            <Link to="/buy-sell" className="cta-btn large">
              Launch App Now →
            </Link>
          </Reveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="brand">
            <img src="/1fa-logo.png" alt="1FA" className="brand-logo" />
            <span className="brand-name">One For All</span>
          </div>
          <div className="socials">
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
              </svg>
            </a>
            <a href="https://discord.com" target="_blank" rel="noopener noreferrer" aria-label="Discord">
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
            </a>
            <a href="https://telegram.org" target="_blank" rel="noopener noreferrer" aria-label="Telegram">
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
