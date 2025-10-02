import React, { useEffect, useRef, useState } from "react";

const FAQS = [
  {
    q: "What is One For All (1FA)?",
    a: "1FA is a playful-yet-serious Solana token focused on speed, composability, and community-driven features.",
  },
  {
    q: "How do I buy or sell the token?",
    a: "Use the Buy / Sell Coin link in the navbar. It opens a dedicated page with wallet connect and a live chart. (Swaps are mocked until you wire the logic.)",
  },
  {
    q: "How do referrals work?",
    a: "Each wallet gets a deterministic referral code on the Rewards page. Share your code; friends can apply it once. The current demo stores data locally until you connect a backend/on-chain program.",
  },
  {
    q: "Which wallets are supported?",
    a: "Phantom is supported out of the box via the Solana Wallet Adapter. You can add more adapters later.",
  },
];

export default function FloatingAssistant() {
  const [open, setOpen] = useState(false);
  const [clickedPulse, setClickedPulse] = useState(false);
  const [expanded, setExpanded] = useState(0);
  const [hoveringPanel, setHoveringPanel] = useState(false);

  const fabRef = useRef(null);
  const panelRef = useRef(null);

  // body style backups + nested-lock counter
  const prevOverflowRef = useRef("");
  const prevPaddingRightRef = useRef("");
  const lockCountRef = useRef(0);

  // ---- helpers: scrollbar compensation ----
  function getScrollbarWidth() {
    if (typeof window === "undefined") return 0;
    return window.innerWidth - document.documentElement.clientWidth;
  }
  function lockPageScroll() {
    const body = document.body;
    lockCountRef.current += 1;
    if (lockCountRef.current > 1) return; // already locked

    prevOverflowRef.current = body.style.overflow;
    prevPaddingRightRef.current = body.style.paddingRight;

    const sbw = getScrollbarWidth();
    if (sbw > 0) {
      const currentPR = parseFloat(getComputedStyle(body).paddingRight || "0") || 0;
      body.style.paddingRight = `${currentPR + sbw}px`;
    }
    body.style.overflow = "hidden";
  }
  function unlockPageScroll() {
    const body = document.body;
    if (lockCountRef.current > 0) lockCountRef.current -= 1;
    if (lockCountRef.current > 0) return; // still locked by another enter

    body.style.overflow = prevOverflowRef.current || "";
    body.style.paddingRight = prevPaddingRightRef.current || "";
  }

  // restore open state in this tab
  useEffect(() => {
    const saved = sessionStorage.getItem("1fa-ai:open");
    if (saved === "1") setOpen(true);
  }, []);
  useEffect(() => {
    sessionStorage.setItem("1fa-ai:open", open ? "1" : "0");
  }, [open]);

  // close on Esc
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // return focus to FAB
  useEffect(() => {
    if (!open && fabRef.current) fabRef.current.focus();
  }, [open]);

  // keyboard scroll guard (only while hovering the panel)
  useEffect(() => {
    if (!open) return;

    const keyScrollKeys = new Set([
      " ", "Spacebar", "PageUp", "PageDown", "ArrowUp", "ArrowDown", "Home", "End",
    ]);
    const onKeydown = (e) => {
      if (!hoveringPanel) return;
      const el = document.activeElement;
      const isTextField =
        el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
      if (!isTextField && keyScrollKeys.has(e.key)) e.preventDefault();
    };

    if (hoveringPanel) {
      lockPageScroll();
      window.addEventListener("keydown", onKeydown, { passive: false });
    } else {
      unlockPageScroll();
      window.removeEventListener("keydown", onKeydown);
    }

    return () => {
      unlockPageScroll();
      window.removeEventListener("keydown", onKeydown);
    };
  }, [open, hoveringPanel]);

  // ensure unlock when panel closes
  useEffect(() => {
    if (!open) unlockPageScroll();
  }, [open]);

  // (optional) simple focus trap for accessibility
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;
    const focusable = panel.querySelectorAll(
      'button, a[href], input, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const trap = (e) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first?.focus();
      }
    };
    panel.addEventListener("keydown", trap);
    first?.focus();
    return () => panel.removeEventListener("keydown", trap);
  }, [open]);

  // theme fallbacks
  const grad = "linear-gradient(135deg, #6c7cff, #7ee7ff)";
  const ring = "rgba(124,139,255,0.45)";

  return (
    <>
      {/* Floating Action Button */}
      <button
        ref={fabRef}
        aria-label={open ? "Close 1FA AI" : "Open 1FA AI"}
        onClick={() => {
          setOpen((v) => !v);
          setClickedPulse(true);
          setTimeout(() => setClickedPulse(false), 220);
        }}
        className="fab-1fa"
        style={{
          position: "fixed",
          right: 20,
          bottom: 20,
          zIndex: 2147483200,
          width: 56,
          height: 56,
          borderRadius: "999px",
          border: "1px solid transparent",
          background: grad,
          color: "#0a0f24",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 12px 32px rgba(108,124,255,.35), 0 0 0 6px ${ring}`,
          cursor: "pointer",
          transition: "transform .1s ease, box-shadow .2s ease",
          animation: clickedPulse ? "fab-pop .22s ease-out" : "none",
        }}
      >
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path
            d="M12 2l2.2 4.6 5.1.7-3.7 3.6.9 5.1L12 14.9 7.5 16l.9-5.1L4.7 7.3l5.1-.7L12 2z"
            fill="currentColor"
          />
        </svg>
      </button>

      {/* Overlay + Panel */}
      {open && (
        <>
          <div
            className="ai-overlay"
            onClick={() => setOpen(false)}
            aria-hidden="true"
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(6,10,22,0.35)",
              backdropFilter: "blur(2px)",
              opacity: 1,
              zIndex: 2147483100,
            }}
          />

          <aside
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ai-title"
            className="ai-panel"
            onMouseEnter={() => setHoveringPanel(true)}
            onMouseLeave={() => setHoveringPanel(false)}
            onPointerEnter={() => setHoveringPanel(true)}
            onPointerLeave={() => setHoveringPanel(false)}
            style={{
              position: "fixed",
              right: 16,
              bottom: 86, // sits above FAB
              width: Math.min(420, window.innerWidth * 0.92),
              maxHeight: Math.min(0.72 * window.innerHeight, 680),
              display: "flex",
              flexDirection: "column",
              borderRadius: 16,
              background: "linear-gradient(180deg, #0f1534, #0c122a)",
              border: "1px solid rgba(255,255,255,0.10)",
              boxShadow: "0 24px 60px rgba(0,0,0,.55)",
              color: "var(--text, #e7ecff)",
              zIndex: 2147483300,
              overflow: "hidden",
              animation: "panel-in .24s ease-out",
            }}
          >
            <div
              className="ai-header"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 14px",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    fontSize: 12,
                    padding: "4px 8px",
                    borderRadius: 999,
                    color: "#0a0f24",
                    background: grad,
                    fontWeight: 800,
                    letterSpacing: ".2px",
                  }}
                >
                  1FA AI
                </div>
                <h3 id="ai-title" style={{ margin: 0 }}>How can we help?</h3>
              </div>
              <button
                aria-label="Close 1FA AI"
                onClick={() => setOpen(false)}
                style={{
                  background: "transparent",
                  border: 0,
                  color: "inherit",
                  fontSize: 22,
                  lineHeight: 1,
                  cursor: "pointer",
                  opacity: 0.9,
                  padding: "6px 8px",
                  borderRadius: 10,
                }}
              >
                ×
              </button>
            </div>

            <div
              className="ai-body"
              style={{
                padding: 14,
                overflow: "auto",
                overscrollBehavior: "contain", // stop scroll chaining to page
                WebkitOverflowScrolling: "touch",
              }}
            >
              <p className="hint" style={{ marginTop: 0 }}>
                Quick answers for now. This UI is ready to be wired to a real assistant later.
              </p>

              <div className="ai-accordion" style={{ display: "grid", gap: 10 }}>
                {FAQS.map((item, i) => {
                  const isOpen = expanded === i;
                  return (
                    <div
                      key={i}
                      className={`ai-qa ${isOpen ? "open" : ""}`}
                      style={{
                        border: "1px solid rgba(255,255,255,0.10)",
                        borderRadius: 12,
                        background: "rgba(255,255,255,0.04)",
                        overflow: "hidden",
                      }}
                    >
                      <button
                        className="ai-q"
                        aria-expanded={isOpen}
                        onClick={() => setExpanded(isOpen ? -1 : i)}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 10,
                          padding: "12px 14px",
                          background: "transparent",
                          border: 0,
                          color: "inherit",
                          cursor: "pointer",
                        }}
                      >
                        <span>{item.q}</span>
                        <span aria-hidden="true" style={{ fontWeight: 800, opacity: 0.8 }}>
                          {isOpen ? "−" : "+"}
                        </span>
                      </button>

                      <div
                        role="region"
                        style={{
                          maxHeight: isOpen ? 160 : 0,
                          padding: isOpen ? "0 14px 12px 14px" : "0 14px",
                          overflow: "hidden",
                          transition: "max-height .22s ease, padding .22s ease",
                        }}
                      >
                        <p className="hint" style={{ margin: 0 }}>{item.a}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* space to allow inner scrolling for long content; remove if not needed */}
              <div style={{ height: 320 }} />
            </div>
          </aside>
        </>
      )}
    </>
  );
}
