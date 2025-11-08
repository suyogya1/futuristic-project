import React, { useState, useEffect, useRef, useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

const API_BASE = "https://api.oneforall.fun";

export default function MemeBattlePage() {
  const { publicKey, connected } = useWallet();

  const [memes, setMemes] = useState([]);
  const [loadingMemes, setLoadingMemes] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [walletInput, setWalletInput] = useState("");
  const [ticker, setTicker] = useState("");
  const [caption, setCaption] = useState("");
  const [imageData, setImageData] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [votedSet, setVotedSet] = useState(new Set());
  const [lightboxMeme, setLightboxMeme] = useState(null);
  const [uploaderKey, setUploaderKey] = useState(0); // re-mount uploader to reset it

  const formRef = useRef(null);

  /** CRAZY title animation trigger */
  const [playTitle, setPlayTitle] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setPlayTitle(true), 60);
    return () => clearTimeout(t);
  }, []);

  /** Autofill wallet when connected */
  useEffect(() => {
    if (connected && publicKey) setWalletInput(publicKey.toString());
  }, [connected, publicKey]);

  /** Smooth scroll to form when opened */
  useEffect(() => {
    if (showForm && formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [showForm]);

  /** Load memes + votes */
  useEffect(() => {
    if (connected && publicKey) {
      loadMemes();
      loadVotes(publicKey.toString());
    } else {
      setMemes([]);
      setVotedSet(new Set());
    }
  }, [connected, publicKey]);

  async function loadMemes() {
    try {
      setLoadingMemes(true);
      const res = await fetch(`${API_BASE}/api/memes`);
      const data = await res.json();
      if (data.success) setMemes(data.memes);
    } catch (err) {
      console.error("Error loading memes:", err);
    } finally {
      setLoadingMemes(false);
    }
  }

  async function loadVotes(wallet) {
    try {
      const res = await fetch(`${API_BASE}/api/memes/votes?wallet=${wallet}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && Array.isArray(data.voted)) {
        setVotedSet(new Set(data.voted.map(String)));
      }
    } catch (err) {
      console.error("Error loading votes:", err);
    }
  }

  /** Submit meme */
  async function handleSubmitMeme() {
    setSubmitError("");
    setSubmitSuccess("");

    if (!walletInput.trim()) return setSubmitError("Wallet address is required");
    if (!ticker.trim()) return setSubmitError("Ticker is required");
    if (!caption.trim()) return setSubmitError("Caption/message is required");
    if (!imageData) return setSubmitError("Please choose an image");

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/memes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: walletInput.trim(),
          message: `${ticker.trim()}|||${caption.trim()}`,
          imageData,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setSubmitError(data.error || "Failed to submit meme");
      } else {
        setSubmitSuccess("✅ Meme posted!");
        setTicker("");
        setCaption("");
        setImageData("");
        setUploaderKey((k) => k + 1);
        await loadMemes();
      }
    } catch {
      setSubmitError("Network error submitting meme");
    } finally {
      setSubmitting(false);
    }
  }

  /** One-vote-per-wallet-per-meme (optimistic) */
  async function handleVote(memeId) {
    if (!connected || !publicKey) return;
    if (votedSet.has(String(memeId))) return;

    setMemes((prev) =>
      prev.map((m) => (m.id === memeId ? { ...m, votes: (m.votes || 0) + 1 } : m))
    );
    setVotedSet((prev) => new Set([...prev, String(memeId)]));

    try {
      const res = await fetch(`${API_BASE}/api/memes/${memeId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: publicKey.toString() }),
      });
      const data = await res.json();
      if (!data.success) {
        setMemes((prev) =>
          prev.map((m) => (m.id === memeId ? { ...m, votes: (m.votes || 1) - 1 } : m))
        );
        console.warn("Vote failed:", data.error);
      } else if (data.meme) {
        setMemes((prev) => prev.map((m) => (m.id === data.meme.id ? data.meme : m)));
      }
    } catch (err) {
      console.error("vote error:", err);
    }
  }

  /** Helper: robust vote count */
  const getVotes = (m) => Number(m.votes ?? m.votes_count ?? m.vote_count ?? 0) || 0;

  /** Sort by votes desc; tie-breaker: id desc if numeric */
  const memesSorted = useMemo(() => {
    const copy = [...memes];
    copy.sort((a, b) => {
      const av = getVotes(a);
      const bv = getVotes(b);
      if (bv !== av) return bv - av;
      const aid = Number(a.id);
      const bid = Number(b.id);
      if (!Number.isNaN(bid) && !Number.isNaN(aid)) return bid - aid;
      return 0;
    });
    return copy;
  }, [memes]);

  /** Uploader — single click, single read, no double-select */
  const MemeImageUploader = ({ value, onChange, disabled }) => {
    const inputRef = useRef(null);

    const handleChange = (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onloadend = () => {
        onChange(reader.result);
        if (inputRef.current) inputRef.current.value = "";
      };
      reader.readAsDataURL(file);
    };

    return (
      <label
        className="uploader"
        aria-label="Upload image"
        style={{
          borderRadius: 14,
          height: 190,
          border: value ? "1px solid rgba(0,255,200,.45)" : "1px solid rgba(255,255,255,.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: disabled ? "not-allowed" : "pointer",
          overflow: "hidden",
          position: "relative",
          userSelect: "none",
        }}
      >
        {value ? (
          <img
            src={value}
            alt="Preview"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 13 }}>📁 Click to upload image</div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleChange}
          disabled={disabled}
          style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
        />
      </label>
    );
  };

  /** Lightbox */
  const openLightbox = (meme) => setLightboxMeme(meme);
  const closeLightbox = () => setLightboxMeme(null);

  const shortWallet = (addr) =>
    !addr ? "unknown" : addr.length <= 10 ? addr : `${addr.slice(0, 4)}...${addr.slice(-4)}`;

  /** Split "ticker|||caption" */
  const splitMessage = (msg = "") => {
    const [t = "", c = ""] = msg.split("|||");
    return { ticker: t, caption: c };
    };

  return (
    <div style={styles.page}>
      {/* CRAZY header animation + 3D Card styles */}
      <style>{`
        /* ======= CRAZY TITLE ANIMATION ======= */
        .crazy-title {
          --title-size: clamp(28px, 7vw, 64px);
          --stroke: 2px;
          --glow: 0 0 24px rgba(0,255,225,.45), 0 0 48px rgba(0,120,255,.35);
          position: relative;
          display: inline-flex;
          gap: .02em;
          font-weight: 900;
          font-size: var(--title-size);
          line-height: 1.05;
          text-transform: uppercase;  
          letter-spacing: .06em;
          perspective: 600px;
          will-change: transform, filter, opacity;
          filter: drop-shadow(0 10px 24px rgba(0,0,0,.45));
          user-select: none;
        }
        
        .crazy-title span {
          display: inline-block;
          transform-origin: center -60px;
          opacity: 0;
          text-shadow: var(--glow);
          background: linear-gradient(90deg, #00ffe1 0%, #00b3ff 50%, #b388ff 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          -webkit-text-stroke: var(--stroke) rgba(0,0,0,.25);
          filter: saturate(1.2);
        }
        .crazy-title.play::before,
        .crazy-title.play::after{
          content: attr(data-text);
          position: absolute;
          inset: 0;
          pointer-events: none;
          font-weight: inherit;
          font-size: inherit;
          letter-spacing: inherit;
          text-transform: inherit;
          color: transparent;
          -webkit-text-stroke: var(--stroke) rgba(0,0,0,.28);
          text-shadow:
            2px 0 rgba(0,255,255,.55),
            -2px 0 rgba(255,0,128,.55);
          mix-blend-mode: screen;
          opacity: .0;
          animation: titleChroma 1.4s ease 0.8s 1 forwards, titleGlitch 2.1s steps(24) 1.2s 1;
        }
        .crazy-title.play::after{
          text-shadow:
            -2px 0 rgba(0,255,255,.5),
            2px 0 rgba(255,0,128,.5);
          animation-delay: 0.9s, 1.28s;
        }

        .crazy-title.play span {
          animation: letterBlast 900ms cubic-bezier(.2,.8,.05,1.0) forwards;
          animation-delay: calc(var(--i) * 60ms);
        }
        @keyframes letterBlast {
          0% {
            transform: translateY(60px) rotateX(85deg) rotateZ(-6deg) scale(.6);
            filter: blur(6px) saturate(.7) brightness(.9);
            opacity: 0;
          }
          55% {
            transform: translateY(-10px) rotateX(0deg) rotateZ(0deg) scale(1.06);
            filter: blur(0px) saturate(1.25) brightness(1.1);
            opacity: 1;
          }
          100% {
            transform: translateY(0) scale(1);
            filter: saturate(1);
            opacity: 1;
          }
        }

        .crazy-title.play {
          animation: titlePulse 2.8s ease-in-out 1.25s infinite alternate;
        }
        @keyframes titlePulse {
          0%   { text-shadow: 0 0 18px rgba(0,255,225,.35), 0 0 0 rgba(0,120,255,0); transform: translateZ(0); }
          100% { text-shadow: 0 0 32px rgba(0,255,225,.55), 0 0 22px rgba(0,120,255,.35); transform: translateZ(4px); }
        }

        @keyframes titleChroma {
          0%   { opacity: 0; transform: translateZ(30px) scale(1.02); }
          100% { opacity: .6; transform: translateZ(0)    scale(1.00); }
        }
        @keyframes titleGlitch {
          0%, 100% { clip-path: inset(0 0 0 0); transform: translate(0,0) skewX(0deg); opacity: .0; }
          5%  { clip-path: inset(10% 0 0 0); transform: translate(2px,-1px) skewX(2deg); opacity: .35; }
          10% { clip-path: inset(0 0 12% 0); transform: translate(-2px,1px) skewX(-2deg); opacity: .25; }
          15% { clip-path: inset(6% 0 0 0); transform: translate(1px,0); opacity: .3; }
          20% { clip-path: inset(0 0 8% 0); transform: translate(-1px,0); opacity: .25; }
          30% { clip-path: inset(12% 0 0 0); transform: translate(0,1px); opacity: .35; }
          45% { clip-path: inset(0 0 10% 0); transform: translate(-1px,-1px); opacity: .2; }
          60% { clip-path: inset(8% 0 0 0); transform: translate(1px,0); opacity: .25; }
          75% { clip-path: inset(0 0 14% 0); transform: translate(0,1px); opacity: .2; }
          90% { clip-path: inset(10% 0 0 0); transform: translate(-1px,0); opacity: .15; }
        }

        .crazy-title.play .scanline {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            linear-gradient(
              180deg,
              rgba(255,255,255,0) 0%,
              rgba(255,255,255,.12) 45%,
              rgba(255,255,255,0) 60%
            );
          mix-blend-mode: screen;
          transform: translateY(-120%);
          animation: scanSweep 1.25s ease-out .65s 1 forwards;
          filter: blur(.6px);
        }
        @keyframes scanSweep {
          to { transform: translateY(120%); }
        }

        .crazy-subtitle { opacity: 0; transform: translateY(12px); }
        .crazy-subtitle.play { animation: subFade 700ms ease 1.1s forwards; }
        @keyframes subFade { to { opacity: 1; transform: translateY(0); } }

        @media (prefers-reduced-motion: reduce) {
          .crazy-title.play span,
          .crazy-title.play,
          .crazy-title.play::before,
          .crazy-title.play::after,
          .crazy-title.play .scanline,
          .crazy-subtitle.play {
            animation: none !important;
            transition: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }

        /* ======= 3D NFT CARD STYLES ======= */
        .nft-scene { width: 100%; height: 360px; perspective: 1200px; cursor: pointer; }
        .nft-card {
          --thickness: 18px;
          position: relative; width: 100%; height: 100%; transform-style: preserve-3d;
          animation: nft-spin 20s linear infinite; border-radius: 16px;
          transition: transform .6s ease, box-shadow .3s ease, border-color .3s ease;
          box-shadow: 0 20px 40px rgba(0,0,0,.45), 0 0 0 1px rgba(0,255,255,.08), inset 0 0 0 1px rgba(255,255,255,.03);
          border: 1px solid rgba(0,255,255,.12);
        }
        .nft-card::before, .nft-card::after{
          content:""; position:absolute; inset:0; border-radius:16px;
          transform: translateZ(calc(var(--thickness) * -0.6));
          background: radial-gradient(120% 120% at 50% 10%, rgba(0,255,255,.12), rgba(0,0,0,.6));
          filter: blur(.2px); pointer-events:none;
        }

        .nft-scene:hover .nft-card {
          animation-play-state: paused; transform: rotateY(12deg) translateY(-3px);
          box-shadow: 0 30px 60px rgba(0,0,0,.55), 0 0 0 1px rgba(0,255,255,.12), inset 0 0 0 1px rgba(255,255,255,.04);
        }
        .nft-face {
          position: absolute; inset: 0; backface-visibility: hidden; border-radius: 16px; overflow: hidden;
          display: flex; flex-direction: column; justify-content: space-between;
          transform: translateZ(calc(var(--thickness) / 2));
        }
        .nft-front {
          background:
            radial-gradient(120% 100% at 50% 0%, rgba(0,255,200,.07), transparent 40%),
            radial-gradient(120% 120% at 50% 120%, rgba(0,120,255,.08), transparent 40%),
            linear-gradient(180deg, #06131c 0%, #030a12 100%);
          border: 1px solid rgba(0,255,255,.12);
        }
        .nft-back {
          background:
            radial-gradient(90% 60% at 50% 0%, rgba(0,255,200,.10), transparent 60%),
            linear-gradient(180deg, #041019 0%, #02070f 100%);
          transform: rotateY(180deg) translateZ(calc(var(--thickness) / 2));
          border: 1px solid rgba(0,255,255,.15);
          padding: 0; color: rgba(255,255,255,.92); display: flex; align-items: center; justify-content: center;
        }
        .nft-back-inner {
          width: 100%; padding: 22px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 6px; transform: translateY(-12%);
        }
        .nft-header {
          padding: 10px 14px; border-bottom: 1px solid rgba(255,255,255,.08);
          background: linear-gradient(90deg, rgba(0,255,255,.16), rgba(0,120,255,.16));
          text-align: center; color: #00ffe1; font-size: 13px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase;
        }
        .nft-image-wrap { flex-grow: 1; display: flex; align-items: center; justify-content: center; overflow: hidden; border-bottom: 1px solid rgba(255,255,255,.08); background: radial-gradient(70% 70% at 50% 50%, rgba(0,255,255,.05), rgba(0,0,0,0)); }
        .nft-image { width: 100%; height: 100%; object-fit: cover; transition: transform .35s ease; }
        .nft-scene:hover .nft-image { transform: scale(1.05); }
        .nft-footer { padding: 12px 14px 14px; display: flex; gap: 10px; flex-direction: column; }
        .nft-meta { display: grid; grid-template-columns: 1fr auto; align-items: center; font-size: 12px; }
        .nft-wallet { color: #00ffe1; font-weight: 600; letter-spacing: .02em; }
        .nft-votes { color: rgba(255,255,255,.78); font-weight: 600; }
        .nft-vote-btn { border: 0; border-radius: 10px; padding: 10px 12px; background: linear-gradient(135deg,#00ffe1,#0077ff); color: #000; font-weight: 700; font-size: 12px; box-shadow: 0 0 14px rgba(0,255,255,.28); }
        .nft-caption-title { font-weight: 800; color: #00ffe1; letter-spacing: .02em; font-size: 16px; margin-bottom: 2px; text-align: center; }
        .nft-caption-body { color: rgba(255,255,255,.95); line-height: 1.6; font-size: 14px; word-break: break-word; white-space: pre-wrap; text-align: center; max-width: 85%; }
        @keyframes nft-spin { from { transform: rotateY(0deg); } to { transform: rotateY(360deg); } }

        .rank-badge { position: absolute; top: 8px; right: 8px; z-index: 5; padding: 6px 10px; border-radius: 999px; font-weight: 800; font-size: 12px; letter-spacing: .06em; border: 1px solid rgba(255,255,255,.12); backdrop-filter: blur(6px); box-shadow: 0 6px 16px rgba(0,0,0,.35); }
        .rank-badge.gold   { background: linear-gradient(135deg, rgba(250,204,21,.85), rgba(253,224,71,.7)); color: #1f1f1f; }
        .rank-badge.silver { background: linear-gradient(135deg, rgba(209,213,219,.9), rgba(229,231,235,.75)); color: #111827; }
        .rank-badge.thirdlast { background: linear-gradient(135deg, rgba(244,63,94,.9), rgba(251,113,133,.75)); color: #111827; }
        .nft-card.rank-1 { border-color: rgba(250,204,21,.75); box-shadow: 0 24px 60px rgba(250,204,21,.22), 0 0 0 1px rgba(250,204,21,.35), inset 0 0 0 1px rgba(255,255,255,.05); }
        .nft-card.rank-2 { border-color: rgba(209,213,219,.7); box-shadow: 0 24px 60px rgba(156,163,175,.20), 0 0 0 1px rgba(209,213,219,.3), inset 0 0 0 1px rgba(255,255,255,.05); }
        .nft-card.rank-3last { border-color: rgba(244,63,94,.75); box-shadow: 0 24px 60px rgba(244,63,94,.22), 0 0 0 1px rgba(244,63,94,.35), inset 0 0 0 1px rgba(255,255,255,.05); }
        /* === Smoother snap-to-front on hover === */
      .nft-scene .nft-card {
        transform: translateZ(0);                  /* GPU hint to avoid jitter */
        transition: transform 950ms cubic-bezier(.16,1,.3,1),
                    box-shadow 450ms ease,
                    border-color 450ms ease,
                    filter 450ms ease;
        will-change: transform;
        transform-origin: center center;
      }
        
      .nft-scene:hover .nft-card {
        /* keep current frame so the transition starts from where the spin paused */
        animation-play-state: paused !important;
        /* glide to the front with a slight lift & micro-scale */
        transform: rotateY(0deg) translateY(-3px) scale(1.01) !important;
      }

      /* ensure the front face is what you see while hovered */
      .nft-scene .nft-face { 
        backface-visibility: hidden; 
        -webkit-backface-visibility: hidden;
      }
      .nft-scene:hover .nft-face.nft-front { backface-visibility: visible; }
      .nft-scene:hover .nft-face.nft-back  { backface-visibility: hidden; }

      `}</style>

      <div style={styles.headerRow}>
        <div style={styles.titleCell}>
          {/* CRAZY animated title */}
          <div
            className={`crazy-title ${playTitle ? "play" : ""}`}
            data-text="Meme Battle"
            role="heading"
            aria-level={1}
          >
            {"Meme Battle".split("").map((ch, i) => (
              <span key={i} style={{ ["--i"]: i }}>
                {ch === " " ? "\u00A0" : ch}
              </span>
            ))}
            <i className="scanline" aria-hidden="true" />
          </div>
        </div>

        <button
          style={styles.postButton}
          onClick={() => setShowForm(!showForm)}
          disabled={!connected}
        >
          {showForm ? "Close" : "Create Meme"}
        </button>
      </div>

      {!connected ? (
        <div style={styles.connectNotice}>🚀 Connect your wallet to view and post memes.</div>
      ) : (
        <>
          {/* FORM */}
          <div
            ref={formRef}
            style={{
              ...styles.formWrapper,
              maxHeight: showForm ? "1000px" : "0px",
              opacity: showForm ? 1 : 0,
              padding: showForm ? "20px" : "0px 20px",
            }}
          >
            <div style={styles.formInner}>
              <div style={styles.formTitle}>Create Your Meme</div>
              <div style={styles.formGrid}>
                <label style={styles.labelBlock}>
                  <div style={styles.labelTxt}>Wallet Address</div>
                  <input style={styles.inputField} value={walletInput} disabled />
                </label>

                <label style={styles.labelBlock}>
                  <div style={styles.labelTxt}>Ticker</div>
                  <input
                    style={styles.inputField}
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value)}
                  />
                </label>

                <label style={styles.labelBlock}>
                  <div style={styles.labelTxt}>Caption</div>
                  <textarea
                    style={{ ...styles.inputField, height: 120, resize: "vertical", lineHeight: 1.6 }}
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Write something punchy. Newlines are preserved."
                  />
                </label>

                <label style={styles.labelBlock}>
                  <div style={styles.labelTxt}>Meme Image</div>
                  <MemeImageUploader
                    key={uploaderKey}
                    value={imageData}
                    onChange={setImageData}
                    disabled={!connected}
                  />
                </label>

                {submitError && <div style={styles.errorBox}>{submitError}</div>}
                {submitSuccess && <div style={styles.successBox}>{submitSuccess}</div>}

                <button
                  style={styles.submitBtn}
                  disabled={!connected || submitting}
                  onClick={handleSubmitMeme}
                >
                  {submitting ? "Submitting..." : "Submit Meme"}
                </button>
              </div>
            </div>
          </div>

          {/* FEED */}
          <div style={styles.feedWrapper}>
            {loadingMemes ? (
              <div style={styles.loadingText}>Loading memes...</div>
            ) : memesSorted.length === 0 ? (
              <div style={styles.loadingText}>No memes yet. Be first!</div>
            ) : (
              <div style={styles.memeGrid}>
                {memesSorted.map((meme, idx) => {
                  const { ticker, caption } = splitMessage(meme.message);
                  const alreadyVoted = votedSet.has(String(meme.id));
                  const imgSrc = meme.imageData || meme.image_data;

                  const isTop1 = idx === 0;
                  const isTop2 = idx === 1;
                  const isThirdLast = idx === memesSorted.length - 3;

                  const rankClass = isTop1
                    ? "rank-1"
                    : isTop2
                    ? "rank-2"
                    : isThirdLast
                    ? "rank-3last"
                    : "";

                  return (
                    <div key={meme.id} style={styles.memeCardOuter}>
                      <div className="nft-scene" onClick={() => openLightbox(meme)}>
                        <div className={`nft-card ${rankClass}`}>
                          {isTop1 && <div className="rank-badge gold">🥇 1st</div>}
                          {isTop2 && <div className="rank-badge silver">🥈 2nd</div>}
                          {isThirdLast && <div className="rank-badge thirdlast">3rd Last</div>}

                          {/* FRONT */}
                          <div className="nft-face nft-front">
                            <div className="nft-header">{ticker || "Untitled"}</div>
                            <div className="nft-image-wrap">
                              <img src={imgSrc} alt="meme" className="nft-image" />
                            </div>
                            <div className="nft-footer">
                              <div className="nft-meta">
                                <span className="nft-wallet">
                                  {shortWallet(meme.walletAddress || meme.wallet_address)}
                                </span>
                                <span className="nft-votes">🔥 {getVotes(meme)}</span>
                              </div>
                              <button
                                className="nft-vote-btn"
                                disabled={alreadyVoted}
                                style={{
                                  opacity: alreadyVoted ? 0.55 : 1,
                                  cursor: alreadyVoted ? "not-allowed" : "pointer",
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleVote(meme.id);
                                }}
                              >
                                {alreadyVoted ? "Voted" : "Vote"}
                              </button>
                            </div>
                          </div>

                          {/* BACK */}
                          <div className="nft-face nft-back">
                            <div className="nft-back-inner">
                              <div className="nft-caption-title">Caption</div>
                              <div className="nft-caption-body">{caption || "No caption"}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* LIGHTBOX */}
      {lightboxMeme && (
        <div style={styles.lightboxBackdrop} onClick={closeLightbox}>
          <div
            style={{
              background: "rgba(0,0,0,0.94)",
              borderRadius: 14,
              padding: 20,
              maxWidth: "90vw",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              overflow: "auto",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxMeme.imageData || lightboxMeme.image_data}
              alt="large"
              style={{
                width: "100%",
                maxHeight: "60vh",
                objectFit: "contain",
                borderRadius: 12,
                marginBottom: 12,
              }}
            />
            <div style={{ color: "#00ffe1", fontWeight: 700, letterSpacing: ".04em" }}>
              {splitMessage(lightboxMeme.message).ticker}
            </div>
            <div
              style={{
                color: "rgba(255,255,255,.92)",
                marginTop: 8,
                textAlign: "center",
                lineHeight: 1.7,
                whiteSpace: "pre-wrap",
              }}
            >
              {splitMessage(lightboxMeme.message).caption}
            </div>
            <button style={styles.lightboxClose} onClick={closeLightbox}>
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- STYLES ---------------- */
const styles = {
  page: {
    minHeight: "100vh",
    background: "transparent",
    color: "#fff",
    fontFamily: "Inter, system-ui, sans-serif",
    padding: "32px 16px 80px",
    maxWidth: "1400px",
    margin: "0 auto",
  },

  // CHANGED: grid with a centered title cell and a right-aligned button
  headerRow: {
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    alignItems: "center",
    marginBottom: 16,
    gap: 16,
    position: "relative",
  },
  // NEW: place title in the middle column and center it
  titleCell: {
    gridColumn: 2,
    justifySelf: "center",
  },

  subtitle: { fontSize: 13, color: "rgba(255,255,255,0.65)", marginTop: 8 },
  postButton: {
    gridColumn: 3,
    justifySelf: "end",
    border: 0,
    borderRadius: 10,
    fontWeight: 700,
    fontSize: 13,
    padding: "10px 14px",
    background: "linear-gradient(135deg, #00ffe1, #0077ff)",
    color: "#000",
    height: 42,
    alignSelf: "center",
  },
  connectNotice: {
    textAlign: "center",
    padding: "40px 0",
    fontSize: 16,
    color: "rgba(255,255,255,0.85)",
  },
  formWrapper: {
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16,
    marginBottom: 24,
    overflow: "hidden",
    transition: "max-height .35s ease, opacity .25s ease, padding .25s ease",
  },
  formInner: { display: "flex", flexDirection: "column", gap: 16 },
  formTitle: { fontSize: 14, fontWeight: 700, letterSpacing: ".02em" },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
  },
  labelBlock: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 12,
    padding: 12,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  labelTxt: { fontSize: 11, color: "rgba(255,255,255,0.6)", letterSpacing: ".02em" },
  inputField: {
    background: "rgba(0,0,0,0.5)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 8,
    padding: "10px 12px",
    fontSize: 13,
    color: "#fff",
    outline: "none",
  },
  errorBox: {
    gridColumn: "1 / span 2",
    background: "rgba(255,0,76,0.18)",
    border: "1px solid rgba(255,0,76,0.4)",
    fontSize: 12,
    padding: "8px 12px",
    borderRadius: 10,
  },
  successBox: {
    gridColumn: "1 / span 2",
    background: "rgba(0,255,170,0.18)",
    border: "1px solid rgba(0,255,170,0.4)",
    fontSize: 12,
    padding: "8px 12px",
    borderRadius: 10,
  },
  submitBtn: {
    gridColumn: "1 / span 2",
    border: 0,
    borderRadius: 10,
    fontWeight: 700,
    fontSize: 13,
    padding: "12px 16px",
    background: "linear-gradient(135deg,#00ffe1,#0077ff)",
    color: "#000",
  },
  feedWrapper: { flex: "1 1 auto", minHeight: "50vh" },
  loadingText: { textAlign: "center", padding: "40px 0" },
  memeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: 24,
  },
  memeCardOuter: { position: "relative" },
  lightboxBackdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.85)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
  lightboxClose: {
    position: "absolute",
    top: 10,
    right: 10,
    border: 0,
    borderRadius: 8,
    padding: "8px 10px",
    background: "rgba(255,255,255,0.12)",
    color: "#fff",
    cursor: "pointer",
  },
};
