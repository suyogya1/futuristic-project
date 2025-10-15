import React, { useEffect, useMemo, useRef, useState } from "react";

/** ---------- 3D Card Dimensions (keep in sync with CSS) ---------- */
const THICK = 20;
const W = 240;
const H = 300;

/** ---------- App Config ---------- */
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

/** ---------- Inline styles for layout (prevents container overlap) ---------- */
const layout = {
  page: { minHeight: "100vh", background: "rgb(12,19,35)", paddingBottom: 48 },
  main: { maxWidth: 1240, margin: "0 auto", padding: "24px 16px" },
};

/** ---------- Global CSS (injected once) ---------- */
const globalCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap');
  :root { --w:${W}px; --h:${H}px; --t:${THICK}px; }
  *{box-sizing:border-box}
  body{font-family:Inter, ui-sans-serif, system-ui; color:#e5e7eb; background:#07090e}

  /* Header (optional space) */
  .page-header{display:flex; align-items:center; justify-content:space-between; gap:16px; margin-bottom:18px}
  .brand{font-weight:900; letter-spacing:.02em}
  .brand b{background:linear-gradient(135deg,#facc15,#d97706); -webkit-background-clip:text; color:transparent}

  /* Card Grid */
  .cards-grid{
    display:grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 22px;
    align-items:start;
    margin: 12px 0 36px;
  }
  @media (max-width: 1250px){ .cards-grid{ grid-template-columns: repeat(3, 1fr); } }
  @media (max-width: 960px){ .cards-grid{ grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 640px){ .cards-grid{ grid-template-columns: 1fr; } }

  /* 3D Scene & Card */
  .scene{ 
    perspective: 1800px; 
    display:flex; 
    justify-content:center;
    cursor: zoom-in;
  }
  .card3d{
    position:relative; width:var(--w); height:var(--h);
    transform-style:preserve-3d; animation: spinY 8s linear infinite;
    border-radius:20px;
    box-shadow: 0 40px 100px rgba(0,0,0,.55);
    transition: box-shadow 0.4s ease;
  }
  @keyframes spinY { from{ transform: rotateY(0) } to{ transform: rotateY(360deg) } }
  .scene:hover .card3d {
    animation-play-state: paused;
    box-shadow: 0 40px 100px rgba(0,0,0,.65), 0 0 60px rgba(126,231,255,.25);
  }
  .face3d{ position:absolute; inset:0; border-radius:20px; backface-visibility:hidden; overflow:hidden; background:#0b0f15; }
  .front{ transform: translateZ(calc(var(--t)/2)); }
  .back{ transform: rotateY(180deg) translateZ(calc(var(--t)/2)); background: #000; }
  
  /** UPDATED: CSS for frontImage to fit inside the frame */
  .frontImage {
    display: block;
    position: absolute;
    inset: 10px; /* Match the .frameArea inset */
    width: calc(100% - 20px);
    height: calc(100% - 20px);
    object-fit: cover;
    border-radius: 14px; /* Match the .frameArea border-radius */
    z-index: 1; /* Sit on top of the frame background */
  }
  
  .frameArea{
    position:absolute; inset:10px; border-radius:14px; background:
      linear-gradient(160deg, #101622, #0d1420 40%, #0b1220 60%),
      radial-gradient(120% 80% at 100% 0%, rgba(255,255,255,.06), transparent 60%);
    box-shadow: inset 0 0 0 1px rgba(255,255,255,.06), inset 0 -18px 38px rgba(0,0,0,.45);
    z-index: 0;
    transition: all 0.4s ease;
    position: relative;
    overflow: hidden;
  }
  .frameArea::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: conic-gradient(from 0deg at 50% 50%, transparent, rgba(126,231,255,0.1), transparent 60deg);
    animation: rotate-frame 8s linear infinite;
    opacity: 0;
    transition: opacity 0.4s ease;
  }
  @keyframes rotate-frame {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  .card3d:hover .frameArea::before {
    opacity: 1;
  }
  .card3d:hover .frameArea {
    box-shadow: inset 0 0 0 1px rgba(126,231,255,.3), inset 0 -18px 38px rgba(0,0,0,.45), 0 0 25px rgba(126,231,255,.2);
  }
  .back-text-content {
    position: absolute;
    inset: 10px;
    z-index: 2;
    padding: 36px 28px;
    display: flex;
    flex-direction: column;
    height: calc(100% - 20px);
    align-items: center;
    justify-content: space-between;
    text-align: center;
    border-radius: 14px;
    background: linear-gradient(135deg, rgba(108,124,255,0.08), rgba(126,231,255,0.04));
    backdrop-filter: blur(12px);
    position: relative;
    overflow: hidden;
    border: 1px solid rgba(108,124,255,0.15);
    transition: all 0.4s ease;
  }
  .back-text-content::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(126,231,255,0.6), transparent);
    opacity: 0;
    transition: opacity 0.4s ease;
  }
  .card3d:hover .back-text-content {
    background: linear-gradient(135deg, rgba(108,124,255,0.12), rgba(126,231,255,0.06));
    border-color: rgba(126,231,255,0.3);
  }
  .card3d:hover .back-text-content::before {
    opacity: 1;
  }
  .back-text-content::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(126,231,255,0.6), transparent);
    opacity: 0;
    transition: opacity 0.4s ease;
  }
  .card3d:hover .back-text-content::after {
    opacity: 1;
  }
  .back-token-large {
    font-size: 14px;
    font-weight: 900;
    color: #7ee7ff;
    letter-spacing: 3px;
    text-transform: uppercase;
    position: relative;
    padding: 10px 20px;
    background: linear-gradient(135deg, rgba(126,231,255,0.12), rgba(108,124,255,0.08));
    border: 1px solid rgba(126,231,255,0.3);
    border-radius: 8px;
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    box-shadow: 0 4px 15px rgba(126,231,255,0.15);
  }
  .back-token-large::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 8px;
    padding: 2px;
    background: linear-gradient(135deg, rgba(126,231,255,0.5), rgba(108,124,255,0.3));
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    opacity: 0;
    transition: opacity 0.4s ease;
  }
  .card3d:hover .back-token-large {
    transform: translateY(-5px) scale(1.05);
    box-shadow: 0 8px 25px rgba(126,231,255,0.3);
    border-color: rgba(126,231,255,0.5);
  }
  .card3d:hover .back-token-large::before {
    opacity: 1;
    animation: rotate-glow 3s linear infinite;
  }
  @keyframes rotate-glow {
    0% { filter: hue-rotate(0deg); }
    100% { filter: hue-rotate(360deg); }
  }
  .back-message-main {
    font-size: 15px;
    font-weight: 500;
    color: #e2e8f0;
    line-height: 1.7;
    word-break: break-word;
    padding: 20px 16px;
    max-height: 140px;
    overflow-y: auto;
    transition: all 0.4s ease;
    position: relative;
  }
  .back-message-main::before {
    content: '"';
    position: absolute;
    top: 0;
    left: 0;
    font-size: 48px;
    color: rgba(126,231,255,0.15);
    font-family: Georgia, serif;
    line-height: 1;
    transition: all 0.4s ease;
  }
  .back-message-main::after {
    content: '"';
    position: absolute;
    bottom: -10px;
    right: 0;
    font-size: 48px;
    color: rgba(126,231,255,0.15);
    font-family: Georgia, serif;
    line-height: 1;
    transition: all 0.4s ease;
  }
  .card3d:hover .back-message-main {
    color: #ffffff;
    transform: scale(1.02);
  }
  .card3d:hover .back-message-main::before,
  .card3d:hover .back-message-main::after {
    color: rgba(126,231,255,0.3);
  }
  .back-message-main::-webkit-scrollbar { width: 3px; }
  .back-message-main::-webkit-scrollbar-track { background: transparent; }
  .back-message-main::-webkit-scrollbar-thumb { background: rgba(126,231,255,0.3); border-radius: 3px; }
  .back-message-main::-webkit-scrollbar-thumb:hover { background: rgba(126,231,255,0.5); }

  .side{ position:absolute; opacity:.98 }
  .side.left  { width:var(--t); height:var(--h); left:calc(var(--w)/2 - var(--t)/2); top:0; transform: rotateY(90deg) translateZ(calc(var(--w)/2)) }
  .side.right { width:var(--t); height:var(--h); left:calc(var(--w)/2 - var(--t)/2); top:0; transform: rotateY(90deg) translateZ(calc(-1 * var(--w)/2)) }
  .side.top   { width:var(--w); height:var(--t); left:0; top:calc(var(--h)/2 - var(--t)/2); transform: rotateX(90deg) translateZ(calc(var(--h)/2)) }
  .side.bottom{ width:var(--w); height:var(--t); left:0; top:calc(var(--h)/2 - var(--t)/2); transform: rotateX(90deg) translateZ(calc(-1 * var(--h)/2)) }
  .goldSide{
    background: linear-gradient(135deg, #7ee7ff 0%, #6c7cff 50%, #5563d1 100%);
    box-shadow: inset 0 0 4px rgba(255,255,255,.4), 0 0 16px rgba(126,231,255,.3);
    transition: all 0.3s ease;
  }
  .card3d:hover .goldSide {
    box-shadow: inset 0 0 6px rgba(255,255,255,.5), 0 0 24px rgba(126,231,255,.5);
  }
  .voteBtn{
    padding: 14px 32px;
    border-radius: 12px;
    border: 2px solid transparent;
    background: linear-gradient(135deg, #6c7cff, #7ee7ff) padding-box,
                linear-gradient(135deg, #6c7cff, #7ee7ff) border-box;
    color: #0a0f24;
    font-weight: 800;
    font-size: 13px;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    cursor: pointer;
    box-shadow: 0 6px 20px rgba(108,124,255,0.4), inset 0 1px 0 rgba(255,255,255,0.2);
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    position: relative;
    overflow: hidden;
  }
  .voteBtn::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: rgba(255,255,255,0.4);
    transform: translate(-50%, -50%);
    transition: width 0.6s ease, height 0.6s ease;
  }
  .voteBtn:hover::before {
    width: 300px;
    height: 300px;
  }
  .voteBtn:hover{
    transform: translateY(-4px) scale(1.03);
    box-shadow: 0 12px 30px rgba(108,124,255,0.5), inset 0 1px 0 rgba(255,255,255,0.3);
    filter: brightness(1.1);
  }
  .voteBtn:active{
    transform: translateY(-2px) scale(1.01);
  }
  .voteBtn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    filter: grayscale(0.5);
  }
  .voteBtn:disabled:hover {
    transform: none;
    box-shadow: 0 6px 20px rgba(108,124,255,0.4), inset 0 1px 0 rgba(255,255,255,0.2);
    filter: brightness(1) grayscale(0.5);
  }
  .voteBtn:disabled::before {
    display: none;
  }

  /* --- Styles for Modals and Uploader --- */
  .upload-trigger-area { position: fixed; bottom: 20px; left: 20px; z-index: 90; }
  .open-uploader-btn { padding: 10px 20px; font-size: 0.95rem; font-weight: 700; letter-spacing: .02em; background: linear-gradient(135deg, #8b5cf6, #ec4899); color: white; border: none; border-radius: 999px; cursor: pointer; transition: transform .2s ease, box-shadow .2s ease; box-shadow: 0 6px 20px rgba(139, 92, 246, 0.3); }
  .open-uploader-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(139, 92, 246, 0.4); }
  .modal-backdrop { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(8px); z-index: 100; display: flex; align-items: center; justify-content: center; padding: 16px; }
  .modal-content { position: relative; max-width: 980px; width: 100%; }
  .modal-close-btn { position: absolute; top: -10px; right: -10px; width: 32px; height: 32px; border-radius: 50%; background: #1e293b; color: #e2e8f0; border: 2px solid #475569; font-size: 20px; font-weight: 600; line-height: 1; cursor: pointer; z-index: 110; display:flex; align-items:center; justify-content:center; transition: all .2s ease; }
  .modal-close-btn:hover { transform: scale(1.1) rotate(90deg); background: #ef4444; border-color: #fca5a5; }
  .upload-container{ width: 100%; background: rgba(30,41,59,.8); border: 1px solid rgba(148,163,184,.2); border-radius: 16px; backdrop-filter: blur(10px); overflow:hidden; }
  .upload-header{ padding: 16px 20px; background: rgba(15,23,42,.5); border-bottom: 1px solid rgba(148,163,184,.1); }
  .upload-title{ font-size: 1.1rem; font-weight: 600; color: #cbd5e1; display:flex; align-items:center; gap:8px}
  .message-area{ padding: 20px; }
  .message-input{ width:100%; min-height:100px; padding:12px; background: rgba(15,23,42,.5); border: 1px solid rgba(148,163,184,.2); border-radius:8px; color:#e2e8f0; font-size:1rem; font-family:inherit; resize:vertical; }
  .upload-footer{ padding: 16px 20px; background: rgba(15,23,42,.3); border-top: 1px solid rgba(148,163,184,.1); display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap; }
  .file-input{ display:none }
  .file-label{ padding: 8px 16px; background: rgba(148,163,184,.1); border: 1px solid rgba(148,163,184,.2); border-radius:8px; cursor:pointer; display:flex; align-items:center; gap:8px; color:#94a3b8 }
  .file-name{ color:#60a5fa; font-size:.9rem; max-width:320px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .upload-button{ padding:10px 24px; background: linear-gradient(135deg,#3b82f6,#8b5cf6); border:none; border-radius:8px; color:#fff; font-weight:600; cursor:pointer; }
  .upload-button:disabled{ opacity:.5; cursor:not-allowed }
  .preview-container{ margin: 16px 20px 0; padding: 12px; background: rgba(96,165,250,.1); border: 1px solid rgba(96,165,250,.2); border-radius:8px; display:flex; align-items:center; gap:12px; }
  .preview-image{ width:60px; height:60px; object-fit:cover; border-radius:6px }
  .remove-preview{ padding: 6px 12px; background: rgba(239,68,68,.1); border: 1px solid rgba(239,68,68,.2); border-radius: 6px; color:#ef4444; cursor:pointer; }
  .subtle{ color:#64748b; font-size:.85rem }
  .preview-backdrop { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.85); backdrop-filter: blur(12px); z-index: 200; display: flex; align-items: center; justify-content: center; cursor: zoom-out; }
  .preview-image-large { display: block; max-width: 90vw; max-height: 90vh; object-fit: contain; border-radius: 12px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.75); }
  .preview-close-text { position: absolute; bottom: 24px; left: 50%; transform: translateX(-50%); color: rgba(255, 255, 255, 0.7); background: rgba(0, 0, 0, 0.4); padding: 8px 16px; border-radius: 99px; font-size: 0.9rem; user-select: none; }
`;

/** ---------- Utils ---------- */
// ... (readFileAsDataURL function is unchanged) ...
const readFileAsDataURL = (file) =>
  new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });

/** ---------- Component ---------- */
export default function ImagePage() {
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [message, setMessage] = useState("");
  const [cards, setCards] = useState([]);
  const [counter, setCounter] = useState(0);
  const fileInputRef = useRef(null);
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);
  const [previewImageSrc, setPreviewImageSrc] = useState(null);

  // ... (All logic hooks and functions are unchanged) ...
  useEffect(() => {
    const tag = document.createElement("style");
    tag.textContent = globalCSS;
    document.head.appendChild(tag);
    return () => document.head.removeChild(tag);
  }, []);

  useEffect(() => {
    try {
      const savedData = JSON.parse(localStorage.getItem("meme_cards") || "[]");
      const validCards = Array.isArray(savedData)
        ? savedData.filter(c => c && typeof c === 'object' && c.id && c.image)
        : [];
      setCards(validCards);
      const savedCounter = parseInt(localStorage.getItem("meme_counter") || "0", 10);
      setCounter(Number.isFinite(savedCounter) ? savedCounter : 0);
    } catch {
      localStorage.removeItem("meme_cards");
    }
  }, []);
  
  useEffect(() => {
    try {
      localStorage.setItem("meme_cards", JSON.stringify(cards));
    } catch (error) {
      console.error("Failed to save cards to localStorage:", error);
      alert("Could not save cards. The browser's storage might be full.");
    }
  }, [cards]);

  useEffect(() => {
    try {
      localStorage.setItem("meme_counter", String(counter));
    } catch (error) {
      console.error("Failed to save counter to localStorage:", error);
    }
  }, [counter]);

  const onFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE_BYTES) {
      alert(`Image size should be less than ${MAX_FILE_SIZE_MB}MB`);
      return;
    }
    setImageFile(file);
    const dataUrl = await readFileAsDataURL(file);
    setImagePreview(dataUrl);
  };

  const removeSelected = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  
  const upload = () => {
    if (!imagePreview) return alert("Please select an image");
    if (!message.trim()) return alert("Please add a message");
    const next = counter + 1;
    const token = `#${String(next).padStart(4, "0")}`;
    const newCard = {
      id: Date.now(),
      token,
      image: imagePreview,
      message: message.trim(),
      votes: 0,
      createdAt: new Date().toISOString(),
    };
    setCards((prev) => [newCard, ...prev]);
    setCounter(next);
    setMessage("");
    removeSelected();
    setIsUploaderOpen(false);

    const toast = document.createElement("div");
    toast.style.cssText = "position:fixed;bottom:20px;right:20px;background:linear-gradient(135deg,#10b981,#059669);color:#fff;padding:12px 20px;border-radius:8px;box-shadow:0 10px 20px rgba(0,0,0,.3);z-index:1000";
    toast.textContent = "Meme card created!";
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 1800);
  };

  const votedSet = useMemo(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem("meme_votes") || "[]"));
    } catch { return new Set(); }
  }, [cards.length]);

  const saveVotes = (set) => {
    try {
      localStorage.setItem("meme_votes", JSON.stringify(Array.from(set)));
    } catch (error) {
      console.error("Failed to save votes to localStorage:", error);
    }
  };

  const vote = (id) => {
    if (votedSet.has(id)) return;
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, votes: c.votes + 1 } : c)));
    votedSet.add(id);
    saveVotes(votedSet);
  };
  
  const formatBytes = (bytes) => {
    if (!bytes) return "";
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round((bytes / Math.pow(1024, i)) * 100) / 100} ${sizes[i]}`;
  };

  return (
    <div style={layout.page}>
      <main style={layout.main}>
        <div className="page-header">
          <div className="brand">
            <span>One For All · </span>
            <b>1FA</b>
          </div>
        </div>

        {/* ----- CARD GRID ----- */}
        <section className="cards-grid">
          {cards.length === 0 ? (
            [...Array(4)].map((_, i) => (
              <div className="scene" key={`placeholder-${i}`} style={{cursor: 'default'}}>
                <div className="card3d">
                  {/* Front: Image */}
                  <div className="face3d front">
                    {/** UPDATED: Added frame to placeholder card */}
                    <div className="frameArea" /> 
                    <img
                      className="frontImage"
                      src={`data:image/svg+xml;utf8,<?xml version='1.0' encoding='UTF-8'?><svg xmlns='http://www.w3.org/2000/svg' width='${W}' height='${H}'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='%231e293b'/><stop offset='100%' stop-color='%230f172a'/></linearGradient></defs><rect width='100%' height='100%' fill='url(%23g)'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%2394a3b8' font-family='Inter' font-size='14'>Your image will appear here</text></svg>`}
                      alt="placeholder"
                    />
                  </div>
                  {/* Back: Text */}
                  <div className="face3d back">
                    <div className="frameArea" />
                    <div className="back-text-content">
                        <div className="back-token-large">#0000</div>
                        <p className="back-message-main">Your message and vote button will appear here.</p>
                        <button className="voteBtn" disabled>🔥 0 Votes</button>
                    </div>
                  </div>
                  <div className="side left goldSide" />
                  <div className="side right goldSide" />
                  <div className="side top goldSide" />
                  <div className="side bottom goldSide" />
                </div>
              </div>
            ))
          ) : (
            cards.map((card) => (
              <div className="scene" key={card.id} onClick={() => setPreviewImageSrc(card.image)}>
                <div className="card3d">
                  {/* Front: User Image */}
                  <div className="face3d front">
                    {/** UPDATED: Added frame to user card */}
                    <div className="frameArea" />
                    <img src={card.image} className="frontImage" alt={card.token} />
                  </div>

                  {/* Back: User Text, Token, and Vote Button */}
                  <div className="face3d back">
                    <div className="frameArea" />
                    <div className="back-text-content">
                      <div className="back-token-large">{card.token}</div>
                      <p className="back-message-main">{card.message}</p>
                      <button
                        className="voteBtn"
                        onClick={(e) => {
                           e.stopPropagation();
                           vote(card.id);
                        }}
                        disabled={votedSet.has(card.id)}
                        title={votedSet.has(card.id) ? "You already voted" : "Vote"}
                      >
                        🔥 {card.votes} Vote{card.votes === 1 ? "" : "s"}
                      </button>
                    </div>
                  </div>

                  {/* Sides */}
                  <div className="side left goldSide" />
                  <div className="side right goldSide" />
                  <div className="side top goldSide" />
                  <div className="side bottom goldSide" />
                </div>
              </div>
            ))
          )}
        </section>
        
        {/* ... (Rest of the component is unchanged) ... */}
        <div className="upload-trigger-area">
          <button className="open-uploader-btn" onClick={() => setIsUploaderOpen(true)}>
            ✨ Create New Meme Card
          </button>
        </div>
      </main>

      {isUploaderOpen && (
        <div className="modal-backdrop" onClick={() => setIsUploaderOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setIsUploaderOpen(false)}>
                &times;
            </button>
            <div className="upload-container">
              <div className="upload-header">
                <div className="upload-title">📤 Upload New Image</div>
              </div>
              {imagePreview && (
                <div className="preview-container">
                  <img src={imagePreview} alt="Preview" className="preview-image" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: ".95rem" }}>{imageFile?.name || "Image"}</div>
                    <div className="subtle">{imageFile ? formatBytes(imageFile.size) : ""}</div>
                  </div>
                  <button className="remove-preview" onClick={removeSelected}>Remove</button>
                </div>
              )}
              <div className="message-area">
                <textarea
                  className="message-input"
                  placeholder={imagePreview ? "Add the text for the back of the card..." : "Select an image first to add a message"}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={!imagePreview}
                  maxLength={140}
                />
                <div className="subtle" style={{ textAlign: "right", marginTop: 8 }}>
                  {message.length}/140
                </div>
              </div>
              <div className="upload-footer">
                <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
                  <input
                    ref={fileInputRef}
                    id="file-upload"
                    className="file-input"
                    type="file"
                    accept="image/*"
                    onChange={onFileChange}
                  />
                  <label htmlFor="file-upload" className="file-label">📎 Choose Image</label>
                  {imageFile && <span className="file-name">{imageFile.name}</span>}
                </div>
                <button
                  className="upload-button"
                  onClick={upload}
                  disabled={!imagePreview || !message.trim()}
                >
                  🚀 Create Card
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {previewImageSrc && (
        <div className="preview-backdrop" onClick={() => setPreviewImageSrc(null)}>
            <img src={previewImageSrc} alt="Card Preview" className="preview-image-large" />
            <div className="preview-close-text">Click anywhere to close</div>
        </div>
      )}
    </div>
  );  
}