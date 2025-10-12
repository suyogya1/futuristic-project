/**
 * Dynamically loads the Jupiter Terminal script and initializes it
 */
export function loadJupiter() {
  return new Promise((resolve, reject) => {
    if (window.Jupiter) {
      resolve(window.Jupiter);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://terminal.jup.ag/main-v2.js";
    script.onload = () => {
      if (window.Jupiter) {
        resolve(window.Jupiter);
      } else {
        reject(new Error("Jupiter failed to load"));
      }
    };
    script.onerror = () => reject(new Error("Failed to load Jupiter script"));
    document.head.appendChild(script);
  });
}
