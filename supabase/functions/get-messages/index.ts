import { createClient } from "npm:@supabase/supabase-js@2";
import {
  verifySolanaSignature,
  buildEnvelope,
  MAX_SKEW_MS,
  corsHeaders,
} from "../_shared/verify.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }
  const headers = { "content-type": "application/json", ...corsHeaders(origin) };

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method Not Allowed" }), { status: 405, headers });
    }

    const p = await req.json().catch(() => ({} as any));
    const { wallet, withPeer, signature, envelope, nonce, ts } = p || {};

    if (!wallet || !signature || !envelope || !nonce || !ts) {
      return new Response(JSON.stringify({ error: "missing fields" }), { status: 400, headers });
    }

    if (Math.abs(Date.now() - Number(ts)) > MAX_SKEW_MS) {
      return new Response(JSON.stringify({ error: "stale timestamp" }), { status: 400, headers });
    }

    const expected = buildEnvelope({ host:"oneforall.fun", action:"read", to: wallet, nonce, ts });
    if (expected !== envelope) {
      return new Response(JSON.stringify({ error: "envelope mismatch" }), { status: 400, headers });
    }

    const ok = verifySolanaSignature(envelope, signature, wallet);
    if (!ok) {
      return new Response(JSON.stringify({ error: "invalid signature" }), { status: 401, headers });
    }

    let q = supabase
      .from("messages")
      .select("*")
      .or(`recipient_wallet.eq.${wallet},sender_wallet.eq.${wallet}`)
      .order("created_at", { ascending: false })
      .limit(200);

    if (withPeer) {
      q = supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_wallet.eq.${wallet},recipient_wallet.eq.${withPeer}),and(sender_wallet.eq.${withPeer},recipient_wallet.eq.${wallet})`,
        )
        .order("created_at", { ascending: true })
        .limit(200);
    }

    const { data, error } = await q;
    if (error) {
      return new Response(JSON.stringify({ error: "db error", detail: error.message }), { status: 500, headers });
    }

    return new Response(JSON.stringify({ ok: true, messages: data ?? [] }), { headers });
  } catch (e) {
    return new Response(JSON.stringify({ error: "server", detail: String(e) }), { status: 500, headers });
  }
});
