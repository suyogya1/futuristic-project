import React, { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Clipboard } from "lucide-react"; // lightweight icon

const API_BASE = "https://api.oneforall.fun";

export default function SendMessagePage() {
  const { publicKey, connected } = useWallet();

  const [activeTab, setActiveTab] = useState("universal");
  const [receiverWallet, setReceiverWallet] = useState("");
  const [conversationId, setConversationId] = useState("");
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingDM, setLoadingDM] = useState(false);

  const [globalMessages, setGlobalMessages] = useState([]);
  const [globalInput, setGlobalInput] = useState("");
  const [loadingGlobal, setLoadingGlobal] = useState(false);

  const [copyNotice, setCopyNotice] = useState("");

  // Load all messages for receiver
  useEffect(() => {
    if (connected && publicKey) loadAllForReceiver(publicKey.toString());
  }, [connected, publicKey]);

  const loadAllForReceiver = async (wallet) => {
    try {
      const res = await fetch(`${API_BASE}/api/all-messages?wallet=${wallet}`);
      const data = await res.json();
      if (data.success && data.messages) setMessages(data.messages);
    } catch (e) {
      console.error(e);
    }
  };

  const handleStartChat = async () => {
    if (!receiverWallet.trim()) return showCopyNotice("Enter receiver wallet");
    if (!connected || !publicKey)
      return showCopyNotice("Connect wallet first");

    try {
      const res = await fetch(`${API_BASE}/api/conversations/dm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meWallet: publicKey.toString(),
          otherWallet: receiverWallet.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setConversationId(data.conversationId);
        await loadMessages(data.conversationId);
        showCopyNotice("Chat ready");
      } else showCopyNotice(data.error || "Error starting chat");
    } catch (err) {
      console.error(err);
    }
  };

  const loadMessages = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/messages?conversationId=${id}`);
      const data = await res.json();
      if (data.success) setMessages(data.messages);
    } catch (err) {
      console.error(err);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversationId || !publicKey) return;
    setLoadingDM(true);
    try {
      const res = await fetch(`${API_BASE}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          senderWallet: publicKey.toString(),
          body: newMessage,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages((p) => [...p, data.message]);
        setNewMessage("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDM(false);
    }
  };

  // Universal Chat
  const loadGlobalMessages = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/universal/messages`);
      const data = await res.json();
      if (data.success) setGlobalMessages(data.messages);
    } catch (e) {
      console.error(e);
    }
  };

  const sendGlobal = async () => {
    if (!globalInput.trim()) return;
    if (!connected || !publicKey)
      return showCopyNotice("Connect wallet first");

    setLoadingGlobal(true);
    try {
      const res = await fetch(`${API_BASE}/api/universal/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderWallet: publicKey.toString(),
          body: globalInput,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setGlobalMessages((p) => [...p, data.message]);
        setGlobalInput("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingGlobal(false);
    }
  };

  const showCopyNotice = (msg) => {
    setCopyNotice(msg);
    setTimeout(() => setCopyNotice(""), 2000);
  };

  const handleCopy = async (wallet) => {
    try {
      await navigator.clipboard.writeText(wallet);
      showCopyNotice("Wallet address copied!");
    } catch {
      showCopyNotice("Failed to copy");
    }
  };

  // Auto-refresh
  useEffect(() => {
    loadGlobalMessages();
    const i = setInterval(loadGlobalMessages, 5000);
    return () => clearInterval(i);
  }, []);
  useEffect(() => {
    if (!conversationId) return;
    const i = setInterval(() => loadMessages(conversationId), 5000);
    return () => clearInterval(i);
  }, [conversationId]);

  const handleKey = (e, type) => {
    if (e.key === "Enter") {
      e.preventDefault();
      type === "dm" ? sendMessage() : sendGlobal();
    }
  };

  return (
    <div style={page}>
      {copyNotice && (
        <div style={popupWrapper}>
          <div style={popup}>{copyNotice}</div>
        </div>
      )}

      <div style={container}>
        <div style={tabs}>
          <button
            style={{ ...tabBtn, ...(activeTab === "dm" ? tabActive : {}) }}
            onClick={() => setActiveTab("dm")}
          >
            Direct
          </button>
          <button
            style={{
              ...tabBtn,
              ...(activeTab === "universal" ? tabActive : {}),
            }}
            onClick={() => setActiveTab("universal")}
          >
            Universal
          </button>
        </div>

        {!connected ? (
          <div style={msgCenter}>
            <p style={muted}>Connect wallet to start chatting.</p>
          </div>
        ) : activeTab === "dm" ? (
          <>
            <div style={headerRow}>
              <h2 style={sectionTitle}>Direct Messages</h2>
              <span style={miniHint}>1:1 encrypted</span>
            </div>

            <div style={startRow}>
              <input
                placeholder="Paste wallet address here"
                value={receiverWallet}
                onChange={(e) => setReceiverWallet(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleStartChat()}
                style={inputBox}
              />
              <button onClick={handleStartChat} style={btnAction}>
                Start
              </button>
            </div>

            <div style={chatArea}>
              {messages.length ? (
                messages.map((m) => (
                  <Bubble
                    key={m.id}
                    body={m.body}
                    wallet={m.senderWallet}
                    isMe={m.senderWallet === publicKey?.toString()}
                    time={m.createdAt}
                    onCopy={handleCopy}
                  />
                ))
              ) : (
                <p style={mutedCenter}>No messages yet.</p>
              )}
            </div>

            {conversationId && (
              <div style={sendRow}>
                <input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => handleKey(e, "dm")}
                  placeholder="Type a message..."
                  style={msgInput}
                />
                <button
                  onClick={sendMessage}
                  disabled={loadingDM}
                  style={btnSend}
                >
                  {loadingDM ? "..." : "Send"}
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <div style={headerRow}>
              <h2 style={sectionTitle}>Universal Chat</h2>
              <span style={miniHint}>Public</span>
            </div>

            <div style={chatArea}>
              {globalMessages.length ? (
                globalMessages.map((m) => (
                  <Bubble
                    key={m.id}
                    body={m.body}
                    wallet={m.senderWallet}
                    isMe={m.senderWallet === publicKey?.toString()}
                    time={m.createdAt}
                    onCopy={handleCopy}
                    showCopyIcon
                  />
                ))
              ) : (
                <p style={mutedCenter}>No messages yet.</p>
              )}
            </div>

            <div style={sendRow}>
              <input
                value={globalInput}
                onChange={(e) => setGlobalInput(e.target.value)}
                onKeyDown={(e) => handleKey(e, "universal")}
                placeholder="Say something to everyone..."
                style={msgInput}
              />
              <button
                onClick={sendGlobal}
                disabled={loadingGlobal}
                style={btnSend}
              >
                {loadingGlobal ? "..." : "Send"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* --- Message Bubble --- */
function Bubble({ body, wallet, isMe, time, onCopy, showCopyIcon }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: isMe ? "flex-end" : "flex-start",
        marginBottom: 10,
      }}
    >
      <div
        style={{
          background: isMe
            ? "linear-gradient(135deg,#00ffe1 0%,#0077ff 100%)"
            : "rgba(255,255,255,0.08)",
          color: isMe ? "#000" : "#fff",
          borderRadius: 14,
          padding: "12px 16px",
          maxWidth: "75%",
          boxShadow: isMe
            ? "0 0 20px rgba(0,255,230,0.4)"
            : "0 0 12px rgba(0,0,0,0.3)",
        }}
      >
        <div style={{ fontSize: 15, wordBreak: "break-word" }}>{body}</div>
        <div
          onClick={() => onCopy(wallet)}
          title="Click to copy full wallet"
          style={{
            marginTop: 6,
            fontSize: 11,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            color: isMe ? "#002" : "#00ffe1",
            fontFamily: "monospace",
            cursor: "pointer",
            borderTop: "1px solid rgba(255,255,255,0.05)",
            paddingTop: 4,
          }}
        >
          <span
            style={{
              textDecoration: "underline",
              textUnderlineOffset: 2,
              textDecorationColor: "rgba(0,255,225,0.4)",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            {wallet.slice(0, 4)}...{wallet.slice(-4)}
            {showCopyIcon && (
              <Clipboard size={12} color="#00ffe1" strokeWidth={1.5} />
            )}
          </span>
          <span style={{ color: "rgba(255,255,255,0.5)" }}>
            {new Date(time).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </div>
    </div>
  );  
}

/* --- Styles --- */
const page = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at 30% 10%, rgba(0,255,200,0.08) 0%, rgba(0,0,0,0) 50%), radial-gradient(circle at 80% 0%, rgba(0,120,255,0.1) 0%, rgba(0,0,0,0) 70%), #020613",
  color: "#fff",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  fontFamily: "Inter, sans-serif",
  padding: "80px 0",
};

const container = {
  width: "95%",
  maxWidth: "650px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 18,
  padding: 20,
  backdropFilter: "blur(12px)",
  boxShadow: "0 0 60px rgba(0,255,200,0.08)",
};

const tabs = {
  display: "flex",
  background: "rgba(0,0,0,0.3)",
  borderRadius: 12,
  padding: 4,
  marginBottom: 18,
};

const tabBtn = {
  flex: 1,
  border: "none",
  background: "transparent",
  color: "rgba(255,255,255,0.6)",
  borderRadius: 8,
  padding: "10px 0",
  cursor: "pointer",
  fontSize: 14,
  transition: "0.2s",
};
const tabActive = {
  background: "linear-gradient(135deg,#00ffe1,#0077ff)",
  color: "#000",
  fontWeight: 600,
  boxShadow: "0 0 25px rgba(0,255,200,0.25)",
};
const headerRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 10,
};
const sectionTitle = { fontSize: 15, fontWeight: 600, margin: 0 };
const miniHint = { fontSize: 11, color: "rgba(255,255,255,0.4)" };
const startRow = { display: "flex", gap: 8, marginBottom: 14 };
const inputBox = {
  flex: 1,
  padding: "10px 12px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 10,
  color: "#fff",
  outline: "none",
};
const btnAction = {
  background: "linear-gradient(135deg,#00ffe1,#0077ff)",
  color: "#000",
  border: "none",
  borderRadius: 10,
  fontWeight: 600,
  padding: "10px 16px",
  cursor: "pointer",
};
const chatArea = {
  background: "rgba(0,0,0,0.4)",
  border: "1px solid rgba(255,255,255,0.05)",
  borderRadius: 14,
  padding: "14px 12px",
  minHeight: "48vh",
  maxHeight: "50vh",
  overflowY: "auto",
  marginBottom: 14,
};
const muted = { color: "rgba(255,255,255,0.5)", fontSize: 13 };
const mutedCenter = { ...muted, textAlign: "center", marginTop: 30 };
const sendRow = { display: "flex", alignItems: "center", gap: 8 };
const msgInput = {
  flex: 1,
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 10,
  color: "#fff",
  padding: "10px 12px",
  outline: "none",
};
const btnSend = {
  background: "linear-gradient(135deg,#00ffe1,#0077ff)",
  color: "#000",
  border: "none",
  borderRadius: 10,
  fontWeight: 600,
  padding: "10px 16px",
  cursor: "pointer",
};
const popupWrapper = {
  position: "fixed",
  top: 20,
  left: "50%",
  transform: "translateX(-50%)",
  zIndex: 1000,
};
const popup = {
  background: "rgba(0,255,200,0.15)",
  border: "1px solid rgba(0,255,200,0.5)",
  color: "#fff",
  padding: "8px 14px",
  borderRadius: 10,
  fontSize: 13,
  fontWeight: 500,
  backdropFilter: "blur(8px)",
};
const msgCenter = { textAlign: "center", padding: 40 };
