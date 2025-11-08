// ---------- Load .env first ----------
import dotenv from "dotenv";
dotenv.config({ path: "/root/oneForAll/.env" });

// ---------- Imports ----------
import express from "express";
import bodyParser from "body-parser";
import helmet from "helmet";
import { createClient } from "@supabase/supabase-js";

// ---------- Initialize ----------
const app = express();
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ---------- Middlewares ----------
const allowedOrigins = [
  "http://localhost:5174",
  "https://oneforall.fun",
  "https://www.oneforall.fun",
  "https://api.oneforall.fun",
];

app.use((req, res, next) => {
  try {
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    }
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
  } catch (e) {
    console.error("CORS error:", e);
    next();
  }
});

app.use(
  helmet({
    crossOriginResourcePolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);
app.use(bodyParser.json({ limit: "25mb" }));

// ---------- Validators ----------
function isValidWallet(wallet) {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(wallet) || (wallet && wallet.length > 2);
}
function isValidConversationId(id) {
  if (typeof id !== "string" || !id.includes("_")) return false;
  const [w1, w2] = id.split("_");
  return (isValidWallet(w1) && isValidWallet(w2)) || (w1?.length > 2 && w2?.length > 2);
}

// ---------- Mappers (snake_case -> camelCase for the UI) ----------
const mapDBMessage = (row) => ({
  id: row.id ?? String(row.created_at ?? Date.now()),
  conversationId: row.conversation_id,
  senderWallet: row.sender_wallet,
  body: row.body,
  createdAt: row.created_at ?? new Date().toISOString(),
});

const mapDBUniversal = (row) => ({
  id: row.id ?? String(row.created_at ?? Date.now()),
  senderWallet: row.sender_wallet,
  body: row.body,
  createdAt: row.created_at ?? new Date().toISOString(),
});

const mapDBMeme = (row) => ({
  id: String(row.id),
  walletAddress: row.wallet_address,
  message: row.message,
  imageData: row.image_data,
  votes: row.votes ?? 0,
  createdAt: row.created_at ?? new Date().toISOString(),
  createdAtMs: row.created_at_ms ?? Date.parse(row.created_at ?? new Date()),
});

// ---------- Health ----------
app.get("/health", (_req, res) => res.send("OK ✅ OneForAll API is Live!"));

// ---------- Root ----------
app.get("/", (_req, res) => {
  res.send("✅ OneForAll API is live and connected to Supabase!");
});

// ========== DM CHAT ==========
app.post("/api/conversations/dm", async (req, res) => {
  try {
    const { meWallet, otherWallet } = req.body;
    if (!isValidWallet(meWallet) || !isValidWallet(otherWallet)) {
      return res.status(400).json({ error: "Invalid wallet addresses" });
    }
    const conversationId =
      meWallet < otherWallet
        ? `${meWallet}_${otherWallet}`
        : `${otherWallet}_${meWallet}`;
    // (We keep DM IDs virtual; messages table stores conversation_id)
    console.log(`💬 DM created/retrieved: ${conversationId}`);
    res.json({ success: true, conversationId });
  } catch (e) {
    console.error("DM creation error:", e);
    res.status(500).json({ error: e.message });
  }
});

// ========== MESSAGES ==========
app.post("/api/messages", async (req, res) => {
  try {
    const { conversationId, senderWallet, body } = req.body;
    if (!conversationId || !senderWallet || !body) {
      return res.status(400).json({ error: "Missing fields" });
    }
    if (!isValidConversationId(conversationId)) {
      return res.status(400).json({ error: "Invalid conversation ID" });
    }
    const insert = {
      conversation_id: conversationId,
      sender_wallet: senderWallet,
      body,
    };
    const { data, error } = await supabase
      .from("messages")
      .insert([insert])
      .select()
      .single();
    if (error) throw error;
    const message = mapDBMessage(data);
    res.json({ success: true, message });
  } catch (e) {
    console.error("Send message error:", e);
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/messages", async (req, res) => {
  try {
    const { conversationId } = req.query;
    if (!conversationId) {
      return res.status(400).json({ error: "conversationId required" });
    }
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    res.json({
      success: true,
      messages: (data ?? []).map(mapDBMessage),
    });
  } catch (e) {
    console.error("Get messages error:", e);
    res.status(500).json({ error: e.message });
  }
});

// ========== FETCH ALL MESSAGES FOR A WALLET ==========
app.get("/api/all-messages", async (req, res) => {
  try {
    const { wallet } = req.query;
    if (!wallet) return res.status(400).json({ error: "wallet query param required" });

    // Search for rows where conversation_id contains this wallet
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .like("conversation_id", `%${wallet}%`)
      .order("created_at", { ascending: true });
    if (error) throw error;

    res.json({ success: true, messages: (data ?? []).map(mapDBMessage) });
  } catch (e) {
    console.error("Get all messages error:", e);
    res.status(500).json({ error: e.message });
  }
});

// ========== UNIVERSAL CHAT ==========
app.get("/api/universal/messages", async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("universal_messages")
      .select("*")
      .order("created_at", { ascending: true });

    // If the table doesn't exist yet, return an empty list (avoid UI 500 spam)
    if (error && error.code === "42P01") {
      console.warn("Table universal_messages missing — returning empty list.");
      return res.json({ success: true, messages: [] });
    }
    if (error) throw error;

    res.json({ success: true, messages: (data ?? []).map(mapDBUniversal) });
  } catch (e) {
    console.error("Universal chat GET error:", e);
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/universal/messages", async (req, res) => {
  try {
    const { senderWallet, body } = req.body;
    if (!senderWallet || !body) {
      return res.status(400).json({ error: "Missing fields" });
    }
    const insert = { sender_wallet: senderWallet, body };
    const { data, error } = await supabase
      .from("universal_messages")
      .insert([insert])
      .select()
      .single();

    if (error && error.code === "42P01") {
      // Table missing: fail gracefully so UI doesn’t crash
      console.warn("Table universal_messages missing — ignoring insert.");
      return res.json({ success: true, message: mapDBUniversal(insert) });
    }
    if (error) throw error;

    res.json({ success: true, message: mapDBUniversal(data) });
  } catch (e) {
    console.error("Universal chat POST error:", e);
    res.status(500).json({ error: e.message });
  }
});

// ========== MEMES ==========
app.post("/api/memes", async (req, res) => {
  try {
    const { walletAddress, message, imageData } = req.body;
    if (!walletAddress || !message || !imageData) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const now = Date.now();
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;

    // Check cooldown (latest meme from this wallet)
    const { data: last, error: lastErr } = await supabase
      .from("memes")
      .select("*")
      .eq("wallet_address", walletAddress)
      .order("created_at_ms", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!lastErr && last?.created_at_ms) {
      const elapsed = now - Number(last.created_at_ms);
      if (elapsed < oneWeekMs) {
        const msLeft = oneWeekMs - elapsed;
        const daysLeft = Math.ceil(msLeft / (24 * 60 * 60 * 1000));
        return res.status(429).json({
          error: `You can only post one meme per week. Try again in ~${daysLeft} day(s).`,
          retryAfterMs: msLeft,
        });
      }
    }

    const insert = {
      wallet_address: walletAddress,
      message,
      image_data: imageData,
      votes: 0,
      created_at_ms: now,
    };

    const { data, error } = await supabase
      .from("memes")
      .insert([insert])
      .select()
      .single();
    if (error) throw error;

    res.json({ success: true, meme: mapDBMeme(data) });
  } catch (err) {
    console.error("POST /api/memes error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/memes", async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("memes")
      .select("*")
      .order("created_at_ms", { ascending: false });
    if (error) throw error;

    res.json({ success: true, memes: (data ?? []).map(mapDBMeme) });
  } catch (err) {
    console.error("GET /api/memes error:", err);
    res.status(500).json({ error: err.message });
  }
});

aapp.post("/api/memes/:id/vote", async (req, res) => {
  try {
    const memeId = req.params.id;
    const { walletAddress } = req.body;

    if (!memeId || !walletAddress) {
      return res.status(400).json({ success: false, error: "Missing fields" });
    }

    // 1) Check duplicate
    const { data: existing } = await supabase
      .from("meme_votes")
      .select("id")
      .eq("meme_id", memeId)
      .eq("wallet_address", walletAddress)
      .maybeSingle();

    if (existing) {
      // Return the current meme so UI can refresh count if needed
      const { data: memeNow } = await supabase
        .from("memes")
        .select("*")
        .eq("id", memeId)
        .single();

      return res.json({
        success: true,
        alreadyVoted: true,
        meme: memeNow || null,
      });
    }

    // 2) Insert a vote record (enforced by unique constraint too)
    const ins = await supabase.from("meme_votes").insert([
      { meme_id: memeId, wallet_address: walletAddress },
    ]);
    if (ins.error) {
      // If this fails due to unique constraint, treat as already voted.
      if (ins.error.code === "23505") {
        const { data: memeNow } = await supabase
          .from("memes")
          .select("*")
          .eq("id", memeId)
          .single();

        return res.json({
          success: true,
          alreadyVoted: true,
          meme: memeNow || null,
        });
      }
      throw ins.error;
    }

    // 3) Increment the meme's votes
    const { data: current } = await supabase
      .from("memes")
      .select("votes")
      .eq("id", memeId)
      .single();

    const newVotes = (current?.votes || 0) + 1;

    const { data: updated, error: updErr } = await supabase
      .from("memes")
      .update({ votes: newVotes })
      .eq("id", memeId)
      .select()
      .single();
    if (updErr) throw updErr;

    // 4) Return updated meme
    res.json({
      success: true,
      alreadyVoted: false,
      meme: updated,
    });
  } catch (err) {
    console.error("POST /api/memes/:id/vote error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});


// ---------- 404 ----------
app.use((req, res) =>
  res.status(404).json({ error: "Not Found", path: req.originalUrl })
);

// ---------- Start ----------
const PORT = process.env.PORT || 5175;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`✅ OneForAll backend running on http://0.0.0.0:${PORT}`)
);


// this is the working code



// ---------- Load .env first ----------
import dotenv from "dotenv";
dotenv.config({ path: "/root/oneForAll/.env" });

// ---------- Imports ----------
import express from "express";
import bodyParser from "body-parser";
import helmet from "helmet";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";
import nacl from "tweetnacl";
import bs58 from "bs58";

// ---------- Initialize ----------
const app = express();
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const { JWT_SECRET, HELIUS_RPC, SIWS_DOMAIN = "oneforall.fun" } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env");
  process.exit(1);
}

if (!JWT_SECRET || !HELIUS_RPC) {
  console.warn("⚠️ Missing JWT_SECRET or HELIUS_RPC in .env");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ---------- Middlewares ----------
const allowedOrigins = [
  "http://localhost:5174",
  "https://oneforall.fun",
  "https://www.oneforall.fun",
  "https://api.oneforall.fun",
];

app.use((req, res, next) => {
  try {
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    }
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
  } catch (e) {
    console.error("CORS error:", e);
    next();
  }
});

app.use(
  helmet({
    crossOriginResourcePolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);
app.use(bodyParser.json({ limit: "25mb" }));

// ---------- Validators ----------
function isValidWallet(wallet) {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(wallet) || (wallet && wallet.length > 2);
}
function isValidConversationId(id) {
  if (typeof id !== "string" || !id.includes("_")) return false;
  const [w1, w2] = id.split("_");
  return (isValidWallet(w1) && isValidWallet(w2)) || (w1?.length > 2 && w2?.length > 2);
}

// ---------- Mappers ----------
const mapDBMessage = (row) => ({
  id: row.id ?? String(row.created_at ?? Date.now()),
  conversationId: row.conversation_id,
  senderWallet: row.sender_wallet,
  body: row.body,
  createdAt: row.created_at ?? new Date().toISOString(),
});

const mapDBMeme = (row) => ({
  id: String(row.id),
  walletAddress: row.wallet_address,
  message: row.message,
  imageData: row.image_data,
  votes: row.votes ?? 0,
  createdAt: row.created_at ?? new Date().toISOString(),
});

// ---------- HEALTH ----------
app.get("/health", (_req, res) => res.send("✅ OneForAll API is Live!"));

// ---------- ROOT ----------
app.get("/", (_req, res) => res.send("✅ OneForAll API is live and connected to Supabase!"));

// ========== DM CHAT ==========
app.post("/api/conversations/dm", async (req, res) => {
  try {
    const { meWallet, otherWallet } = req.body;
    if (!isValidWallet(meWallet) || !isValidWallet(otherWallet)) {
      return res.status(400).json({ error: "Invalid wallet addresses" });
    }
    const conversationId =
      meWallet < otherWallet
        ? `${meWallet}_${otherWallet}`
        : `${otherWallet}_${meWallet}`;
    res.json({ success: true, conversationId });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ========== MESSAGES ==========
app.post("/api/messages", async (req, res) => {
  try {
    const { conversationId, senderWallet, body } = req.body;
    if (!conversationId || !senderWallet || !body) {
      return res.status(400).json({ error: "Missing fields" });
    }
    const { data, error } = await supabase
      .from("messages")
      .insert([{ conversation_id: conversationId, sender_wallet: senderWallet, body }])
      .select()
      .single();
    if (error) throw error;
    res.json({ success: true, message: mapDBMessage(data) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/messages", async (req, res) => {
  try {
    const { conversationId } = req.query;
    if (!conversationId)
      return res.status(400).json({ error: "conversationId required" });
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    res.json({ success: true, messages: data.map(mapDBMessage) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ========== UNIVERSAL CHAT ==========
app.get("/api/universal/messages", async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("universal_messages")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw error;
    res.json({ success: true, messages: data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/universal/messages", async (req, res) => {
  try {
    const { senderWallet, body } = req.body;
    if (!senderWallet || !body)
      return res.status(400).json({ error: "Missing fields" });
    const { data, error } = await supabase
      .from("universal_messages")
      .insert([{ sender_wallet: senderWallet, body }])
      .select()
      .single();
    if (error) throw error;
    res.json({ success: true, message: data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ========== AUTH (Dynamic SIWS + Helius + JWT) ==========
const siwsNonces = new Map();
function newNonce() { return bs58.encode(nacl.randomBytes(24)); }
function putNonce(wallet) {
  const nonce = newNonce();
  siwsNonces.set(wallet, { nonce, exp: Date.now() + 5 * 60 * 1000 });
  return nonce;
}
function getNonce(wallet) {
  const rec = siwsNonces.get(wallet);
  if (!rec || Date.now() > rec.exp) {
    siwsNonces.delete(wallet);
    return null;
  }
  return rec.nonce;
}
function clearNonce(wallet) { siwsNonces.delete(wallet); }

function buildSiwsMessage({ domain, wallet, nonce, issuedAt }) {
  return `domain: ${domain}
wallet: ${wallet}
nonce: ${nonce}
issuedAt: ${issuedAt}

Sign this message to authenticate with ${domain}.`;
}
function verifySignature({ message, signatureBase58, walletBase58 }) {
  const msgBytes = new TextEncoder().encode(message);
  const sig = bs58.decode(signatureBase58);
  const pub = bs58.decode(walletBase58);
  return nacl.sign.detached.verify(msgBytes, sig, pub);
}
async function getHolderBalance(heliusRpc, owner, mint) {
  const TOKEN_PROGRAM = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
  const TOKEN_2022 = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
  const q = (programId) => ({
    jsonrpc: "2.0",
    id: "gate",
    method: "getTokenAccountsByOwner",
    params: [owner, { mint }, { encoding: "jsonParsed", programId }],
  });
  const fetchProg = async (pid) =>
    fetch(heliusRpc, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(q(pid)),
    })
      .then((r) => r.json())
      .then((j) => j.result?.value ?? []);
  const [a, b] = await Promise.all([fetchProg(TOKEN_PROGRAM), fetchProg(TOKEN_2022)]);
  return [...a, ...b].reduce(
    (sum, acc) => sum + (acc?.account?.data?.parsed?.info?.tokenAmount?.uiAmount ?? 0),
    0
  );
}

app.get("/auth/siws-input", (req, res) => {
  const wallet = String(req.query.wallet || "").trim();
  if (!wallet) return res.status(400).json({ error: "wallet required" });
  const nonce = putNonce(wallet);
  const issuedAt = new Date().toISOString();
  const message = buildSiwsMessage({ domain: SIWS_DOMAIN, wallet, nonce, issuedAt });
  res.json({ domain: SIWS_DOMAIN, wallet, nonce, issuedAt, message });
});

app.post("/auth/siws-verify", async (req, res) => {
  try {
    const { wallet, message, signatureBase58, mint, min = 1 } = req.body || {};
    if (!wallet || !message || !signatureBase58)
      return res.status(400).json({ error: "wallet, message, signature required" });

    const cachedNonce = getNonce(wallet);
    if (!cachedNonce || !message.includes(`nonce: ${cachedNonce}`))
      return res.status(401).json({ error: "Invalid or expired nonce" });

    const ok = verifySignature({ message, signatureBase58, walletBase58: wallet });
    if (!ok) return res.status(401).json({ error: "Signature invalid" });

    let isHolder = true;
    let bal = 0;
    if (mint) {
      bal = await getHolderBalance(HELIUS_RPC, wallet, mint);
      isHolder = bal >= Number(min);
    }

    const token = jwt.sign(
      { sub: wallet, mint: mint || null, min: Number(min), bal },
      JWT_SECRET,
      { expiresIn: "15m" }
    );
    clearNonce(wallet);

    res.json({ success: true, token, holder: isHolder, balance: bal, expiresIn: 900 });
  } catch (e) {
    res.status(500).json({ error: "SIWS verification failed" });
  }
});

export async function requireHolder(req, res, next) {
  try {
    const token = (req.headers.authorization || "").split(" ")[1];
    if (!token) return res.status(401).json({ error: "Missing token" });
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.mint) {
      const bal = await getHolderBalance(HELIUS_RPC, decoded.sub, decoded.mint);
      if (bal < (decoded.min || 1))
        return res.status(403).json({ error: "Not a holder anymore" });
    }
    req.holderWallet = decoded.sub;
    next();
  } catch (e) {
    res.status(401).json({ error: "Unauthorized" });
  }
}

// ========== MEMES ==========
app.post("/api/memes", requireHolder, async (req, res) => {
  try {
    const walletAddress = req.holderWallet;
    const { message, imageData } = req.body;
    if (!walletAddress || !message || !imageData)
      return res.status(400).json({ error: "Missing fields" });
    const insert = { wallet_address: walletAddress, message, image_data: imageData, votes: 0 };
    const { data, error } = await supabase.from("memes").insert([insert]).select().single();
    if (error) throw error;
    res.json({ success: true, meme: mapDBMeme(data) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/memes", async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("memes")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.json({ success: true, memes: data.map(mapDBMeme) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/memes/:id/vote", requireHolder, async (req, res) => {
  try {
    const walletAddress = req.holderWallet;
    const memeId = req.params.id;
    const { data: existing } = await supabase
      .from("meme_votes")
      .select("id")
      .eq("meme_id", memeId)
      .eq("wallet_address", walletAddress)
      .maybeSingle();
    if (existing)
      return res.json({ success: true, alreadyVoted: true });

    const ins = await supabase
      .from("meme_votes")
      .insert([{ meme_id: memeId, wallet_address: walletAddress }]);
    if (ins.error && ins.error.code !== "23505") throw ins.error;

    const { data: current } = await supabase
      .from("memes")
      .select("votes")
      .eq("id", memeId)
      .single();
    const newVotes = (current?.votes || 0) + 1;
    const { data: updated } = await supabase
      .from("memes")
      .update({ votes: newVotes })
      .eq("id", memeId)
      .select()
      .single();
    res.json({ success: true, meme: updated });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ---------- 404 ----------
app.use((req, res) =>
  res.status(404).json({ error: "Not Found", path: req.originalUrl })
);

// ---------- Start ----------
const PORT = process.env.PORT || 5175;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`✅ OneForAll backend running on http://0.0.0.0:${PORT}`)
);


// this is the updated working

