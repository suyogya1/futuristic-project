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
      .fa-fab{position:fixed;right:18px;bottom:18px;z-index:2147483200;width:90px;height:90px;border:none;background:transparent;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;transition:all .25s ease;padding:0;outline:none;}
      .fa-fab img{width:90px;height:90px;object-fit:contain;filter:drop-shadow(0 6px 18px rgba(108,124,255,.25));transition:all .25s ease;}
      .fa-fab:hover img{transform:translateY(-2px) scale(1.04);filter:drop-shadow(0 10px 28px rgba(108,124,255,.4));}
      .fa-fab:active img{transform:translateY(0) scale(1);}
      .fa-overlay{position:fixed;inset:0;z-index:2147483100;background:radial-gradient(800px 380px at 70% 10%,rgba(108,124,255,.10),transparent 60%),rgba(6,10,22,0.46);backdrop-filter:blur(3px);}
      .fa-panel{position:fixed;right:16px;bottom:108px;z-index:2147483300;width:min(420px,92vw);max-height:min(72vh,680px);display:grid;grid-template-rows:auto 1fr auto;border-radius:18px;overflow:hidden;background:linear-gradient(180deg,#0f1534,#0c122a);border:1px solid rgba(255,255,255,0.06);box-shadow:0 18px 60px rgba(0,0,0,.55),0 0 0 1px rgba(126,231,255,.03) inset;animation:fa-in .24s cubic-bezier(.22,.8,.34,1);}
      @keyframes fa-in{from{opacity:0;transform:translateY(10px) scale(.98);}to{opacity:1;transform:translateY(0) scale(1);}}
      .fa-head{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid rgba(255,255,255,0.05);background:linear-gradient(180deg,rgba(255,255,255,.04),rgba(255,255,255,0));color:#e7ecff;}
      .fa-title{display:flex;align-items:center;gap:10px;font-weight:700;font-size:16px;}
      .fa-logo{width:24px;height:24px;object-fit:contain;filter:drop-shadow(0 2px 6px rgba(108,124,255,.2));}
      .fa-actions{display:flex;align-items:center;gap:10px;color:#a7b0d6;font-size:11px;}
      .fa-x{background:transparent;border:0;color:#e7ecff;opacity:.8;font-size:22px;line-height:1;padding:6px 8px;border-radius:10px;cursor:pointer;transition:all .15s;}
      .fa-x:hover{opacity:1;background:rgba(255,255,255,.04);}
      .fa-body{padding:14px;color:#e7ecff;overflow:auto;overscroll-behavior:contain;line-height:1.6;}
      .fa-body::-webkit-scrollbar{width:8px;}
      .fa-body::-webkit-scrollbar-track{background:transparent;}
      .fa-body::-webkit-scrollbar-thumb{background:rgba(255,255,255,.08);border-radius:8px;border:2px solid transparent;background-clip:padding-box;}
      .fa-body::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,.12);}
      .fa-msg{max-width:100%;padding:10px 12px;border-radius:12px;margin:6px 0;line-height:1.6;font-size:14px;overflow:hidden;word-wrap:break-word;overflow-wrap:break-word;}
      .fa-msg.user{margin-left:auto;background:rgba(124,139,255,.12);border:1px solid rgba(124,139,255,.18);color:#e7ecff;}
      .fa-msg.assistant{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,0.05);color:#e7ecff;}
      .fa-msg.assistant h1,.fa-msg.assistant h2,.fa-msg.assistant h3{margin:12px 0 8px;color:#7ee7ff;font-weight:700;}
      .fa-msg.assistant h1{font-size:18px;}
      .fa-msg.assistant h2{font-size:16px;}
      .fa-msg.assistant h3{font-size:14px;}
      .fa-msg.assistant p{margin:8px 0;word-wrap:break-word;overflow-wrap:break-word;}
      .fa-msg.assistant ul,.fa-msg.assistant ol{margin:8px 0;padding-left:20px;overflow:hidden;}
      .fa-msg.assistant li{margin:4px 0;word-wrap:break-word;overflow-wrap:break-word;}
      .fa-msg.assistant code{background:rgba(0,0,0,.4);padding:2px 6px;border-radius:4px;font-family:ui-monospace,monospace;font-size:13px;color:#9ecbff;word-wrap:break-word;overflow-wrap:break-word;max-width:100%;display:inline-block;}
      .fa-msg.assistant pre{background:rgba(6,10,22,.6);border:1px solid rgba(255,255,255,.05);padding:12px;border-radius:8px;overflow-x:auto;margin:12px 0;}
      .fa-msg.assistant pre code{background:transparent;padding:0;color:#c3f0ff;}
      .fa-msg.assistant strong{color:#6c7cff;font-weight:600;word-wrap:break-word;overflow-wrap:break-word;}
      .fa-msg.assistant a{color:#7ee7ff;text-decoration:underline;}
      .fa-err{color:#ffb4b4;font-size:13px;margin:6px 2px 0;}
      .fa-foot{padding:10px 14px;border-top:1px solid rgba(255,255,255,.05);background:linear-gradient(0deg,rgba(255,255,255,.02),rgba(255,255,255,0));display:grid;gap:8px;}
      .fa-input{display:flex;align-items:center;gap:10px;border:1px solid rgba(255,255,255,0.06);background:rgba(255,255,255,.04);border-radius:12px;padding:10px 12px;transition:all .2s;}
      .fa-input:focus-within{border-color:rgba(126,231,255,.20);box-shadow:0 0 0 3px rgba(124,139,255,0.15);}
      .fa-input textarea{all:unset;color:#e7ecff;font:inherit;font-size:14px;line-height:1.5;min-height:22px;max-height:120px;overflow:auto;width:100%;resize:none;}
      .fa-input textarea::placeholder{color:#a7b0d6;opacity:.7;}
      .fa-btn{background:transparent;border:0;color:#7ee7ff;padding:6px;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s;opacity:.85;border-radius:8px;}
      .fa-btn:hover:not([disabled]){opacity:1;background:rgba(126,231,255,.08);}
      .fa-btn:active:not([disabled]){transform:scale(.95);}
      .fa-btn[disabled]{opacity:.4;cursor:not-allowed;}
      .fa-hint{color:#a7b0d6;font-size:11px;margin:0;text-align:center;opacity:.8;}
      .fa-icon{width:20px;height:20px;stroke:currentColor;fill:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;}
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

  function formatMessage(text) {
    if (!text) return text;

    let html = text;

    html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    html = html.replace(/^\* (.+)$/gm, '<li>$1</li>');
    html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
    html = html.replace(/\n\n/g, '</p><p>');

    if (!html.startsWith('<')) {
      html = '<p>' + html + '</p>';
    }

    return html;
  }

  return (
    <>
      {!open && (
       <button className="fa-fab cursor-target" onClick={() => setOpen(true)} title="AI Assistant">  
       <img src="/1fa-logo.png" alt="AI" />
       </button>
      )}

      {open && (
        <>
          <div className="fa-overlay" onClick={() => setOpen(false)} />
              <section className="fa-panel cursor-target" role="dialog" aria-label="AI Assistant">     
              <header className="fa-head">
              <div className="fa-title">
                <img src="/1fa-logo.png" alt="" className="fa-logo" />
                AI Assistant
              </div>
              <div className="fa-actions">
                <span>{headerRight}</span>
                <button className="fa-x" onClick={() => setOpen(false)} aria-label="Close">×</button>
              </div>
            </header>

            <div className="fa-body" ref={scrollerRef}>
              {history.map((m, i) => (
                <div key={i} className={`fa-msg ${m.role === "user" ? "user" : "assistant"}`}>
                  {m.role === "assistant" ? (
                    <div dangerouslySetInnerHTML={{ __html: formatMessage(m.content) }} />
                  ) : (
                    m.content
                  )}
                </div>
              ))}
              {error && <div className="fa-err">⚠ {error}</div>}
              {busy && <div className="fa-msg assistant">Thinking...</div>}
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
                  <svg className="fa-icon" viewBox="0 0 24 24">
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                  </svg>
                </button>
              </div>
              <div className="fa-hint">
                {apiKey ? "Press Enter to send • Shift+Enter for new line" : "No API key detected"}
              </div>
            </footer>
          </section>
        </>
      )}
    </>
  );
}
