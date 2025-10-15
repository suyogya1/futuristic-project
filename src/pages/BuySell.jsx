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
            <button
              onClick={handleRedirect}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                fontSize: '20px',
                fontWeight: '600',
                padding: '20px 60px',
                border: 'none',
                borderRadius: '16px',
                cursor: 'pointer',
                boxShadow: '0 10px 40px rgba(102, 126, 234, 0.4)',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 15px 50px rgba(102, 126, 234, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 40px rgba(102, 126, 234, 0.4)';
              }}
            >
              Launch Trading Platform
            </button>
          </div>
        </div>

      </section>
    </main>
  );
}
