import { buildEnvelope, corsHeaders } from "../_shared/verify.ts";

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  const headers = { "content-type":"application/json", ...corsHeaders(origin) };

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error:"Method Not Allowed" }), { status:405, headers });
  }

  const { action, to, bodySha256 } = await req.json().catch(() => ({} as any));
  if (!["send","read"].includes(action)) {
    return new Response(JSON.stringify({ error:"invalid action" }), { status:400, headers });
  }
  if (!to) {
    return new Response(JSON.stringify({ error:"missing 'to' wallet" }), { status:400, headers });
  }

  const nonce = crypto.getRandomValues(new Uint32Array(1))[0].toString(36) + crypto.randomUUID().slice(0,8);
  const ts = Date.now();
  const host = "oneforall.fun";
  const envelope = buildEnvelope({ host, action, to, nonce, ts, bodySha256 });

  return new Response(JSON.stringify({ nonce, ts, envelope }), { headers });
});
