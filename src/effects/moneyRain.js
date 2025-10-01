/**
 * Money Rain Animation
 * Triggers a celebratory money rain effect with configurable options
 */

function ensureMoneyRainStyles() {
  if (document.getElementById("money-rain-style")) return;
  
  const css = `
    .money-rain {
      position: fixed;
      inset: 0;
      z-index: 2147483647;
      pointer-events: none;
      overflow: hidden;
    }
    
    .money-bill {
      position: absolute;
      top: -12vh;
      font-size: clamp(22px, 3.2vw, 38px);
      transform: rotate(var(--rot, 0deg));
      filter: drop-shadow(0 6px 10px rgba(0, 0, 0, 0.35));
      animation-name: bill-fall, bill-wobble;
      animation-timing-function: linear, ease-in-out;
      animation-iteration-count: 1, infinite;
      will-change: transform, opacity;
    }
    
    @keyframes bill-fall {
      0% {
        transform: translateY(-12vh) rotate(var(--rot));
        opacity: 0;
      }
      10% {
        opacity: 1;
      }
      100% {
        transform: translateY(115vh) rotate(calc(var(--rot) + 220deg));
        opacity: 0.95;
      }
    }
    
    @keyframes bill-wobble {
      0% {
        transform: translateX(0) rotate(var(--rot));
      }
      50% {
        transform: translateX(16px) rotate(calc(var(--rot) + 6deg));
      }
      100% {
        transform: translateX(0) rotate(var(--rot));
      }
    }
    
    /* Reduced motion support */
    @media (prefers-reduced-motion: reduce) {
      .money-bill {
        animation-duration: 1s, 0s !important;
        animation-delay: 0s !important;
      }
      
      @keyframes bill-fall {
        0% {
          opacity: 0;
          transform: translateY(-12vh) rotate(var(--rot));
        }
        50% {
          opacity: 1;
        }
        100% {
          opacity: 0;
          transform: translateY(50vh) rotate(var(--rot));
        }
      }
    }
  `;
  
  const style = document.createElement("style");
  style.id = "money-rain-style";
  style.textContent = css;
  document.head.appendChild(style);
}

/**
 * Start a money rain animation
 * @param {Object} options - Configuration options
 * @param {number} options.durationMs - How long new bills spawn (default: 3000)
 * @param {number} options.count - Number of bills to create (default: auto-calculated)
 * @param {string} options.areaSelector - CSS selector for container (default: "body")
 * @param {boolean} options.allowMultiple - Allow multiple rains simultaneously (default: false)
 * @param {string} options.emoji - Emoji to use (default: "💵")
 * @returns {Object} Control object with stop() method
 */
export function startMoneyRain({
  durationMs = 3000,
  count,
  areaSelector = "body",
  allowMultiple = false,
  emoji = "💵",
} = {}) {
  if (typeof document === "undefined") return { stop: () => {} };
  
  ensureMoneyRainStyles();

  const root = document.querySelector(areaSelector) || document.body;
  
  // Remove existing rain if not allowing multiple
  if (!allowMultiple) {
    const existing = root.querySelector(".money-rain");
    if (existing) {
      const timeoutId = existing.dataset.timeoutId;
      if (timeoutId) clearTimeout(Number(timeoutId));
      existing.remove();
    }
  }

  // Auto-calculate count based on screen size and reduced motion preference
  if (!count) {
    const isMobile = window.innerWidth < 768;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    
    if (prefersReducedMotion) {
      count = 10;
    } else if (isMobile) {
      count = 30;
    } else {
      count = 56;
    }
  }

  const container = document.createElement("div");
  container.className = "money-rain";
  root.appendChild(container);

  // Create bills
  for (let i = 0; i < count; i++) {
    const bill = document.createElement("div");
    bill.className = "money-bill";
    bill.textContent = emoji;
    bill.setAttribute("aria-hidden", "true"); // Accessibility

    const startXvw = Math.random() * 100;
    const rotate = (Math.random() * 70 - 35).toFixed(0);
    const delayS = (Math.random() * 0.8).toFixed(2);
    const fallS = (2.0 + Math.random() * 1.6).toFixed(2);
    const swayS = (1.5 + Math.random() * 1.0).toFixed(2);

    bill.style.left = `${startXvw}vw`;
    bill.style.setProperty("--rot", `${rotate}deg`);
    bill.style.animationDelay = `${delayS}s`;
    bill.style.animationDuration = `${fallS}s, ${swayS}s`;
    
    container.appendChild(bill);
  }

  // Calculate cleanup time: max spawn delay + max fall duration + buffer
  const maxSpawnDelay = 800; // ms
  const maxFallDuration = 3600; // 2.0 + 1.6 seconds = 3600ms
  const cleanupDelay = durationMs + maxSpawnDelay + maxFallDuration;

  const timeoutId = setTimeout(() => {
    container.remove();
  }, cleanupDelay);

  // Store timeout ID for cleanup
  container.dataset.timeoutId = timeoutId.toString();

  // Return control object
  return {
    stop: () => {
      clearTimeout(timeoutId);
      container.remove();
    },
  };
}

/**
 * Quick test function for console
 * Usage: __moneyRain() or __moneyRain({ count: 100, emoji: "🤑" })
 */
if (typeof window !== "undefined") {
  window.__moneyRain = (options) => startMoneyRain(options);
}

// Example usage in your buy coin handler:
/*
document.querySelector("#buy-coin-btn").addEventListener("click", () => {
  // Your purchase logic here
  console.log("Coin purchased!");
  
  // Trigger celebration
  startMoneyRain({ 
    durationMs: 3000, 
    count: 56,
    emoji: "💵"
  });
});
*/