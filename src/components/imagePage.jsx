Item("meme_cards", JSON.stringify(cards));
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
            <b>$MEMECOIN</b>
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