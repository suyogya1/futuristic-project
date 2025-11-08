import bs58 from 'bs58';

export async function connectPhantom(): Promise<{ address: string }> {
  const provider = (window as any).solana;
  if (!provider || !provider.isPhantom) {
    throw new Error('Phantom not found. Install Phantom wallet.');
  }
  const { publicKey } = await provider.connect();
  return { address: publicKey.toString() };
}

export async function signEnvelope(envelope: string) {
  const provider = (window as any).solana;
  if (!provider?.signMessage) {
    throw new Error('Wallet does not support message signing.');
  }
  const encoded = new TextEncoder().encode(envelope);
  const { signature } = await provider.signMessage(encoded, 'utf8');
  const encodedSig = bs58.encode(signature);
  return encodedSig;
}
