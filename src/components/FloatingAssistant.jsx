import React, { useEffect, useMemo, useRef, useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";

/** ---------------------------------------------------------
 * FloatingAIAssistant — Gemini (FREE models only)
 * Prefers: 1) 1.5-flash-8b  2) 1.5-flash-latest  3) 1.5-flash
 * - Uses ListModels to avoid 404s
 * - Streams when supported; falls back to non-stream
 * --------------------------------------------------------- */

const FREE_ONLY = [
  "gemini-1.5-flash-8b",
  "gemini-1.5-flash-latest",
  "gemini-1.5-flash",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
];

export default function FloatingAIAssistant({
  welcome = "Hi! I’m your AI assistant. How can I help?",
  placeholder = "Type a message… (Enter to send • Shift+Enter for newline)",
}) {
  const apiKey =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_GOOGLE_API_KEY) || "";

  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [input, setInput] = useState("");
  const [history, setHistory] = useState([{ role: "assistant", content: welcome }]);

  const [resolvedModel, setResolvedModel] = useState(null);
  const [supportsStream, setSupportsStream] = useState(false);
  const [resolving, setResolving] = useState(false);

  const scrollerRef = useRef(null);
  const textRef = useRef(null);
  const chatRef = useRef(null);

  /* ---------------- Scoped styles ---------------- */
  useEffect(() => {
    if (document.getElementById("floating-ai-styles")) return;
    const el = document.createElement("style");
    el.id = "floating-ai-styles";
    el.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
      :root{
        --fa-bg:#0a0e1a; --fa-bg-2:#080c16; --fa-text:#e7ecff; --fa-muted:#8a92b2;
        --fa-ring:rgba(124,139,255,.25); --fa-brand:#6c7cff; --fa-brand2:#7ee7ff;
        --fa-elev:0 20px 60px rgba(0,0,0,.6); --fa-brd:rgba(126,231,255,.12);
      }
      .fa-fab{position:fixed;right:24px;bottom:24px;z-index:2147483200;width:60px;height:60px;border-radius:18px;border:0;background:linear-gradient(135deg,#6c7cff,#7ee7ff);color:#fff;display:inline-flex;align-items:center;justify-content:center;box-shadow:0 8px 32px rgba(108,124,255,.4);cursor:pointer;transition:all .25s cubic-bezier(.34,1.56,.64,1);font-size:28px;backdrop-filter:blur(10px);}
      .fa-fab:hover{transform:translateY(-2px);box-shadow:0 12px 40px rgba(108,124,255,.5);}
      .fa-fab:active{transform:scale(.95);}
      .fa-fab::before{content:'';position:absolute;inset:-2px;border-radius:20px;background:linear-gradient(135deg,rgba(108,124,255,.3),rgba(126,231,255,.3));filter:blur(8px);opacity:0;z-index:-1;transition:opacity .3s;}
      .fa-fab:hover::before{opacity:1;}
      .fa-overlay{position:fixed;inset:0;z-index:2147483100;background:rgba(0,0,0,.5);backdrop-filter:blur(12px);animation:fadeIn .2s ease;}
      @keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
      .fa-panel{position:fixed;right:24px;bottom:100px;z-index:2147483300;width:min(440px,calc(100vw - 48px));height:min(640px,calc(100vh - 140px));display:flex;flex-direction:column;border-radius:20px;overflow:hidden;background:rgba(10,14,26,.98);border:1px solid rgba(126,231,255,.15);box-shadow:0 20px 60px rgba(0,0,0,.7);animation:slideUp .3s cubic-bezier(.34,1.56,.64,1);backdrop-filter:blur(40px);font-family:'Inter',system-ui,sans-serif;}
      @keyframes slideUp{from{opacity:0;transform:translateY(20px) scale(.96);}to{opacity:1;transform:translateY(0) scale(1);}}
      .fa-head{display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid rgba(126,231,255,.08);background:rgba(126,231,255,.02);color:var(--fa-text);flex-shrink:0;}
      .fa-title{display:flex;align-items:center;gap:10px;font-weight:700;font-size:16px;letter-spacing:-0.01em;}
      .fa-icon-ai{width:32px;height:32px;display:grid;place-items:center;background:linear-gradient(135deg,#6c7cff,#7ee7ff);border-radius:10px;font-size:18px;box-shadow:0 4px 12px rgba(108,124,255,.3);}
      .fa-actions{display:flex;align-items:center;gap:8px;}
      .fa-status{color:var(--fa-muted);font-size:11px;font-weight:500;padding:4px 8px;background:rgba(126,231,255,.08);border-radius:6px;}
      .fa-x{background:transparent;border:0;color:var(--fa-muted);font-size:24px;line-height:1;padding:6px;border-radius:8px;cursor:pointer;transition:all .15s ease;display:grid;place-items:center;width:32px;height:32px;}
      .fa-x:hover{color:var(--fa-text);background:rgba(255,255,255,.08);}
      .fa-body{flex:1;padding:24px;color:var(--fa-text);overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;display:flex;flex-direction:column;gap:16px;}
      .fa-body::-webkit-scrollbar{width:6px;}
      .fa-body::-webkit-scrollbar-track{background:transparent;}
      .fa-body::-webkit-scrollbar-thumb{background:rgba(126,231,255,.2);border-radius:10px;}
      .fa-body::-webkit-scrollbar-thumb:hover{background:rgba(126,231,255,.35);}
      .fa-msg{max-width:85%;padding:12px 16px;border-radius:18px;white-space:pre-wrap;word-break:break-word;line-height:1.55;font-size:14px;animation:msgIn .25s cubic-bezier(.34,1.56,.64,1);position:relative;margin:0;}
      @keyframes msgIn{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}
      .fa-msg.user{margin-left:auto;background:linear-gradient(135deg,#6c7cff,#7ee7ff);color:#fff;box-shadow:0 2px 8px rgba(108,124,255,.25);border-radius:18px 18px 4px 18px;font-weight:500;}
      .fa-msg.assistant{background:rgba(126,231,255,.06);border:1px solid rgba(126,231,255,.1);color:var(--fa-text);box-shadow:0 1px 3px rgba(0,0,0,.1);border-radius:18px 18px 18px 4px;padding-left:40px;}
      .fa-msg.assistant::before{content:'✨';position:absolute;left:14px;top:12px;font-size:16px;opacity:.8;}
      .fa-err{color:#ff8585;font-size:13px;padding:12px 16px;background:rgba(255,100,100,.1);border:1px solid rgba(255,100,100,.2);border-radius:12px;display:flex;align-items:flex-start;gap:10px;line-height:1.5;margin:0;}
      .fa-err::before{content:'⚠️';font-size:18px;flex-shrink:0;}
      .fa-foot{padding:20px 24px;border-top:1px solid rgba(126,231,255,.08);background:rgba(126,231,255,.02);flex-shrink:0;}
      .fa-input-wrapper{position:relative;}
      .fa-input{display:flex;align-items:flex-end;gap:8px;border:1px solid rgba(126,231,255,.15);background:rgba(255,255,255,.04);border-radius:14px;padding:10px 12px;transition:all .2s ease;}
      .fa-input:focus-within{border-color:rgba(126,231,255,.4);background:rgba(255,255,255,.08);box-shadow:0 0 0 3px rgba(126,231,255,.08);}
      .fa-input textarea{all:unset;color:var(--fa-text);font-family:'Inter',system-ui,sans-serif;font-size:14px;line-height:1.5;min-height:20px;max-height:120px;overflow:auto;width:100%;resize:none;font-weight:400;}
      .fa-input textarea::placeholder{color:var(--fa-muted);opacity:.5;}
      .fa-btn{width:36px;height:36px;flex-shrink:0;background:linear-gradient(135deg,#6c7cff,#7ee7ff);color:#fff;border:0;border-radius:10px;cursor:pointer;transition:all .2s ease;display:grid;place-items:center;font-size:18px;}
      .fa-btn:hover:not([disabled]){transform:scale(1.05);box-shadow:0 4px 12px rgba(108,124,255,.4);}
      .fa-btn:active:not([disabled]){transform:scale(.95);}
      .fa-btn[disabled]{opacity:.4;cursor:not-allowed;}
      .fa-hint{color:var(--fa-muted);font-size:11px;margin-top:8px;text-align:center;opacity:.6;font-weight:500;}
      @keyframes bounce{0%,80%,100%{transform:scale(0);}40%{transform:scale(1);}}
    `;
    document.head.appendChild(el);
  }, []);

  /* ---------------- Autoscroll ---------------- */
  useEffect(() => {
    if (!scrollerRef.current) return;
    scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
  }, [history, busy]);

  /* ---------------- Discover FREE model via ListModels ---------------- */
  useEffect(() => {
    if (!open) return;
    if (!apiKey) {
      setError("Missing Google API key. Set VITE_GOOGLE_API_KEY in .env.local and restart.");
      return;
    }
    let cancelled = false;

    async function resolveModel() {
      setResolving(true);
      setError("");
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`
        );
        if (!res.ok) throw new Error(`ListModels failed (${res.status})`);
        const data = await res.json();
        const models = Array.isArray(data?.models) ? data.models : [];

        const byName = new Map(models.map((m) => [m?.name.replace(/^models\//, ""), m]));
        let chosen = null;
        let streamCapable = false;

        for (const wish of FREE_ONLY) {
          const m = byName.get(wish);
          if (!m) continue;
          const methods = m.supportedGenerationMethods || [];
          chosen = wish;
          streamCapable = methods.includes("streamGenerateContent");
          break;
        }

        if (!cancelled) {
          if (!chosen) {
            setError(
              "No free Gemini model is enabled for your key/project. In Google AI Studio, enable access to: gemini-1.5-flash-8b or 1.5-flash."
            );
          }
          setResolvedModel(chosen);
          setSupportsStream(streamCapable);
        }
      } catch (e) {
        if (!cancelled) setError(readableError(e));
      } finally {
        if (!cancelled) setResolving(false);
      }
    }

    resolveModel();
    return () => { cancelled = true; };
  }, [open, apiKey]);

  /* ---------------- Prepare chat when model set ---------------- */
  useEffect(() => {
    if (!open || !apiKey || !resolvedModel) return;
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: resolvedModel });
      chatRef.current = model.startChat({ history: toGeminiHistory(history) });
    } catch (e) {
      setError(readableError(e));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedModel]);

  /* ---------------- Helpers ---------------- */
  function toGeminiHistory(h) {
    return h
      .map((m) => ({
        role: m.role === "assistant" ? "model" : m.role,
        parts: [{ text: m.content }],
      }))
      .filter((c, i) => !(i === 0 && c.role === "model"));
  }

  function readableError(e) {
    if (!e) return "Something went wrong.";
    if (typeof e === "string") return e;
    const msg = e?.message || "";
    if (msg.includes("404") && msg.toLowerCase().includes("not found")) {
      return "That model isn’t available to your free key/region. Enable a free model in AI Studio (e.g., gemini-1.5-flash-8b) and try again.";
    }
    if (msg.includes("401")) return "Unauthorized. Double-check your VITE_GOOGLE_API_KEY.";
    return msg || "Request failed.";
  }

  async function onSend() {
    const prompt = input.trim();
    if (!prompt || busy) return;
    if (!apiKey) {
      setError("Missing Google API key. Set VITE_GOOGLE_API_KEY in .env.local and restart.");
      return;
    }
    if (!resolvedModel) {
      setError("No free model resolved yet. One moment and try again.");
      return;
    }

    setInput("");
    setBusy(true);
    setError("");
    setHistory((h) => [...h, { role: "user", content: prompt }, { role: "assistant", content: "" }]);

    try {
      if (!chatRef.current) {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: resolvedModel });
        chatRef.current = model.startChat({ history: toGeminiHistory(history) });
      }

      if (supportsStream) {
        const result = await chatRef.current.sendMessageStream(prompt);
        for await (const chunk of result.stream) {
          const delta = chunk?.text() ?? "";
          if (delta) {
            setHistory((h) => {
              const copy = h.slice();
              const last = copy[copy.length - 1];
              if (last?.role === "assistant") last.content += delta;
              return copy;
            });
          }
        }
      } else {
        const result = await chatRef.current.sendMessage(prompt);
        const text = result?.response?.text?.() ?? "";
        setHistory((h) => {
          const copy = h.slice();
          const last = copy[copy.length - 1];
          if (last?.role === "assistant") last.content = text || "(no content)";
          return copy;
        });
      }
    } catch (e) {
      setError(readableError(e));
    } finally {
      setBusy(false);
      setTimeout(() => textRef.current?.focus(), 0);
    }
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  }

  const headerRight = useMemo(() => {
    if (resolving) return "Resolving free model…";
    if (resolvedModel) return `Model: ${resolvedModel}${supportsStream ? " • streaming" : ""}`;
    return "Model: —";
  }, [resolvedModel, supportsStream, resolving]);

  return (
    <>
      {!open && (
        <button className="fa-fab" onClick={() => setOpen(true)} title="AI Assistant" aria-label="Open AI Assistant">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            <path d="M8 10h.01M12 10h.01M16 10h.01"/>
          </svg>
        </button>
      )}

      {open && (
        <>
          <div className="fa-overlay" onClick={() => setOpen(false)} />
          <section className="fa-panel" role="dialog" aria-label="AI Assistant">
            <header className="fa-head">
              <div className="fa-title">
                <div className="fa-icon-ai">✨</div>
                <span>1FA Assistant</span>
              </div>
              <div className="fa-actions">
                <span className="fa-status">{headerRight}</span>
                <button className="fa-x" onClick={() => setOpen(false)} aria-label="Close">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </header>

            <div className="fa-body" ref={scrollerRef}>
              {history.map((m, i) => (
                <div key={i} className={`fa-msg ${m.role === "user" ? "user" : "assistant"}`}>
                  {m.content}
                </div>
              ))}
              {error && <div className="fa-err">{error}</div>}
              {busy && (
                <div className="fa-msg assistant" style={{ opacity: 0.6 }}>
                  <span style={{ display: 'inline-flex', gap: 4 }}>
                    <span style={{ animation: 'bounce 1.4s infinite' }}>●</span>
                    <span style={{ animation: 'bounce 1.4s 0.2s infinite' }}>●</span>
                    <span style={{ animation: 'bounce 1.4s 0.4s infinite' }}>●</span>
                  </span>
                </div>
              )}
            </div>

            <footer className="fa-foot">
              <div className="fa-input-wrapper">
                <div className="fa-input">
                  <textarea
                    ref={textRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder="Ask me anything about 1FA..."
                    disabled={busy}
                  />
                  <button className="fa-btn" onClick={onSend} disabled={busy || !input.trim() || resolving} title="Send message">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                    </svg>
                  </button>
                </div>
              </div>
              <div className="fa-hint">
                {apiKey ? "Powered by Gemini" : "API key required"}
              </div>
            </footer>
          </section>
        </>
      )}
    </>
  );
}
