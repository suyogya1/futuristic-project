// src/utils/handleFileSend.js
import { supabase } from '../lib/supabase';
import { requestSignedUpload, finalizeMessageWithAttachment } from '../utils/api';

/**
 * Upload image/audio to Supabase and link to a message.
 */
export async function handleFileSend({ file, conversationId, senderWallet }) {
  if (!file) throw new Error('No file provided');
  if (!conversationId || !senderWallet)
    throw new Error('Missing conversationId or senderWallet');

  const kind = file.type.startsWith('audio/') ? 'audio' : 'image';

  const signed = await requestSignedUpload({
    conversationId,
    senderWallet,
    filename: file.name,
    contentType: file.type,
    kind,
    sizeBytes: file.size,
  });
  if (!signed?.bucket || !signed?.objectPath || !signed?.token)
    throw new Error('Invalid signed upload response');

  const up = await supabase.storage
    .from(signed.bucket)
    .uploadToSignedUrl(signed.objectPath, signed.token, file);
  if (up.error) throw up.error;

  let width, height, durationMs;

  if (kind === 'image') {
    try {
      const img = await new Promise((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = reject;
        i.src = URL.createObjectURL(file);
      });
      width = img.naturalWidth;
      height = img.naturalHeight;
    } catch (err) {
      console.warn('Failed to load image metadata:', err);
    }
  } else if (kind === 'audio') {
    try {
      durationMs = await new Promise((resolve) => {
        const a = new Audio(URL.createObjectURL(file));
        a.addEventListener('loadedmetadata', () =>
          resolve(Math.round(a.duration * 1000))
        );
      });
    } catch (err) {
      console.warn('Failed to load audio metadata:', err);
    }
  }

  const { message } = await finalizeMessageWithAttachment({
    conversationId,
    senderWallet,
    messageType: kind,
    attachment: {
      objectPath: signed.objectPath,
      bucket: signed.bucket,
      contentType: file.type,
      sizeBytes: file.size,
      width,
      height,
      durationMs,
    },
  });

  return message;
}
