import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// 🌐 Backend API URLs
const PROD_API = "https://api.oneforall.fun";
const DEV_API = "http://localhost:5175";

export default defineConfig(({ mode }) => {
  const isDev = mode === "development";
  const apiBase = isDev ? DEV_API : PROD_API;

  console.log("🏗️ Building for:", mode);
  console.log("🌐 Injecting API_BASE:", apiBase);

  return {
    plugins: [react()],

    define: {
  __API_BASE__: JSON.stringify(
    process.env.NODE_ENV === "development"
      ? "http://localhost:5175"
      : "https://api.oneforall.fun"
  ),
  global: "window",
  "process.env": {},
  },

    resolve: {
      alias: {
        buffer: "buffer",
        stream: "stream-browserify",
        util: "util",
      },
    },

    esbuild: {
      legalComments: "none",
    },

    build: {
      target: "es2020",
      minify: "esbuild",
      cssMinify: true,
      sourcemap: false,
      outDir: "dist",
    },

    optimizeDeps: {
      include: [
        "@solana/web3.js",
        "@solana/wallet-adapter-react",
        "three",
        "buffer",
        "process",
      ],
    },

    server: {
      cors: true,
      host: "localhost",
      port: 5174,
      watch: { usePolling: false },
    },
  };
});
