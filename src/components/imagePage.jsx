import React, { useState, useEffect, useRef } from "react";

const THICK = 28;
const W = 250;
const H = 300;

// Styles
const css =`  body { background:#07090e; color:#e5e7eb; font-family: ui-sans-serif, system-ui }
.scene { perspective:1600px; display:flex; justify-content:center; margin-top:60px }
.card3d { position:relative; width:${W}px; height:${H}px; border-radius:20px; transform-style:preserve-3d; animation: spinY 8s linear infinite; box-shadow: 0 40px 100px rgba(0,0,0,.55) }

@keyframes spinY { from{ transform: rotateY(0deg) } to{ transform: rotateY(360deg) } }

.face3d { position:absolute; inset:0; border-radius:20px; backface-visibility:hidden; overflow:hidden; background:#0b0f15 }
.front { transform: translateZ(${THICK/2}px); position:relative; }
.back { transform: rotateY(180deg) translateZ(${THICK/2}px); display:flex; align-items:center; justify-content:center; font-size:28px; font-weight:900; background:radial-gradient(circle,#111,#000); }

/* Placeholder content area that feels like a photo under glass */
.frameArea { position:absolute; inset:10px; border-radius:14px; background:
  linear-gradient(160deg, #101622, #0d1420 40%, #0b1220 60%),
  radial-gradient(120% 80% at 100% 0%, rgba(255,255,255,.06), transparent 60%);
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.06), inset 0 -18px 38px rgba(0,0,0,.45);
}

/* Strong Glass and Reflection */
.glassOverlay { position:absolute; inset:0; border-radius:20px; background:linear-gradient(145deg, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0.22) 48%, rgba(0,0,0,0.42) 100%); mix-blend-mode:screen; pointer-events:none; box-shadow: inset 0 1px 0 rgba(255,255,255,.45), inset 0 -28px 52px rgba(0,0,0,.5); }
.reflection { position:absolute; inset:0; border-radius:20px; background:linear-gradient(75deg, transparent 18%, rgba(255,255,255,0.98) 48%, transparent 78%); mix-blend-mode:overlay; animation: reflect 7.5s linear infinite; pointer-events:none; filter: blur(1.2px) saturate(115%); }
.reflection.strong { background:linear-gradient(75deg, transparent 20%, rgba(255,255,255,1) 46%, transparent 74%); filter: blur(1.4px) saturate(120%); }

@keyframes reflect { from{ transform: translateX(-160%) rotateY(0deg); } to{ transform: translateX(160%) rotateY(360deg); } }

.voteCount { position:absolute; top:10px; right:12px; padding:6px 10px; border-radius:999px; background:rgba(0,0,0,.45); border:1px solid rgba(255,255,255,.18); backdrop-filter: blur(6px); font-weight:700; font-size:14px; color:#ffd700; text-shadow:0 0 8px rgba(255,215,0,.6); }

/* Vote button (bottom center) */
.voteBtn { position:absolute; left:50%; bottom:12px; transform: translateX(-50%); padding:9px 18px; border-radius:999px; border:1px solid rgba(255,215,0,.42); background: linear-gradient(180deg, #1f2937, #0b1220); color:#ffe08a; font-weight:800; letter-spacing:.02em; cursor:pointer; box-shadow: 0 4px 20px rgba(255,215,0,.28), inset 0 0 14px rgba(255,215,0,.1); transition: transform .15s ease, box-shadow .2s ease, filter .2s ease; }
.voteBtn:hover { transform: translateX(-50%) translateY(-2px) scale(1.05); box-shadow: 0 8px 30px rgba(255,215,0,.36), inset 0 0 18px rgba(255,215,0,.14); filter: brightness(1.08); }
.voteBtn:active { transform: translateX(-50%) translateY(0) scale(.98); }
.voteBtn::before { content:""; position:absolute; inset:-2px; border-radius:inherit; background: conic-gradient(from 0deg, #fef08a, #facc15, #f59e0b, #b45309, #fef08a); filter: blur(6px); opacity:.35; z-index:-1; animation: ringPulse 2.4s linear infinite; }
@keyframes ringPulse { 0%{ transform: rotate(0deg) } 100%{ transform: rotate(360deg) } }

/* GOLD RIMS */
.side { position:absolute; opacity:.98 }
.side.left { width:${THICK}px; height:${H}px; left:calc(${W/2}px - ${THICK/2}px); top:0; transform: rotateY(90deg) translateZ(${W/2}px) }
.side.right{ width:${THICK}px; height:${H}px; left:calc(${W/2}px - ${THICK/2}px); top:0; transform: rotateY(90deg) translateZ(${-W/2}px) }
.side.top  { width:${W}px; height:${THICK}px; left:0; top:calc(${H/2}px - ${THICK/2}px); transform: rotateX(90deg) translateZ(${H/2}px) }
.side.bottom{ width:${W}px; height:${THICK}px; left:0; top:calc(${H/2}px - ${THICK/2}px); transform: rotateX(90deg) translateZ(${-H/2}px) }
.goldSide { background:linear-gradient(180deg,#fef08a 0%,#facc15 40%,#f59e0b 70%,#b45309 100%); box-shadow: inset 0 0 4px rgba(255,255,255,.4), 0 0 16px rgba(255,215,0,.25); }

.ticker { font-size:28px; font-weight:900; background:linear-gradient(120deg,#fef08a,#f59e0b); -webkit-background-clip:text; color:transparent; text-shadow:0 0 18px rgba(250,204,21,.22); }
`

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', system-ui, sans-serif; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); color: #e2e8f0; min-height: 100vh; }
  .image-page { min-height: 100vh; padding: 40px 20px; }
  .page-header { text-align: center; margin-bottom: 40px; }
  .page-title { font-size: 2.5rem; font-weight: 700; margin-bottom: 10px; background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #f472b6 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
  .page-subtitle { color: #94a3b8; font-size: 1.1rem; }
  .gallery-container { max-width: 1400px; margin: 0 auto 40px; }
  .gallery-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; margin-bottom: 40px; }
  .image-card { background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(148, 163, 184, 0.1); border-radius: 12px; overflow: hidden; transition: all 0.3s ease; backdrop-filter: blur(10px); }
  .image-card:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3); border-color: rgba(96, 165, 250, 0.3); }
  .image-wrapper { position: relative; width: 100%; padding-bottom: 75%; overflow: hidden; background: linear-gradient(135deg, #1e293b, #334155); }
  .uploaded-image { position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; cursor: pointer; transition: transform 0.3s ease; }
  .uploaded-image:hover { transform: scale(1.05); }
  .image-info { padding: 16px; }
  .image-message { color: #e2e8f0; margin-bottom: 12px; font-size: 0.95rem; line-height: 1.5; word-wrap: break-word; }
  .image-actions { display: flex; gap: 8px; align-items: center; }
  .action-button { padding: 6px 12px; border: none; border-radius: 6px; font-size: 0.875rem; font-weight: 500; cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; gap: 4px; }
  .react-button { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); }
  .react-button:hover:not(:disabled) { background: rgba(239, 68, 68, 0.2); transform: scale(1.05); }
  .react-butto  n.reacted { background: rgba(239, 68, 68, 0.3); color: #fbbf24; }
  .vote-button { background: rgba(59, 130, 246, 0.1); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.2); }
  .vote-button:hover:not(:disabled) { background: rgba(59, 130, 246, 0.2); transform: scale(1.05); }
  .vote-button:disabled { opacity: 0.5; cursor: not-allowed; }
  .upload-container { max-width: 800px; margin: 0 auto; background: rgba(30, 41, 59, 0.8); border: 1px solid rgba(148, 163, 184, 0.2); border-radius: 16px; backdrop-filter: blur(10px); overflow: hidden; }
  .upload-header { padding: 16px 20px; background: rgba(15, 23, 42, 0.5); border-bottom: 1px solid rgba(148, 163, 184, 0.1); }
  .upload-title { font-size: 1.1rem; font-weight: 600; color: #cbd5e1; }
  .message-area { padding: 20px; }
  .message-input { width: 100%; min-height: 100px; padding: 12px; background: rgba(15, 23, 42, 0.5); border: 1px solid rgba(148, 163, 184, 0.2); border-radius: 8px; color: #e2e8f0; font-size: 1rem; font-family: inherit; resize: vertical; transition: all 0.2s ease; }
  .message-input:focus { outline: none; border-color: rgba(96, 165, 250, 0.5); background: rgba(15, 23, 42, 0.7); }
  .message-input:disabled { opacity: 0.5; cursor: not-allowed; }
  .upload-footer { padding: 16px 20px; background: rgba(15, 23, 42, 0.3); border-top: 1px solid rgba(148, 163, 184, 0.1); display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
  .file-input-wrapper { position: relative; display: flex; align-items: center; gap: 12px; flex: 1; }
  .file-input { display: none; }
  .file-label { padding: 8px 16px; background: rgba(148, 163, 184, 0.1); border: 1px solid rgba(148, 163, 184, 0.2); border-radius: 8px; cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; gap: 8px; font-size: 0.95rem; color: #94a3b8; }
  .file-name { color: #60a5fa; font-size: 0.9rem; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .upload-button { padding: 10px 24px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); border: none; border-radius: 8px; color: white; font-weight: 600; cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; gap: 8px; }
  .upload-button:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(59, 130, 246, 0.3); }
  .upload-button:disabled { opacity: 0.5; cursor: not-allowed; }
  .modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.9); display: flex; justify-content: center; align-items: center; z-index: 1000; padding: 20px; animation: fadeIn 0.3s ease; }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  .modal-content { position: relative; max-width: 90vw; max-height: 90vh; animation: scaleIn 0.3s ease; }
  @keyframes scaleIn { from { transform: scale(0.9); } to { transform: scale(1); } }
  .modal-image { width: 100%; height: auto; max-height: 85vh; object-fit: contain; border-radius: 12px; }
  .modal-close { position: absolute; top: -40px; right: 0; background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 20px; transition: all 0.2s ease; }
  .modal-close:hover { background: rgba(255, 255, 255, 0.2); transform: scale(1.1); }
  .empty-state { text-align: center; padding: 60px 20px; color: #64748b; }
  .empty-state-icon { font-size: 4rem; margin-bottom: 20px; opacity: 0.5; }
  .empty-state-text { font-size: 1.1rem; }
  .preview-container { margin: 16px 20px 0; padding: 12px; background: rgba(96, 165, 250, 0.1); border: 1px solid rgba(96, 165, 250, 0.2); border-radius: 8px; display: flex; align-items: center; gap: 12px; }
  .preview-image { width: 60px; height: 60px; object-fit: cover; border-radius: 6px; }
  .preview-info { flex: 1; }
  .preview-name { font-size: 0.95rem; color: #e2e8f0; margin-bottom: 4px; }
  .preview-size { font-size: 0.85rem; color: #94a3b8; }
  .remove-preview { padding: 6px 12px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 6px; color: #ef4444; cursor: pointer; transition: all 0.2s ease; }
  // .remove-preview:hover { background: rgba(239, 68, 68, 0.2); }
  page: { minHeight: "100vh", background: "#07090e" },
  header: { height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 18px", background: "rgba(0,0,0,.45)", borderBottom: "1px solid rgba(255,255,255,.12)" },
  logo: { width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg,#facc15,#d97706)", display: "grid", placeItems: "center", fontWeight: 900, color: "#0b1220" },
  main: { maxWidth: 980, margin: "0 auto", padding: "18px" },
  footer: { padding: "14px 18px", borderTop: "1px solid rgba(255,255,255,.12)", background: "rgba(0,0,0,.35)", textAlign: "center", opacity: 0.85 }
  
 `;

// Add styles to document
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default function ImagePage() {
  const [votes, setVotes] = useState(120);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [message, setMessage] = useState("");
  const [sentImages, setSentImages] = useState([]);
  const [expandedImage, setExpandedImage] = useState(null);
  const fileInputRef = useRef(null);

  const MAX_IMAGES = 10; // Set a maximum number of images to be stored

  // Load saved images from localStorage on mount
  useEffect(() => {
    const savedImages = localStorage.getItem('sentImages');
    if (savedImages) {
      try {
        const parsedImages = JSON.parse(savedImages);
        // Limit the number of images to MAX_IMAGES
        setSentImages(parsedImages.slice(0, MAX_IMAGES));
      } catch (e) {
        console.error('Error loading saved images:', e);
      }
    }
  }, []);

  // Save images to localStorage whenever they change
  useEffect(() => {
    if (sentImages.length > 0) {
      // Only save if the number of images is within limit
      localStorage.setItem('sentImages', JSON.stringify(sentImages));
    }
  }, [sentImages]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert("Image size should be less than 5MB");
        return;
      }
      
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = () => {
    if (imagePreview && message.trim()) {
      const newImage = {
        id: Date.now(),
        image: imagePreview,
        message: message.trim(),
        votes: 0,
        reactions: [],
        timestamp: new Date().toISOString(),
      };
      
      // Add the new image to the list, making sure not to exceed the MAX_IMAGES limit
      const updatedImages = [newImage, ...sentImages].slice(0, MAX_IMAGES);
      setSentImages(updatedImages);
      
      // Reset form
      setMessage("");
      setImageFile(null);
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Show success feedback
      const successMessage = document.createElement('div');
      successMessage.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 10px 20px rgba(0,0,0,0.3);
        z-index: 1000;
        animation: slideIn 0.3s ease;
      `;
      successMessage.textContent = "Image uploaded successfully!";
      document.body.appendChild(successMessage);
      
      setTimeout(() => {
        successMessage.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => document.body.removeChild(successMessage), 300);
      }, 3000);
    } else if (!imagePreview) {
      alert("Please select an image first");
    } else if (!message.trim()) {
      alert("Please add a message with your image");
    }
  };

  const handleVote = (id) => {
    setSentImages(sentImages.map(img => 
      img.id === id ? { ...img, votes: img.votes + 1 } : img
    ));
  };

  const handleReact = (id) => {
    setSentImages(sentImages.map(img => 
      img.id === id 
        ? { ...img, reactions: [...img.reactions, { emoji: "❤️", timestamp: Date.now() }] }
        : img
    ));
  };

  const handleExpandImage = (imageSrc) => {
    setExpandedImage(imageSrc);
  };

  const handleCloseExpandedImage = () => {
    setExpandedImage(null);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
      <div style={styles.page}>
      <style>{css}</style>


      <main style={styles.main}>
        <div className="stage">
          <div className="scene">
            <div className="card3d spinY">
              {/* FRONT FACE (glass-framed placeholder) */}
              <div className="face3d front">
                <div className="frameArea" aria-label="Meme placeholder" />
                {/* Strong Glass and Reflection */}
                <div className="glassOverlay" />
                <div className="reflection strong" />
                <div className="voteCount">🔥 {votes} Votes</div>
                <button
                  className="voteBtn"
                  onClick={() => setVotes((v) => v + 1)}
                  aria-label="Vote for this meme"
                >
                  Vote
                </button>
              </div>

              {/* BACK FACE */}
              <div className="face3d back">
                <div className="ticker">$MEMECOIN</div>
              </div>

              {/* GOLDEN SIDES */}
              <div className="side left goldSide" />
              <div className="side right goldSide" />
              <div className="side top goldSide" />
              <div className="side bottom goldSide" />
            </div>
          </div>
        </div>
      </main>

    {/* <div className="image-page">
      <div className="page-header">
        <h1 className="page-title">Upload and React to Images</h1>
        <p className="page-subtitle">Share your moments with the community</p>
      </div>

      <div className="gallery-container">
        {sentImages.length > 0 ? (
          <div className="gallery-grid">
            {sentImages.map((imageData) => (
              <div key={imageData.id} className="image-card">
                <div className="image-wrapper">
                  <img
                    src={imageData.image}
                    alt="Uploaded"
                    className="uploaded-image"
                    onClick={() => handleExpandImage(imageData.image)}
                    loading="lazy"
                  />
                </div>
                <div className="image-info">
                  <p className="image-message">{imageData.message}</p>
                  <div className="image-actions">
                    <button
                      onClick={() => handleReact(imageData.id)}
                      className={`action-button react-button ${imageData.reactions.length > 0 ? 'reacted' : ''}`}
                      disabled={imageData.reactions.length > 0}
                    >
                      <span>❤️</span>
                      <span>{imageData.reactions.length || 'React'}</span>
                    </button>
                    <button
                      onClick={() => handleVote(imageData.id)}
                      className="action-button vote-button"
                      disabled={imageData.votes > 0}
                    >
                      <span>👍</span>
                      <span>{imageData.votes || 'Vote'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">📷</div>
            <p className="empty-state-text">No images uploaded yet. Be the first to share!</p>
          </div>
        )}
      </div> */}

      <div className="upload-container">
        <div className="upload-header">
          <h2 className="upload-title">📤 Upload New Image</h2>
        </div>
        
        {imagePreview && (
          <div className="preview-container">
            <img src={imagePreview} alt="Preview" className="preview-image" />
            <div className="preview-info">
              <div className="preview-name">{imageFile?.name || 'Image'}</div>
              <div className="preview-size">{imageFile ? formatFileSize(imageFile.size) : ''}</div>
            </div>
            <button onClick={handleRemoveImage} className="remove-preview">
              Remove
            </button>
          </div>
        )}
        
        <div className="message-area">
          <textarea
            placeholder={imagePreview ? "Add a message to your image..." : "Select an image first to add a message"}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="message-input"
            disabled={!imagePreview}
            maxLength={500}
          />
          <div style={{ textAlign: 'right', marginTop: '8px', fontSize: '0.85rem', color: '#64748b' }}>
            {message.length}/500
          </div>
        </div>

        <div className="upload-footer">
          <div className="file-input-wrapper">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="file-input"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="file-label">
              <span>📎</span>
              <span>Choose Image</span>
            </label>
            {imageFile && (
              <span className="file-name">{imageFile.name}</span>
            )}
          </div>
          
          <button 
            onClick={handleUpload} 
            className="upload-button" 
            disabled={!imagePreview || !message.trim()}
          >
            <span>🚀</span>
            <span>Upload</span>
          </button>
        </div>
      </div>

      {expandedImage && (
        <div className="modal" onClick={handleCloseExpandedImage}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <img src={expandedImage} alt="Expanded" className="modal-image" />
            <button onClick={handleCloseExpandedImage} className="modal-close">✕</button>
          </div>
        </div>
      )}
    </div>
  );
}
