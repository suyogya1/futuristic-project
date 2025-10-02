// src/utils/loadJupiter.js
let loading;
export async function loadJupiter() {
  if (typeof window === "undefined") return;
  if (window.Jupiter) return;

  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-jup-terminal]');
      if (existing) {
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", () => reject(new Error("Failed to load Jupiter")));
        return;
      }
      const s = document.createElement("script");
      s.src = "https://terminal.jup.ag/main-v2.js";
      s.async = true;
      s.defer = true;
      s.setAttribute("data-jup-terminal", "1");
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("Failed to load Jupiter"));
      document.head.appendChild(s);
    });
  }
  return loading;
}
