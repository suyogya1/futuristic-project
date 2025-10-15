// src/pages/BuySell.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import DexScreenerChart from "../components/DexScreenerChart.jsx";

export default function BuySell() {
  const navigate = useNavigate();
  const pairPath = "ethereum/0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc";

  const handleRedirect = () => {
    navigate("/axiom");
  };

  return (
    <main>
      <section className="section" style={{ paddingTop: 32 }}>
        <div className="container">
          <h1 className="section-title" style={{ marginBottom: 8 }}>
            Buy / Sell 1FA
          </h1>
          <p className="section-sub" style={{ marginBottom: 20 }}>
            View the live market and explore our platform
          </p>

          {/* Live chart */}
          <div style={{ marginTop: 8 }}>
            <h3 className="section-title" style={{ fontSize: 18, marginBottom: 8 }}>
              Live Chart
            </h3>
            <DexScreenerChart pairPath={pairPath} theme="dark" height={560} />
          </div>

          {/* Attractive redirect button */}
          <div style={{
            marginTop: 48,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '40px 0'
          }}>
            <style>{`
              @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&display=swap');

              @keyframes pulse-glow {
                0%, 100% {
                  box-shadow: 0 0 20px rgba(102, 126, 234, 0.4),
                              0 0 40px rgba(102, 126, 234, 0.2),
                              0 10px 40px rgba(102, 126, 234, 0.4);
                }
                50% {
                  box-shadow: 0 0 30px rgba(102, 126, 234, 0.6),
                              0 0 60px rgba(102, 126, 234, 0.4),
                              0 10px 50px rgba(102, 126, 234, 0.6);
                }
              }

              @keyframes gradient-shift {
                0% {
                  background-position: 0% 50%;
                }
                50% {
                  background-position: 100% 50%;
                }
                100% {
                  background-position: 0% 50%;
                }
              }

              @keyframes float {
                0%, 100% {
                  transform: translateY(0px);
                }
                50% {
                  transform: translateY(-8px);
                }
              }

              .launch-button {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
                background-size: 200% 200%;
                color: white;
                font-family: 'Space Grotesk', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                fontSize: 22px;
                fontWeight: 700;
                padding: 24px 70px;
                border: none;
                border-radius: 20px;
                cursor: pointer;
                position: relative;
                overflow: hidden;
                textTransform: uppercase;
                letterSpacing: 2px;
                animation: pulse-glow 3s ease-in-out infinite, float 4s ease-in-out infinite;
                transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
              }

              .launch-button::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
                transition: left 0.6s;
              }

              .launch-button:hover::before {
                left: 100%;
              }

              .launch-button:hover {
                transform: translateY(-6px) scale(1.05);
                animation: gradient-shift 2s ease infinite, pulse-glow 1.5s ease-in-out infinite;
              }

              .launch-button:active {
                transform: translateY(-2px) scale(1.02);
              }
            `}</style>
            <button
              onClick={handleRedirect}
              className="launch-button"
            >
              Launch Trading Platform
            </button>
          </div>
        </div>

      </section>
    </main>
  );
}
