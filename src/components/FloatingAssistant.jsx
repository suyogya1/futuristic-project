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
        --fa-bg:#0a0e15; --fa-bg-2:#07090e; --fa-text:#e7ecff; --fa-muted:#9ca3af;
        --fa-brand:#facc15; --fa-brand2:#f59e0b;
        --fa-elev:0 20px 50px rgba(0,0,0,.6); --fa-brd:rgba(255,255,255,.08);
      }
      .fa-fab{position:fixed;right:20px;bottom:20px;z-index:2147483200;width:60px;height:60px;border-radius:16px;border:1px solid var(--fa-brd);background:rgba(15,20,30,.95);backdrop-filter:blur(10px);display:inline-flex;align-items:center;justify-content:center;box-shadow:0 8px 24px rgba(0,0,0,.4);cursor:pointer;transition:all .2s ease;padding:0;}
      .fa-fab img{width:36px;height:36px;object-fit:contain;filter:drop-shadow(0 2px 8px rgba(250,204,21,.3));}
      .fa-fab:hover{transform:translateY(-2px);box-shadow:0 12px 32px rgba(0,0,0,.5);border-color:rgba(250,204,21,.3);}
      .fa-fab:active{transform:translateY(0);}
      .fa-overlay{position:fixed;inset:0;z-index:2147483100;background:rgba(0,0,0,0.5);backdrop-filter:blur(4px);}
      .fa-panel{position:fixed;right:20px;bottom:92px;z-index:2147483300;width:min(460px,calc(100vw - 40px));max-height:min(75vh,700px);display:grid;grid-template-rows:auto 1fr auto;border-radius:16px;overflow:hidden;background:var(--fa-bg);border:1px solid var(--fa-brd);box-shadow:var(--fa-elev);animation:fa-in .3s cubic-bezier(.22,.8,.34,1);}
      @keyframes fa-in{from{opacity:0;transform:translateY(12px) scale(.96);}to{opacity:1;transform:translateY(0) scale(1);}}
      .fa-head{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid var(--fa-brd);background:rgba(255,255,255,.02);color:var(--fa-text);}
      .fa-title{display:flex;align-items:center;gap:12px;font-weight:700;font-size:16px;}
      .fa-logo{width:28px;height:28px;object-fit:contain;filter:drop-shadow(0 2px 6px rgba(250,204,21,.3));}
      .fa-actions{display:flex;align-items:center;gap:12px;color:var(--fa-muted);font-size:11px;}
      .fa-x{background:transparent;border:0;color:var(--fa-text);opacity:.7;font-size:24px;line-height:1;padding:4px 8px;border-radius:8px;cursor:pointer;transition:all .15s;}
      .fa-x:hover{opacity:1;background:rgba(255,255,255,.08);}
      .fa-body{padding:16px;color:var(--fa-text);overflow:auto;overscroll-behavior:contain;line-height:1.6;}
      .fa-body::-webkit-scrollbar{width:8px;}
      .fa-body::-webkit-scrollbar-track{background:transparent;}
      .fa-body::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:8px;}
      .fa-body::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,.15);}
      .fa-msg{max-width:90%;padding:12px 16px;border-radius:12px;margin:8px 0;line-height:1.6;font-size:14px;}
      .fa-msg.user{margin-left:auto;background:linear-gradient(135deg,rgba(250,204,21,.15),rgba(245,158,11,.15));border:1px solid rgba(250,204,21,.2);color:var(--fa-text);}
      .fa-msg.assistant{background:rgba(255,255,255,.04);border:1px solid var(--fa-brd);color:var(--fa-text);}
      .fa-msg.assistant h1,.fa-msg.assistant h2,.fa-msg.assistant h3{margin:12px 0 8px;color:var(--fa-brand);font-weight:700;}
      .fa-msg.assistant h1{font-size:18px;}
      .fa-msg.assistant h2{font-size:16px;}
      .fa-msg.assistant h3{font-size:14px;}
      .fa-msg.assistant p{margin:8px 0;}
      .fa-msg.assistant ul,.fa-msg.assistant ol{margin:8px 0;padding-left:20px;}
      .fa-msg.assistant li{margin:4px 0;}
      .fa-msg.assistant code{background:rgba(0,0,0,.3);padding:2px 6px;border-radius:4px;font-family:monospace;font-size:13px;}
      .fa-msg.assistant pre{background:rgba(0,0,0,.4);padding:12px;border-radius:8px;overflow-x:auto;margin:12px 0;}
      .fa-msg.assistant pre code{background:transparent;padding:0;}
      .fa-msg.assistant strong{color:var(--fa-brand);font-weight:600;}
      .fa-msg.assistant a{color:var(--fa-brand);text-decoration:underline;}
      .fa-err{color:#ff6b6b;font-size:13px;margin:8px 0;padding:12px;background:rgba(255,107,107,.1);border:1px solid rgba(255,107,107,.2);border-radius:8px;}
      .fa-foot{padding:16px;border-top:1px solid var(--fa-brd);background:rgba(255,255,255,.02);display:grid;gap:12px;}
      .fa-input{display:flex;align-items:flex-end;gap:12px;border:1px solid var(--fa-brd);background:rgba(255,255,255,.04);border-radius:12px;padding:12px;transition:all .2s;}
      .fa-input:focus-within{border-color:rgba(250,204,21,.3);background:rgba(255,255,255,.06);}
      .fa-input textarea{all:unset;color:var(--fa-text);font:inherit;font-size:14px;line-height:1.5;min-height:20px;max-height:120px;overflow:auto;width:100%;resize:none;}
      .fa-input textarea::placeholder{color:var(--fa-muted);}
      .fa-btn{background:linear-gradient(135deg,var(--fa-brand),var(--fa-brand2));color:#0a0e15;border:0;border-radius:8px;padding:10px 18px;font-weight:700;font-size:14px;cursor:pointer;transition:all .2s;box-shadow:0 4px 12px rgba(250,204,21,.25);white-space:nowrap;}
      .fa-btn:hover:not([disabled]){transform:translateY(-1px);box-shadow:0 6px 16px rgba(250,204,21,.35);}
      .fa-btn:active:not([disabled]){transform:translateY(0);}
      .fa-btn[disabled]{opacity:.5;cursor:not-allowed;box-shadow:none;}
      .fa-hint{color:var(--fa-muted);font-size:11px;margin:0;text-align:center;}
      .fa-icon{width:20px;height:20px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}
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
        <button className="fa-fab" onClick={() => setOpen(true)} title="AI Assistant">
          <img src="/1fa-logo.png" alt="AI" />
        </button>
      )}

      {open && (
        <>
          <div className="fa-overlay" onClick={() => setOpen(false)} />
          <section className="fa-panel" role="dialog" aria-label="AI Assistant">
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
