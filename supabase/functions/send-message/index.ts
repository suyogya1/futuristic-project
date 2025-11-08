// supabase/functions/send-message/index.ts
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  verifySolanaSignature,
  buildEnvelope,
  MAX_SKEW_MS,
  corsHeaders,
} from "../_shared/verify.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_ROLE_KEY")!, // SERVICE ROLE required
  { auth: { persistSession: false } },
);

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");

  // --- CORS preflight ---
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  const headers = { "content-type": "application/json", ...corsHeaders(origin) };

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
        status: 405,
        headers,
      });
    }

    // Expecting: sender, recipient, body, signature, envelope, nonce, ts, (optional) bodySha256
    const p = await req.json().catch(() => ({} as any));
    const { sender, recipient, body, signature, envelope, nonce, ts, bodySha256 } = p || {};

    // 1) Basic validation
    if (!sender || !recipient || !body || !signature || !envelope || !nonce || !ts) {
      return new Response(JSON.stringify({ error: "missing fields" }), {
        status: 400,
        headers,
      });
    }

    // 2) Fresh timestamp (anti-replay window)
    if (Math.abs(Date.now() - Number(ts)) > MAX_SKEW_MS) {
      return new Response(JSON.stringify({ error: "stale timestamp" }), {
        status: 400,
        headers,
      });
    }

    // 3) Envelope must be exactly what the server expects
    const expected = buildEnvelope({
      host: "oneforall.fun", // keep consistent with issue-nonce
      action: "send",
      to: recipient,
      nonce,
      ts,
      bodySha256,
    });

    if (expected !== envelope) {
      return new Response(JSON.stringify({ error: "envelope mismatch" }), {
        status: 400,
        headers,
      });
    }

    // 4) Verify signature: sender signed the envelope
    const ok = verifySolanaSignature(envelope, signature, sender);
    if (!ok) {
      return new Response(JSON.stringify({ error: "invalid signature" }), {
        status: 401,
        headers,
      });
    }

    // 5) Nonce must be unique per sender (prevent replay)
    const { error: nonceErr } = await supabase
      .from("used_nonces")
      .insert({ sender_wallet: sender, nonce })
      .select()
      .single();

    if (nonceErr) {
      // If the PK (sender_wallet, nonce) exists → duplicate
      const dup =
        nonceErr.code === "23505" ||
        /duplicate key value|unique constraint|already exists/i.test(nonceErr.message || "") ||
        /unique violation/i.test(nonceErr.details || "");

      if (dup) {
        return new Response(JSON.stringify({ error: "nonce already used" }), {
          status: 409,
          headers,
        });
      }

      // Log any other DB error for visibility in Supabase Logs
      console.error("used_nonces insert error:", nonceErr);
      return new Response(
        JSON.stringify({
          error: "nonce insert failed",
          detail: nonceErr.message || nonceErr.details || nonceErr.hint,
        }),
        { status: 500, headers },
      );
    }

    // 6) Insert the message
    const { data, error } = await supabase
      .from("messages")
      .insert({
        sender_wallet: sender,
        recipient_wallet: recipient,
        body,
        attachments: [], // messages.attachments must be jsonb NOT NULL DEFAULT '[]'
      })
      .select()
      .single();

    if (error) {
      console.error("messages insert error:", error);
      return new Response(
        JSON.stringify({
          error: "db insert failed",
          detail: error.message || error.details || error.hint,
        }),
        { status: 500, headers },
      );
    }

    return new Response(JSON.stringify({ ok: true, message: data }), { headers });
  } catch (e) {
    console.error("Unhandled send-message error:", e);
    return new Response(JSON.stringify({ error: "server", detail: String(e) }), {
      status: 500,
      headers,
    });
  }
});