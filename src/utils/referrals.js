// src/utils/referrals.js

// ---- Deterministic code from a wallet public key (base58) ----
// We keep it readable but short. Change algorithm later if needed.
export function codeFromPubkey(pubkeyBase58 = "") {
  if (!pubkeyBase58) return "";
  // Take chunks + checksum-like tail
  const body = pubkeyBase58.slice(0, 4) + pubkeyBase58.slice(-4);
  const sum = Array.from(pubkeyBase58).reduce((a, c) => a + c.charCodeAt(0), 0);
  const tail = (sum % 1000).toString().padStart(3, "0");
  return `1FA-${body}-${tail}`.toUpperCase();
}

// Basic format check: 1FA-XXXXXXXX-### (len can vary a bit)
export function looksLikeCode(code = "") {
  return /^1FA-[A-Z0-9]{8,}-\d{3}$/i.test(code.trim());
}

// ---- Local storage helpers (front-end mock only) ----
const LS_CODES = "referral:codes";        // Map<code, ownerPubkey>
const LS_USED_BY = "referral:usedBy";     // Map<userPubkey, code>  (the code they used)
const LS_REFS = "referral:refs";          // Map<ownerPubkey, Set<referredPubkeys>>

function getMap(key) {
  try {
    return new Map(Object.entries(JSON.parse(localStorage.getItem(key) || "{}")));
  } catch {
    return new Map();
  }
}
function setMap(key, map) {
  localStorage.setItem(key, JSON.stringify(Object.fromEntries(map)));
}

export function registerMyCode(ownerPubkey, code) {
  const codes = getMap(LS_CODES);
  // Only register if not already owned by someone else
  const existingOwner = codes.get(code);
  if (existingOwner && existingOwner !== ownerPubkey) {
    // Extremely unlikely with deterministic algorithm, but guard anyway
    throw new Error("Referral code collision. Please contact support.");
  }
  codes.set(code, ownerPubkey);
  setMap(LS_CODES, codes);
}

export function findOwnerByCode(code) {
  const codes = getMap(LS_CODES);
  return codes.get(code) || null;
}

export function recordReferralUse(userPubkey, code) {
  // Mark which code a user used (and increment the owner’s referred set)
  const owner = findOwnerByCode(code);
  if (!owner) throw new Error("Invalid code.");
  const usedBy = getMap(LS_USED_BY);
  if (usedBy.get(userPubkey)) throw new Error("You have already used a referral code.");
  if (owner === userPubkey) throw new Error("You cannot use your own code.");

  usedBy.set(userPubkey, code);
  setMap(LS_USED_BY, usedBy);

  const refs = getMap(LS_REFS);
  const set = new Set(JSON.parse(refs.get(owner) || "[]"));
  set.add(userPubkey);
  refs.set(owner, JSON.stringify([...set]));
  setMap(LS_REFS, refs);

  return { owner, referredCount: set.size };
}

export function getUsedCode(userPubkey) {
  const usedBy = getMap(LS_USED_BY);
  return usedBy.get(userPubkey) || null;
}

export function getReferredCount(ownerPubkey) {
  const refs = getMap(LS_REFS);
  const arr = JSON.parse(refs.get(ownerPubkey) || "[]");
  return arr.length;
}

// Simple derived “status”
export function getRewardStatus(pubkey) {
  return {
    myReferredCount: getReferredCount(pubkey),
    usedCode: getUsedCode(pubkey),
  };
}
