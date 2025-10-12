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
      .fa-fab{position:fixed;right:24px;bottom:24px;z-index:999999;width:64px;height:64px;border-radius:50%;border:0;background:linear-gradient(135deg,#6c7cff,#7ee7ff);color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 32px rgba(108,124,255,.4),0 0 0 0 rgba(126,231,255,.6);cursor:pointer;transition:all .3s cubic-bezier(.34,1.56,.64,1);padding:12px;position:relative;}
      .fa-fab::before{content:'';position:absolute;inset:-3px;border-radius:50%;background:linear-gradient(135deg,rgba(108,124,255,.5),rgba(126,231,255,.5));filter:blur(16px);opacity:0;z-index:-1;transition:opacity .3s;}
      .fa-fab:hover{transform:translateY(-4px) scale(1.08);box-shadow:0 16px 48px rgba(108,124,255,.6),0 0 0 12px rgba(126,231,255,.2);}
      .fa-fab:hover::before{opacity:1;}
      .fa-fab:active{transform:translateY(-2px) scale(1.03);}
      .fa-fab img{width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 2px 6px rgba(0,0,0,.4));animation:float 3s ease-in-out infinite;}
      @keyframes float{0%,100%{transform:translateY(0) rotate(0deg);}50%{transform:translateY(-3px) rotate(2deg);}}
      .fa-fab:hover img{animation:spin 0.5s ease-in-out;}
      @keyframes spin{0%{transform:rotate(0deg) scale(1);}50%{transform:rotate(180deg) scale(1.15);}100%{transform:rotate(360deg) scale(1);}}
      .fa-overlay{position:fixed;inset:0;z-index:999998;background:rgba(6,10,22,.5);backdrop-filter:blur(4px);}
      .fa-panel{position:fixed;right:24px;bottom:104px;z-index:999999;width:min(420px,calc(100vw - 48px));height:min(640px,calc(100vh - 140px));display:flex;flex-direction:column;border-radius:18px;overflow:hidden;background:linear-gradient(180deg,#0f1534,#0c122a);border:1px solid rgba(255,255,255,.12);box-shadow:0 24px 72px rgba(0,0,0,.7),0 0 0 1px rgba(126,231,255,.08) inset;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;animation:slideUp .35s cubic-bezier(.34,1.56,.64,1);}
      @keyframes slideUp{from{opacity:0;transform:translateY(20px) scale(.96);}to{opacity:1;transform:translateY(0) scale(1);}}
      .fa-head{padding:16px 20px;border-bottom:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.04);display:flex;align-items:center;justify-content:space-between;flex-shrink:0;}
      .fa-title{font-size:15px;font-weight:700;color:#e7ecff;display:flex;align-items:center;gap:10px;letter-spacing:-.01em;}
      .fa-title img{width:24px;height:24px;object-fit:contain;filter:drop-shadow(0 2px 4px rgba(108,124,255,.3));}
      .fa-x{background:transparent;border:0;color:#a7b0d6;cursor:pointer;padding:6px;border-radius:8px;transition:all .15s;width:32px;height:32px;display:flex;align-items:center;justify-content:center;}
      .fa-x:hover{background:rgba(255,255,255,.08);color:#e7ecff;}
      .fa-body{flex:1;padding:20px;overflow-y:auto;display:flex;flex-direction:column;gap:14px;background:transparent;}
      .fa-body::-webkit-scrollbar{width:6px;}
      .fa-body::-webkit-scrollbar-track{background:transparent;}
      .fa-body::-webkit-scrollbar-thumb{background:rgba(126,231,255,.2);border-radius:10px;}
      .fa-body::-webkit-scrollbar-thumb:hover{background:rgba(126,231,255,.3);}
      .fa-msg{max-width:80%;padding:12px 14px;border-radius:14px;line-height:1.5;font-size:14px;margin:0;}
      .fa-msg.user{margin-left:auto;background:linear-gradient(135deg,#6c7cff,#7ee7ff);color:#fff;border-radius:14px 14px 4px 14px;font-weight:500;}
      .fa-msg.assistant{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:#e7ecff;border-radius:14px 14px 14px 4px;}
      .fa-err{padding:12px 14px;background:rgba(255,139,139,.12);border:1px solid rgba(255,139,139,.25);border-radius:10px;color:#ffb4b4;font-size:13px;line-height:1.5;}
      .fa-foot{padding:16px 20px;border-top:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.04);flex-shrink:0;}
      .fa-input{display:flex;align-items:flex-end;gap:8px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);border-radius:12px;padding:10px 12px;transition:all .2s;}
      .fa-input:focus-within{border-color:rgba(126,231,255,.35);background:rgba(255,255,255,.08);box-shadow:0 0 0 4px rgba(124,139,255,.15);}
      .fa-input textarea{all:unset;color:#e7ecff;font-family:inherit;font-size:14px;line-height:1.5;min-height:22px;max-height:100px;overflow:auto;width:100%;}
      .fa-input textarea::placeholder{color:#a7b0d6;opacity:.6;}
      .fa-btn{width:36px;height:36px;flex-shrink:0;background:linear-gradient(135deg,#6c7cff,#7ee7ff);color:#fff;border:0;border-radius:10px;cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center;}
      .fa-btn:hover:not([disabled]){transform:scale(1.05);box-shadow:0 4px 12px rgba(108,124,255,.4);}
      .fa-btn:active:not([disabled]){transform:scale(.95);}
      .fa-btn[disabled]{opacity:.4;cursor:not-allowed;}
      .fa-typing{display:flex;gap:5px;}
      .fa-typing span{width:6px;height:6px;background:rgba(126,231,255,.6);border-radius:50%;animation:typing .8s infinite;}
      .fa-typing span:nth-child(2){animation-delay:.15s;}
      .fa-typing span:nth-child(3){animation-delay:.3s;}
      @keyframes typing{0%,60%,100%{transform:translateY(0);}30%{transform:translateY(-6px);}}}
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
        <button className="fa-fab" onClick={() => setOpen(true)} aria-label="Chat">
          <img src="/1fa-logo.png" alt="1FA Assistant" />
        </button>
      )}

      {open && (
        <>
          <div className="fa-overlay" onClick={() => setOpen(false)} />
          <section className="fa-panel" role="dialog" aria-label="AI Assistant">
            <header className="fa-head">
              <div className="fa-title">
                <img src="/1fa-logo.png" alt="1FA" />
                1FA Assistant
              </div>
              <button className="fa-x" onClick={() => setOpen(false)} aria-label="Close">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </header>

            <div className="fa-body" ref={scrollerRef}>
              {history.map((m, i) => (
                <div key={i} className={`fa-msg ${m.role === "user" ? "user" : "assistant"}`}>
                  {m.content}
                </div>
              ))}
              {error && <div className="fa-err">{error}</div>}
              {busy && (
                <div className="fa-msg assistant">
                  <div className="fa-typing">
                    <span/><span/><span/>
                  </div>
                </div>
              )}
            </div>

            <footer className="fa-foot">
              <div className="fa-input">
                <textarea
                  ref={textRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Message 1FA Assistant"
                  disabled={busy}
                />
                <button className="fa-btn" onClick={onSend} disabled={busy || !input.trim() || resolving}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                  </svg>
                </button>
              </div>
            </footer>
          </section>
        </>
      )}
    </>
  );
}
