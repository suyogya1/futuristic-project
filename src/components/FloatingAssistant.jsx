import React, { useEffect, useRef, useState } from "react";

const FAQS = [
  { q: "What is One For All (1FA)?", a: "1FA is a playful-yet-serious Solana token focused on speed, composability, and community-driven features." },
  { q: "How do I buy or sell the token?", a: "Use the Buy / Sell Coin link in the navbar. It opens a dedicated page with wallet connect and a live chart. (Swaps are mocked until you wire the logic.)" },
  { q: "How do referrals work?", a: "Each wallet gets a deterministic referral code on the Rewards page. Share your code; friends can apply it once. The current demo stores data locally until you connect a backend/on-chain program." },
  { q: "Which wallets are supported?", a: "Phantom is supported out of the box via the Solana Wallet Adapter. You can add more adapters later." },
];

export default function FloatingAssistant() {
  const [open, setOpen] = useState(false);
  const [clickedPulse, setClickedPulse] = useState(false);
  const [expanded, setExpanded] = useState(0);
  const fabRef = useRef(null);
  const panelRef = useRef(null);
  const bodyRef = useRef(null);

  // Restore state for this tab
  useEffect(() => {
    const saved = sessionStorage.getItem("1fa-ai:open");
    if (saved === "1") setOpen(true);
  }, []);
  useEffect(() => {
    sessionStorage.setItem("1fa-ai:open", open ? "1" : "0");
  }, [open]);

  // Close on Esc
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Return focus to button when closing
  useEffect(() => {
    if (!open && fabRef.current) fabRef.current.focus();
  }, [open]);

  // Focus trap (simple)
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
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    };
    panel.addEventListener("keydown", trap);
    first?.focus();
    return () => panel.removeEventListener("keydown", trap);
  }, [open]);

  // Scroll isolation for the panel/body
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const scroller = bodyRef.current || panel;
    if (!panel) return;

    const onWheelCapture = (e) => e.stopPropagation();
    const onTouchMoveCapture = (e) => e.stopPropagation();

    panel.addEventListener("wheel", onWheelCapture, { capture: true });
    panel.addEventListener("touchmove", onTouchMoveCapture, { capture: true, passive: false });
    if (scroller && scroller !== panel) {
      scroller.addEventListener("wheel", onWheelCapture, { capture: true });
      scroller.addEventListener("touchmove", onTouchMoveCapture, { capture: true, passive: false });
    }

    return () => {
      panel.removeEventListener("wheel", onWheelCapture, { capture: true });
      panel.removeEventListener("touchmove", onTouchMoveCapture, { capture: true });
      if (scroller && scroller !== panel) {
        scroller.removeEventListener("wheel", onWheelCapture, { capture: true });
        scroller.removeEventListener("touchmove", onTouchMoveCapture, { capture: true });
      }
    };
  }, [open]);

  return (
    <>
      {/* FAB */}
      <button
        ref={fabRef}
        aria-label={open ? "Close 1FA AI" : "Open 1FA AI"}
        onClick={() => {
          setOpen((v) => !v);
          setClickedPulse(true);
          setTimeout(() => setClickedPulse(false), 220);
        }}
        className={`ai-fab ${clickedPulse ? "ai-fab-pop" : ""}`}
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
          <div className="ai-overlay" onClick={() => setOpen(false)} aria-hidden="true" />

          <aside
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ai-title"
            className="ai-panel"
          >
            <header className="ai-head">
              <div className="ai-titlewrap">
                <span className="ai-badge">1FA AI</span>
                <h3 id="ai-title">How can we help?</h3>
              </div>
              <button
                className="ai-x"
                aria-label="Close 1FA AI"
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </header>

            <div ref={bodyRef} className="ai-body">
              <p className="ai-lead hint">
                Quick answers for now. This UI is ready to be wired to a real assistant later.
              </p>

              <div className="ai-accordion">
                {FAQS.map((item, i) => {
                  const isOpen = expanded === i;
                  return (
                    <div key={i} className={`ai-qa ${isOpen ? "open" : ""}`}>
                      <button
                        className="ai-q"
                        aria-expanded={isOpen}
                        onClick={() => setExpanded(isOpen ? -1 : i)}
                      >
                        <span>{item.q}</span>
                        <span className="ai-caret" aria-hidden="true">
                          {isOpen ? "−" : "+"}
                        </span>
                      </button>

                      <div className="ai-a" role="region" aria-hidden={!isOpen}>
                        <p className="hint">{item.a}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <footer className="ai-foot">
              <span className="hint">Coming soon: chat input, suggested prompts, deep links.</span>
            </footer>
          </aside>
        </>
      )}
    </>
  );
}
