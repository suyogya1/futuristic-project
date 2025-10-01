// src/components/DexScreenerChart.jsx
import React from "react";

/**
 * DexScreener embed
 * @param {string} pairPath  e.g. "solana/8HoQnePLqPj4M7PUDzfw8e3Ymdwgc7NLGnaTUapubyvu"  (Raydium RAY/USDC)
 *                           or  "ethereum/0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc" (Uniswap V2 WETH/USDC)
 * @param {string} theme     "dark" | "light"
 * @param {number|string} height   CSS height, e.g. 560 or "560px"
 */
export default function DexScreenerChart({
  pairPath,
  theme = "dark",
  height = 560,
}) {
  const h = typeof height === "number" ? `${height}px` : height;
  const src = `https://www.dexscreener.com/${pairPath}?embed=1&theme=${theme}`;

  return (
    <div
      style={{
        borderRadius: 16,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <iframe
        title="DexScreener Chart"
        src={src}
        style={{ width: "100%", height: h, border: 0 }}
        allow="clipboard-write; clipboard-read; fullscreen"
      />
    </div>
  );
}
