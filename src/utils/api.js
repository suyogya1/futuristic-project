// src/utils/api.js
import { API_BASE } from "../config";
console.log("✅API Base URL in api.js:", API_BASE);

// ✅ Always resolve the correct backend URL
// Vite injects __API_BASE__ from vite.config.js during build
const API_BASE =
  typeof __API_BASE__ !== "undefined"
    ? __API_BASE__
    : import.meta.env.VITE_API_URL || "https://api.oneforall.fun";
 // fallback for dev

// ✅ Log for verification (visible in browser console & build logs)
console.log("🌐 API Base URL:", API_BASE);

// ✅ Expose globally for debugging in browser console
if (typeof window !== "undefined") {
  window.__API_BASE__ = API_BASE;
}

/** -------------------- CONVERSATIONS -------------------- **/
export async function createOrGetDM(meWallet, otherWallet) {
  const r = await fetch(`${API_BASE}/api/conversations/dm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ meWallet, otherWallet }),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json(); // { conversationId }
}

/** -------------------- MESSAGES -------------------- **/
export async function sendTextMessage(conversationId, senderWallet, body) {
  const r = await fetch(`${API_BASE}/api/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conversationId, senderWallet, body }),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json(); // { message }
}

export async function getMessages(conversationId, limit = 50) {
  const r = await fetch(
    `${API_BASE}/api/messages?conversationId=${encodeURIComponent(
      conversationId
    )}&limit=${limit}`
  );
  if (!r.ok) throw new Error(await r.text());
  return r.json(); // { messages: [...] }
}

/** -------------------- FILE UPLOADS -------------------- **/
export async function requestSignedUpload(params) {
  const r = await fetch(`${API_BASE}/api/storage/signed-upload`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params), // { conversationId, senderWallet, filename, contentType, kind, sizeBytes }
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json(); // { bucket, objectPath, signedUrl, token, tempId, meta }
}

export async function finalizeMessageWithAttachment(payload) {
  const r = await fetch(`${API_BASE}/api/messages/with-attachment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

/** -------------------- HEALTH CHECK -------------------- **/
export async function checkAPIHealth() {
  try {
    const r = await fetch(`${API_BASE}/health`);
    return r.ok;
  } catch {
    return false;
  }
}

// ✅ Export API_BASE so other files can import it directly
export { API_BASE };
