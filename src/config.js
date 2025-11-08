// src/config.js

// This ensures Vite injects the constant during build
export const API_BASE =
  typeof __API_BASE__ !== "undefined"
    ? __API_BASE__
    : import.meta.env.VITE_API_URL || "http://localhost:5175";

if (typeof window !== "undefined") {
  window.__API_BASE__ = API_BASE;
}

console.log("🌐 Active API_BASE:", API_BASE);
