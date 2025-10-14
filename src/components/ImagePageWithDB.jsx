import React, { useState, useEffect, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { imageService } from "../lib/supabase";
import "../styles/imagePageStyles.css";

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + " " + sizes[i];
}

export default function ImagePageWithDB() {
  const { publicKey, connected } = useWallet();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [counter, setCounter] = useState(0);
  const [message, setMessage] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);
  const [previewImageSrc, setPreviewImageSrc] = useState(null);
  const [votedSet, setVotedSet] = useState(new Set());
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Load images from database
  useEffect(() => {
    loadImages();

    // Subscribe to real-time changes
    const subscription = imageService.subscribeToImages(() => {
      loadImages();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Check user's votes
  useEffect(() => {
    if (connected && publicKey && cards.length > 0) {
      checkUserVotes();
    }
  }, [connected, publicKey, cards.length]);

  async function loadImages() {
    try {
      const data = await imageService.getAllImages();
      setCards(data);
      if (data.length > 0) {
        const maxToken = Math.max(...data.map(c => {
          const num = parseInt(c.token_number.replace('#', ''));
          return isNaN(num) ? 0 : num;
        }));
        setCounter(maxToken);
      }
    } catch (error) {
      console.error("Failed to load images:", error);
    } finally {
      setLoading(false);
    }
  }

  async function checkUserVotes() {
    try {
      const walletAddress = publicKey.toString();
      const voted = new Set();

      for (const card of cards) {
        const hasVoted = await imageService.hasUserVoted(card.id, walletAddress);
        if (hasVoted) {
          voted.add(card.id);
        }
      }

      setVotedSet(voted);
    } catch (error) {
      console.error("Failed to check votes:", error);
    }
  }

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

  const upload = async () => {
    if (!imagePreview) return alert("Please select an image");
    if (!message.trim()) return alert("Please add a message");

    setUploading(true);

    try {
      const next = counter + 1;
      const token = `#${String(next).padStart(4, "0")}`;

      const imageData = {
        image_url: imagePreview,
        message: message.trim(),
        token_number: token,
        wallet_address: connected ? publicKey?.toString() : null
      };

      await imageService.createImage(imageData);

      setCounter(next);
      setMessage("");
      removeSelected();
      setIsUploaderOpen(false);

      // Reload images
      await loadImages();
    } catch (error) {
      console.error("Failed to upload image:", error);
      alert("Failed to create card. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const vote = async (cardId) => {
    if (!connected) {
      alert("Please connect your wallet to vote");
      return;
    }

    if (votedSet.has(cardId)) {
      return;
    }

    try {
      const walletAddress = publicKey.toString();
      await imageService.voteForImage(cardId, walletAddress);

      // Update local state
      setVotedSet(prev => new Set([...prev, cardId]));

      // Reload images to get updated vote count
      await loadImages();
    } catch (error) {
      console.error("Failed to vote:", error);
      if (error.message === 'You have already voted for this image') {
        alert(error.message);
        setVotedSet(prev => new Set([...prev, cardId]));
      } else {
        alert("Failed to vote. Please try again.");
      }
    }
  };

  const openFullPreview = (imgSrc) => {
    setPreviewImageSrc(imgSrc);
  };

  if (loading) {
    return (
      <main className="container" style={{ paddingTop: 60 }}>
        <section style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>⏳</div>
          <h2>Loading Cards...</h2>
        </section>
      </main>
    );
  }

  return (
    <div>
      <main className="container" style={{ paddingTop: 60 }}>
        <section style={{ marginBottom: 48 }}>
          <h1 className="section-title" style={{ textAlign: "center", marginBottom: 16 }}>
            🎭 Meme Card Battle
          </h1>
          <p className="section-sub" style={{ textAlign: "center", maxWidth: 600, margin: "0 auto" }}>
            Create, share, and vote for your favorite meme cards. The most popular cards rise to the top!
          </p>
        </section>

        <section className="image-grid-section">
          {cards.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>🎨</div>
              <h3>No cards yet</h3>
              <p className="hint">Be the first to create a meme card!</p>
            </div>
          ) : (
            cards.map((card) => (
              <div key={card.id} className="scene" onClick={() => openFullPreview(card.image_url)}>
                <div className="card3d">
                  {/* Front */}
                  <div className="face3d front">
                    <div className="frameArea">
                      <img
                        src={card.image_url}
                        alt={`Card ${card.token_number}`}
                        className="frontImage"
                      />
                    </div>
                  </div>

                  {/* Back */}
                  <div className="face3d back">
                    <div className="frameArea" />
                    <div className="back-text-content">
                      <div className="back-token-large">{card.token_number}</div>
                      <div className="back-message-main">{card.message}</div>
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

        <div className="upload-trigger-area">
          <button className="open-uploader-btn" onClick={() => setIsUploaderOpen(true)}>
            ✨ Create New Meme Card
          </button>
        </div>
      </main>

      {isUploaderOpen && (
        <div className="modal-backdrop" onClick={() => !uploading && setIsUploaderOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close-btn"
              onClick={() => !uploading && setIsUploaderOpen(false)}
              disabled={uploading}
            >
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
                  <button
                    className="remove-preview"
                    onClick={removeSelected}
                    disabled={uploading}
                  >
                    Remove
                  </button>
                </div>
              )}
              <div className="message-area">
                <textarea
                  className="message-input"
                  placeholder={imagePreview ? "Add the text for the back of the card..." : "Select an image first to add a message"}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={!imagePreview || uploading}
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
                    disabled={uploading}
                  />
                  <label
                    htmlFor="file-upload"
                    className={`file-label ${uploading ? 'disabled' : ''}`}
                    style={{ opacity: uploading ? 0.5 : 1, cursor: uploading ? 'not-allowed' : 'pointer' }}
                  >
                    📎 Choose Image
                  </label>
                  {imageFile && <span className="file-name">{imageFile.name}</span>}
                </div>
                <button
                  className="upload-button"
                  onClick={upload}
                  disabled={!imagePreview || !message.trim() || uploading}
                >
                  {uploading ? "⏳ Creating..." : "🚀 Create Card"}
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
