// deno-lint-ignore-file no-explicit-any
import nacl from "npm:tweetnacl@1.0.3";
import bs58 from "npm:bs58@5";

export function verifySolanaSignature(
  message: string,
  signatureBase58: string,
  publicKeyBase58: string,
) {
  try {
    const signature = bs58.decode(signatureBase58);
    const pubkey = bs58.decode(publicKeyBase58);
    const msg = new TextEncoder().encode(message);
    return nacl.sign.detached.verify(msg, signature, pubkey);
  } catch {
    return false;
  }
}

export function buildEnvelope(params: {
  host: string; action: "send" | "read"; to: string; nonce: string; ts: number; bodySha256?: string;
}) {
  return `${params.host} | action:${params.action} | to:${params.to} | nonce:${params.nonce} | ts:${params.ts}` +
         (params.bodySha256 ? ` | bodySha256:${params.bodySha256}` : "");
}

export const MAX_SKEW_MS = 2 * 60 * 1000; // 2 minutes

export const ALLOWED_ORIGINS = ["http://localhost:5174","https://oneforall.fun"];
export function corsHeaders(origin: string | null) {
  const allow = ALLOWED_ORIGINS.includes(origin ?? "") ? (origin as string) : "*";
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, apikey",
    "Access-Control-Max-Age": "86400",
  };
}
