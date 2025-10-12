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
      :root{
        --fa-bg:#0f1534; --fa-bg-2:#0c122a; --fa-text:#e7ecff; --fa-muted:#a7b0d6;
        --fa-ring:rgba(124,139,255,.45); --fa-brand:#6c7cff; --fa-brand2:#7ee7ff;
        --fa-elev:0 18px 48px rgba(0,0,0,.45); --fa-brd:rgba(255,255,255,.10);
      }
      .fa-fab{position:fixed;right:22px;bottom:22px;z-index:2147483200;width:64px;height:64px;border-radius:20px;border:1px solid rgba(126,231,255,0.2);background:linear-gradient(135deg,var(--fa-brand),var(--fa-brand2));color:#0a0f24;display:inline-flex;align-items:center;justify-content:center;box-shadow:0 16px 40px rgba(108,124,255,.40),0 0 0 1px rgba(126,231,255,.15) inset;cursor:pointer;transition:all .2s cubic-bezier(.34,1.56,.64,1);font-size:24px;font-weight:900;}
      .fa-fab:hover{transform:translateY(-3px) scale(1.05);box-shadow:0 20px 50px rgba(108,124,255,.55),0 0 0 1px rgba(126,231,255,.3) inset;}
      .fa-fab:active{transform:translateY(-1px) scale(1.02);}
      .fa-fab::before{content:'';position:absolute;inset:-4px;border-radius:22px;background:linear-gradient(135deg,rgba(108,124,255,.2),rgba(126,231,255,.2));filter:blur(12px);opacity:0.6;z-index:-1;animation:pulse 2s ease-in-out infinite;}
      @keyframes pulse{0%,100%{opacity:.4;transform:scale(1);}50%{opacity:.8;transform:scale(1.1);}}
      .fa-overlay{position:fixed;inset:0;z-index:2147483100;background:radial-gradient(1000px 500px at 70% 10%,rgba(108,124,255,.08),transparent 60%),rgba(6,10,22,0.65);backdrop-filter:blur(8px);animation:fadeIn .25s ease;}
      @keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
      .fa-panel{position:fixed;right:20px;bottom:100px;z-index:2147483300;width:min(480px,calc(100vw - 40px));max-height:min(75vh,720px);display:grid;grid-template-rows:auto 1fr auto;border-radius:24px;overflow:hidden;background:linear-gradient(180deg,rgba(15,21,52,0.98),rgba(12,18,42,0.98));border:1px solid rgba(126,231,255,.15);box-shadow:0 24px 80px rgba(0,0,0,.6),0 0 0 1px rgba(126,231,255,.08) inset;animation:slideUp .3s cubic-bezier(.34,1.56,.64,1);backdrop-filter:blur(20px);}
      @keyframes slideUp{from{opacity:0;transform:translateY(30px) scale(.95);}to{opacity:1;transform:translateY(0) scale(1);}}
      .fa-head{display:flex;align-items:center;justify-content:space-between;padding:18px 20px;border-bottom:1px solid rgba(255,255,255,.08);background:linear-gradient(180deg,rgba(255,255,255,.08),rgba(255,255,255,0));color:var(--fa-text);position:relative;}
      .fa-head::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(108,124,255,.06),rgba(126,231,255,.04));pointer-events:none;}
      .fa-title{display:flex;align-items:center;gap:12px;font-weight:900;font-size:18px;position:relative;z-index:1;}
      .fa-badge{font-size:13px;padding:6px 12px;border-radius:999px;font-weight:900;color:#0a0f24;background:linear-gradient(135deg,var(--fa-brand),var(--fa-brand2));box-shadow:0 8px 20px rgba(108,124,255,.35);letter-spacing:0.3px;}
      .fa-actions{display:flex;align-items:center;gap:12px;color:var(--fa-muted);font-size:11px;position:relative;z-index:1;}
      .fa-x{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);color:var(--fa-text);opacity:.9;font-size:22px;line-height:1;padding:8px 10px;border-radius:12px;cursor:pointer;transition:all .15s ease;}
      .fa-x:hover{opacity:1;background:rgba(255,255,255,.12);border-color:rgba(255,255,255,.2);transform:translateY(-1px);}
      .fa-body{padding:20px;color:var(--fa-text);overflow:auto;overscroll-behavior:contain;background:linear-gradient(180deg,transparent,rgba(126,231,255,.02));}
      .fa-body::-webkit-scrollbar{width:12px;}
      .fa-body::-webkit-scrollbar-track{background:transparent;margin:8px 0;}
      .fa-body::-webkit-scrollbar-thumb{background:rgba(126,231,255,.15);border-radius:10px;border:3px solid transparent;background-clip:padding-box;}
      .fa-body::-webkit-scrollbar-thumb:hover{background:rgba(126,231,255,.25);border:2px solid transparent;}
      .fa-msg{max-width:82%;padding:14px 16px;border-radius:16px;margin:10px 0;white-space:pre-wrap;word-break:break-word;line-height:1.6;font-size:15px;animation:msgIn .2s ease;position:relative;}
      @keyframes msgIn{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
      .fa-msg.user{margin-left:auto;background:linear-gradient(135deg,rgba(108,124,255,.25),rgba(126,231,255,.15));border:1px solid rgba(126,231,255,.3);color:var(--fa-text);box-shadow:0 4px 12px rgba(108,124,255,.2);}
      .fa-msg.user::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(108,124,255,.1),transparent);border-radius:16px;pointer-events:none;}
      .fa-msg.assistant{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:var(--fa-text);box-shadow:0 2px 8px rgba(0,0,0,.2);}
      .fa-msg.assistant::before{content:'✨';position:absolute;left:-28px;top:14px;font-size:18px;opacity:.7;}
      .fa-err{color:#ff9090;font-size:13px;margin:10px 4px;padding:12px 14px;background:rgba(255,139,139,.12);border:1px solid rgba(255,139,139,.25);border-radius:12px;display:flex;align-items:center;gap:8px;}
      .fa-err::before{content:'⚠';font-size:16px;}
      .fa-foot{padding:16px;border-top:1px solid rgba(255,255,255,.08);background:linear-gradient(0deg,rgba(255,255,255,.06),rgba(255,255,255,0));display:grid;gap:10px;}
      .fa-input{display:flex;align-items:flex-end;gap:10px;border:1px solid rgba(126,231,255,.2);background:rgba(255,255,255,.08);border-radius:16px;padding:12px;transition:all .2s ease;box-shadow:0 0 0 0 rgba(126,231,255,0);}
      .fa-input:focus-within{border-color:rgba(126,231,255,.4);box-shadow:0 0 0 4px rgba(126,231,255,.12);background:rgba(255,255,255,.12);}
      .fa-input textarea{all:unset;color:var(--fa-text);font:inherit;font-size:15px;line-height:1.5;min-height:24px;max-height:140px;overflow:auto;width:100%;resize:none;}
      .fa-input textarea::placeholder{color:var(--fa-muted);opacity:.6;}
      .fa-btn{background:linear-gradient(135deg,var(--fa-brand),var(--fa-brand2));color:#0a0f24;border:0;border-radius:12px;padding:10px 18px;font-weight:900;cursor:pointer;box-shadow:0 8px 24px rgba(108,124,255,.35);transition:all .15s ease;font-size:14px;letter-spacing:0.3px;}
      .fa-btn:hover:not([disabled]){transform:translateY(-2px);box-shadow:0 12px 32px rgba(108,124,255,.45);}
      .fa-btn:active:not([disabled]){transform:translateY(0);}
      .fa-btn[disabled]{opacity:.5;cursor:not-allowed;box-shadow:none;}
      .fa-hint{color:var(--fa-muted);font-size:11px;margin:0 4px;display:flex;align-items:center;gap:6px;opacity:.8;}
      .fa-hint::before{content:'ℹ';font-size:14px;opacity:.7;}
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
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
            <circle cx="12" cy="8" r="1.5" fill="#0a0f24"/>
            <circle cx="12" cy="16" r="1.5" fill="#0a0f24"/>
          </svg>
        </button>
      )}

      {open && (
        <>
          <div className="fa-overlay" onClick={() => setOpen(false)} />
          <section className="fa-panel" role="dialog" aria-label="AI Assistant">
            <header className="fa-head">
              <div className="fa-title">
                <span className="fa-badge">AI</span>
                <span>1FA Assistant</span>
              </div>
              <div className="fa-actions">
                <span style={{ fontSize: 11, opacity: 0.7 }}>{headerRight}</span>
                <button className="fa-x" onClick={() => setOpen(false)} aria-label="Close">✕</button>
              </div>
            </header>

            <div className="fa-body" ref={scrollerRef}>
              {history.map((m, i) => (
                <div key={i} className={`fa-msg ${m.role === "user" ? "user" : "assistant"}`}>
                  {m.content}
                </div>
              ))}
              {error && <div className="fa-err">{error}</div>}
              {busy && <div className="fa-msg assistant" style={{ opacity: 0.7 }}>Thinking...</div>}
            </div>

            <footer className="fa-foot">
              <div className="fa-input">
                <textarea
                  ref={textRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder={placeholder}
                  disabled={busy}
                />
                <button className="fa-btn" onClick={onSend} disabled={busy || !input.trim() || resolving}>
                  {busy ? "Sending…" : "Send"}
                </button>
              </div>
              <div className="fa-hint">
                {apiKey ? "Powered by Gemini • Free tier" : "API key required"}
              </div>
            </footer>
          </section>
        </>
      )}
    </>
  );
}
