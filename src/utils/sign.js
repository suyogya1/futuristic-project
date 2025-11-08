import bs58 from "bs58";

export async function signEnvelope(envelope) {
  const encoded = new TextEncoder().encode(envelope);
  const { signature } = await window.solana.signMessage(encoded, "utf8");
  return bs58.encode(signature);
}
