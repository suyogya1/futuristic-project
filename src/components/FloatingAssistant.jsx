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
      .fa-fab{position:fixed;right:18px;bottom:18px;z-index:2147483200;width:56px;height:56px;border-radius:999px;border:1px solid transparent;background:linear-gradient(135deg,var(--fa-brand),var(--fa-brand2));color:#0a0f24;display:inline-flex;align-items:center;justify-content:center;box-shadow:0 14px 28px rgba(108,124,255,.32),0 0 0 6px var(--fa-ring);cursor:pointer;transition:transform .12s ease,box-shadow .18s ease,filter .2s ease;}
      .fa-fab:hover{transform:translateY(-1px) scale(1.02);filter:saturate(1.03);}
      .fa-fab:active{transform:translateY(0) scale(.98);}
      .fa-overlay{position:fixed;inset:0;z-index:2147483100;background:radial-gradient(800px 380px at 70% 8%,rgba(108,124,255,.10),transparent 60%),rgba(6,10,22,0.46);backdrop-filter:blur(3px);}
      .fa-panel{position:fixed;right:16px;bottom:86px;z-index:2147483300;width:min(420px,92vw);max-height:min(72vh,680px);display:grid;grid-template-rows:auto 1fr auto;border-radius:18px;overflow:hidden;background:linear-gradient(180deg,var(--fa-bg),var(--fa-bg-2));border:1px solid var(--fa-brd);box-shadow:var(--fa-elev),0 0 0 1px rgba(126,231,255,.05) inset;animation:fa-in .24s cubic-bezier(.22,.8,.34,1);}
      @keyframes fa-in{from{opacity:0;transform:translateY(10px) scale(.98);}to{opacity:1;transform:translateY(0) scale(1);}}
      .fa-head{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-bottom:1px solid var(--fa-brd);background:linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,0));color:var(--fa-text);}
      .fa-title{display:flex;align-items:center;gap:10px;font-weight:800;}
      .fa-badge{font-size:12px;padding:4px 8px;border-radius:999px;font-weight:800;color:#0a0f24;background:linear-gradient(135deg,var(--fa-brand),var(--fa-brand2));box-shadow:0 6px 16px rgba(108,124,255,.3);}
      .fa-actions{display:flex;align-items:center;gap:8px;color:var(--fa-muted);font-size:12px;}
      .fa-x{background:transparent;border:0;color:var(--fa-text);opacity:.9;font-size:20px;line-height:1;padding:6px 8px;border-radius:10px;cursor:pointer;}
      .fa-x:hover{opacity:1;background:rgba(255,255,255,.08);}
      .fa-body{padding:10px;color:var(--fa-text);overflow:auto;overscroll-behavior:contain;}
      .fa-body::-webkit-scrollbar{width:10px;}
      .fa-body::-webkit-scrollbar-thumb{background:rgba(255,255,255,.12);border-radius:10px;border:2px solid transparent;background-clip:padding-box;}
      .fa-body::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,.18);}
      .fa-msg{max-width:85%;padding:10px 12px;border-radius:12px;border:1px solid var(--fa-brd);background:rgba(255,255,255,.04);margin:6px 0;white-space:pre-wrap;word-break:break-word;}
      .fa-msg.user{margin-left:auto;background:rgba(124,139,255,.16);border-color:rgba(124,139,255,.32);}
      .fa-msg.assistant{background:rgba(255,255,255,.04);}
      .fa-err{color:#ffb4b4;font-size:13px;margin:6px 2px 0;}
      .fa-foot{padding:10px;border-top:1px solid var(--fa-brd);background:linear-gradient(0deg,rgba(255,255,255,.04),rgba(255,255,255,0));display:grid;gap:8px;}
      .fa-input{display:flex;align-items:center;gap:8px;border:1px solid var(--fa-brd);background:rgba(255,255,255,.06);border-radius:12px;padding:8px;}
      .fa-input textarea{all:unset;color:var(--fa-text);font:inherit;min-height:22px;max-height:120px;overflow:auto;width:100%;}
      .fa-btn{background:linear-gradient(135deg,var(--fa-brand),var(--fa-brand2));color:#0a0f24;border:0;border-radius:10px;padding:8px 14px;font-weight:800;cursor:pointer;box-shadow:0 8px 20px rgba(108,124,255,.30);}
      .fa-btn[disabled]{opacity:.6;cursor:not-allowed;box-shadow:none;}
      .fa-hint{color:var(--fa-muted);font-size:12px;margin:0 2px;}
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
        <button className="fa-fab" onClick={() => setOpen(true)} title="Assistant">AI</button>
      )}

      {open && (
        <>
          <div className="fa-overlay" onClick={() => setOpen(false)} />
          <section className="fa-panel" role="dialog" aria-label="AI Assistant">
            <header className="fa-head">
              <div className="fa-title">
                <span className="fa-badge">AI</span>
                Assistant
              </div>
              <div className="fa-actions">
                <span>{headerRight}</span>
                <button className="fa-x" onClick={() => setOpen(false)} aria-label="Close">×</button>
              </div>
            </header>

            <div className="fa-body" ref={scrollerRef}>
              {history.map((m, i) => (
                <div key={i} className={`fa-msg ${m.role === "user" ? "user" : "assistant"}`}>
                  {m.content}
                </div>
              ))}
              {error && <div className="fa-err">⚠ {error}</div>}
              {busy && <div className="fa-msg assistant">…</div>}
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
                {apiKey ? "Free model(s) will be used automatically" : "No API key detected"}
              </div>
            </footer>
          </section>
        </>
      )}
    </>
  );
}
