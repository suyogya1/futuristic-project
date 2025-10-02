import React, { useEffect, useMemo, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { loadJupiter } from "../utils/loadJupiter";
import { clusterApiUrl } from "@solana/web3.js";

/**
 * Real swaps via Jupiter Terminal.
 * - Passes your Phantom wallet context
 * - Defaults to SOL <-> YOUR_TOKEN_MINT
 * - Honors slippage, theme, etc.
 *
 * REQUIRED: set YOUR_TOKEN_MINT below to your real SPL mint.
 */
const SOL_MINT = "So11111111111111111111111111111111111111112"; // wSOL
const YOUR_TOKEN_MINT = "REPLACE_WITH_YOUR_TOKEN_MINT"; // <-- UPDATE THIS!

export default function SwapTerminal({
  mode = "buy",                 // "buy" (SOL -> your token) or "sell" (your token -> SOL)
  slippageBps = 100,            // 100 = 1.00%
  height = "660px",
  theme = "dark",
  strictTokenList = true,
  // Use your app's RPC (prefer env via your WalletConnectionProvider). Fallback here for safety.
  rpc = (import.meta.env.VITE_SOLANA_NETWORK === "mainnet-beta"
          ? (import.meta.env.VITE_SOLANA_RPC_MAINNET || clusterApiUrl("mainnet-beta"))
          : (import.meta.env.VITE_SOLANA_RPC_DEVNET   || clusterApiUrl("devnet"))),
  onSuccess,
  onSwapError,
}) {
  const wallet = useWallet();
  const containerRef = useRef(null);

  const { inputMint, outputMint } = useMemo(() => {
    const target = (YOUR_TOKEN_MINT && YOUR_TOKEN_MINT.length > 30)
      ? YOUR_TOKEN_MINT
      : "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"; // fallback to USDC if you forget to set
    return mode === "buy"
      ? { inputMint: SOL_MINT,      outputMint: target }
      : { inputMint: target,        outputMint: SOL_MINT };
  }, [mode]);

  useEffect(() => {
    let destroyed = false;

    (async () => {
      await loadJupiter();
      if (destroyed) return;
      if (!containerRef.current || !window.Jupiter) return;

      // Destroy any previous instance to avoid duplication on prop changes
      if (typeof window.Jupiter.destroy === "function") {
        try { window.Jupiter.destroy(); } catch {}
      }

      // Init Terminal
      window.Jupiter.init({
        containerId: "jup-swap-container",
        endpoint: rpc,
        enableWalletPassthrough: true,
        displayMode: "integrated",
        theme,
        defaultInputMint: inputMint,
        defaultOutputMint: outputMint,
        slippageBps,
        strictTokenList,
        containerStyles: { height },

        onSuccess: (e) => { 
          console.log("[Jupiter] swap success:", e?.txid);
          onSuccess?.(e);
        },
        onSwapError: (e) => {
          console.error("[Jupiter] swap error:", e?.error || e);
          onSwapError?.(e);
        },
      });

      // Hand over your WalletAdapter state (Phantom) to the terminal
      if (typeof window.Jupiter.syncProps === "function") {
        window.Jupiter.syncProps({ passthroughWalletContextState: wallet });
      }
    })();

    return () => {
      destroyed = true;
      if (window?.Jupiter?.destroy) {
        try { window.Jupiter.destroy(); } catch {}
      }
    };
  }, [wallet.connected, wallet.publicKey, rpc, inputMint, outputMint, slippageBps, strictTokenList, theme, height, onSuccess, onSwapError]);

  return (
    <div
      id="jup-swap-container"
      ref={containerRef}
      style={{
        borderRadius: 16,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.08)",
        width: "100%",
        minHeight: height,
      }}
    />
  );
}
