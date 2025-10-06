// src/pages/axiom.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";

/* ---------- tiny error boundary so the page never renders blank ---------- */
class ErrorBoundary extends React.Component {
  constructor(props){ super(props); this.state = { err: null }; }
  static getDerivedStateFromError(err){ return { err }; }
  componentDidCatch(err, info){ console.error("[Axiom page crash]", err, info); }
  render(){
    if (!this.state.err) return this.props.children;
    return (
      <main className="container" style={{ paddingTop: 24 }}>
        <section className="panel" role="alert">
          <h3 style={{ marginTop: 0 }}>Something went wrong</h3>
          <p className="hint">The UI failed to render. Check the console for details.</p>
          <pre className="code-json" style={{ whiteSpace: "pre-wrap" }}>
            {String(this.state.err?.message || this.state.err)}
          </pre>
        </section>
      </main>
    );
  }
}

/* ---------- shared small hooks/helpers ---------- */
function useOutsideClose(ref, onClose) {
  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose?.(); };
    document.addEventListener("pointerdown", onDoc);
    return () => document.removeEventListener("pointerdown", onDoc);
  }, [ref, onClose]);
}

function PlaceholderRows({ rows = 9 }) {
  return (
    <div className="tbody">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="tr">
          <div className="td col-info">
            <div className="pair">
              <div className="avatar skel" />
              <div className="meta">
                <div className="skel skel-line w-60" />
                <div className="skel skel-line w-40" style={{ marginTop: 6 }} />
              </div>
            </div>
          </div>
          <div className="td"><div className="skel skel-pill w-40" /></div>
          <div className="td"><div className="skel skel-pill w-40" /></div>
          <div className="td col-chart"><div className="skel skel-chart" /></div>
          <div className="td"><div className="skel skel-pill w-32" /></div>
          <div className="td"><div className="skel skel-pill w-24" /></div>
          <div className="td col-token">
            <div className="mini-wrap">
              <span className="skel skel-chip" />
              <span className="skel skel-chip" />
              <span className="skel skel-chip" />
            </div>
          </div>
          <div className="td col-action"><div className="skel skel-btn" /></div>
        </div>
      ))}
    </div>
  );
}

/* ---------- Pump Live (Pump.fun portal) ---------- */
function PumpLivePanel() {
  // Prefer Vite env, then window override, then defaults
  const WS_URL =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_PUMP_WS) ||
    (typeof window !== "undefined" && window.__PUMP_WS__) ||
    "wss://pumpportal.fun/api/data";

  const [status, setStatus] = useState("disconnected"); // connecting | connected | disconnected | error
  const [paused, setPaused] = useState(false);
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState("");
  const [limit, setLimit] = useState(50);
  const wsRef = useRef(null);

  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return events;
    return events.filter((e) => {
      const hay = `${e.symbol ?? ""} ${e.name ?? ""} ${e.ca ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [events, filter]);

  useEffect(() => {
    let closed = false;
    let ws;

    const subscribePayloads = [
      { method: "subscribe", channel: "mints" },
      { method: "subscribe", channel: "trades" },
    ];

    function connect() {
      try {
        setStatus("connecting");
        ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.addEventListener("open", () => {
          setStatus("connected");
          subscribePayloads.forEach((p) => ws.send(JSON.stringify(p)));
        });

        ws.addEventListener("message", (msg) => {
          if (paused) return;
          try {
            // Some gateways send pings as plain strings; ignore them gracefully.
            const text = typeof msg.data === "string" ? msg.data : "";
            if (!text) return;
            const data = JSON.parse(text);

            const now = Date.now();
            const push = (ev) =>
              setEvents((prev) => [ev, ...prev].slice(0, Number(limit) || 50));

            if (data.channel === "mints" || data.type === "mint" || data.event === "mint") {
              push({
                type: "MINT",
                ts: data.ts || now,
                symbol: data.symbol || data.ticker || data.tokenSymbol || "NEW",
                name: data.name || data.tokenName || data.project || "New token",
                ca: data.mint || data.address || data.ca,
                priceUsd: data.priceUsd ?? null,
                marketCap: data.marketCap ?? null,
              });
            } else if (data.channel === "trades" || data.type === "trade" || data.event === "trade") {
              const side = (data.side || data.direction || "").toUpperCase();
              push({
                type: side || "TRADE",
                ts: data.ts || now,
                symbol: data.symbol || data.ticker || data.tokenSymbol || "—",
                name: data.name || data.tokenName || "—",
                ca: data.mint || data.address || data.ca,
                priceUsd: data.priceUsd ?? data.price ?? null,
                marketCap: data.marketCap ?? null,
                amount: data.amount ?? data.size ?? null,
              });
            }
          } catch (err) {
            // Non-JSON or noisy frames are common; keep silent but visible in dev
            if (import.meta?.env?.DEV) console.debug("[socket frame ignored]", err);
          }
        });

        ws.addEventListener("error", (e) => {
          console.error("[Pump WS error]", e);
          setStatus("error");
        });

        ws.addEventListener("close", () => {
          setStatus("disconnected");
          if (!closed) setTimeout(connect, 1200);
        });
      } catch (err) {
        console.error("[Pump WS failed to init]", err);
        setStatus("error");
      }
    }

    connect();
    return () => { closed = true; try { ws?.close(); } catch {} };
  }, [WS_URL, paused, limit]);

  return (
    <section className="panel pump-live">
      <div className="pump-toolbar">
        <div className={`conn ${status}`}>● {status}</div>

        <div className="row" style={{ gap: 8 }}>
          <label className="search small">
            <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
              <path d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
                    fill="none" stroke="currentColor" strokeWidth="1.6" />
            </svg>
            <input
              aria-label="Filter"
              placeholder="Filter symbol / name / CA"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </label>

          {/* Styled native select (CSS targets .select.theme-dark) */}
          <span className="select theme-dark" title="Max items">
            <select value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
              {[50, 100, 150, 250].map((n) => (
                <option key={n} value={n}>{n} items</option>
              ))}
            </select>
            <span className="caret">▾</span>
          </span>

          <button className="btn" onClick={() => setPaused((v) => !v)}>
            {paused ? "Resume" : "Pause"}
          </button>
          <button className="btn" onClick={() => setEvents([])}>Clear</button>
        </div>
      </div>

      <div className="pump-list">
        {!visible.length ? (
          <div className="pump-empty">
            <div className="ce-icon" aria-hidden>⌘</div>
            <div className="ce-text">
              <strong>No live events yet</strong>{" "}
              <span className="hint">
                {status === "error"
                  ? "Socket blocked or failed. Check Brave Shields / network."
                  : "Waiting for socket frames…"}
              </span>
            </div>
          </div>
        ) : (
          visible.map((e, i) => (
            <div key={i} className="pump-item">
              <div className="pi-type">
                <span className={`pill ${
                  e.type === "MINT" ? "mint" :
                  e.type === "BUY"  ? "buy"  :
                  e.type === "SELL" ? "sell" : "trade"
                }`}>{e.type || "EVENT"}</span>
              </div>

              <div className="pi-main">
                <div className="title">
                  <span className="sym mono">{e.symbol}</span>
                  <span className="name">{e.name}</span>
                </div>
                <div className="sub mono">{e.ca || "—"}</div>
              </div>

              <div className="pi-metrics">
                <div className="m"><div className="k">Price</div>
                  <div className="v">{e.priceUsd ? `$${Number(e.priceUsd).toLocaleString()}` : "—"}</div>
                </div>
                <div className="m"><div className="k">MCap</div>
                  <div className="v">{e.marketCap ? `$${Number(e.marketCap).toLocaleString()}` : "—"}</div>
                </div>
                <div className="m"><div className="k">Amt</div><div className="v">{e.amount ?? "—"}</div></div>
                <div className="time hint">{new Date(e.ts || Date.now()).toLocaleTimeString()}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

/* ---------- Page shell (Trending layout + Pump Live tab) ---------- */
const TABS = ["Trending", "Surge", "DEX Screener", "Pump Live"];
const WINDOWS = ["1m", "5m", "30m", "1h"];

function DiscoverTrending() {
  const [tab, setTab] = useState(TABS[0]);
  const [win, setWin] = useState(WINDOWS[1]);
  const [q, setQ]   = useState("");
  const [quick, setQuick] = useState(false);
  const [open, setOpen] = useState(false);
  const ddRef = useRef(null);
  useOutsideClose(ddRef, () => setOpen(false));

  return (
    <main className="discover">
      <div className="container">
        {/* Tabs & actions */}
        <header className="disc-head panel">
          <nav className="disc-tabs" role="tablist" aria-label="Discover tabs">
            {TABS.map((t) => (
              <button
                key={t}
                className={`disc-tab ${tab === t ? "active" : ""}`}
                onClick={() => setTab(t)}
                role="tab"
                aria-selected={tab === t}
              >
                {t}
              </button>
            ))}
          </nav>

          <div className="disc-actions">
            <label className="search" aria-label="Search">
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
                <path d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
                      fill="none" stroke="currentColor" strokeWidth="1.6" />
              </svg>
              <input
                placeholder="Search by token or CA"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </label>

            <button
              className={`btn chip-toggle ${quick ? "on" : ""}`}
              onClick={() => setQuick((v) => !v)}
              title="Quick Buy toggles per-row action mode"
            >
              Quick Buy {quick ? "On" : "Off"}
            </button>
          </div>
        </header>

        {/* Toolbar */}
        <div className="disc-toolbar">
          <div className="chip-set" role="tablist" aria-label="Window">
            {WINDOWS.map((w) => (
              <button
                key={w}
                className={`chip ${win === w ? "active" : ""}`}
                onClick={() => setWin(w)}
                role="tab"
                aria-selected={win === w}
              >
                {w}
              </button>
            ))}
          </div>

          <div className="filters" ref={ddRef}>
            <button className="btn filter-btn" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
              Filter <span className="caret">▾</span>
            </button>
            {open && (
              <div className="menu">
                <button className="menu-item">Market Cap &gt; $10K</button>
                <button className="menu-item">Volume &gt; $25K</button>
                <button className="menu-item">New &lt; 24h</button>
                <button className="menu-item">Only green</button>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        {tab !== "Pump Live" ? (
          <>
            <section className="disc-table panel">
              <div className="thead">
                <div className="th col-info">Pair Info</div>
                <div className="th">Market Cap</div>
                <div className="th">Liquidity</div>
                <div className="th col-chart">Pulse</div>
                <div className="th">Volume</div>
                <div className="th">TXNS</div>
                <div className="th col-token">Token Info</div>
                <div className="th col-action">Action</div>
              </div>
              <PlaceholderRows rows={9} />
            </section>

            <p className="hint" style={{ marginTop: 10 }}>
              Viewing <strong>{tab}</strong> • timeframe <strong>{win}</strong>. Rows are placeholders—wire your feed when ready.
            </p>
          </>
        ) : (
          <PumpLivePanel />
        )}
      </div>
    </main>
  );
}

/* ---------- export both ways so routes don’t break ---------- */
function AxiomLike() {
  return (
    <ErrorBoundary>
      <DiscoverTrending />
    </ErrorBoundary>
  );
}

export default AxiomLike;
export { AxiomLike, DiscoverTrending };
