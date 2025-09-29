import React, { useEffect, useRef } from "react";

/**
 * DexScreenerChart
 * @param {string} pairPath e.g. "ethereum/0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc"
 * @param {"dark"|"light"} theme
 * @param {number|string} height 
 */
export default function DexScreenerChart({ pairPath, theme = "dark", height = 560 }) {
  const iframeRef = useRef(null);
  const src = `https://dexscreener.com/${pairPath}?embed=1&theme=${theme}`;

  // optional: auto-resize on window changes (helps mobile)
  useEffect(() => {
    const onResize = () => {
      if (iframeRef.current) {
        iframeRef.current.style.height = typeof height === "number" ? `${height}px` : String(height);
        iframeRef.current.style.width = "100%";
      }
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [height]);

  return (
    <div style={{ width: "100%", borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
      <iframe
        ref={iframeRef}
        title="DEX Screener Chart"
        src={src}
        style={{ width: "100%", height: typeof height === "number" ? `${height}px` : String(height), border: 0 }}
        loading="lazy"
        allow="clipboard-write; fullscreen"
      />
    </div>
  );
}
