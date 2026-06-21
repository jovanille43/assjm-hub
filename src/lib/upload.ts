import sharp from "sharp";
import { putImage, mediaUrl } from "@/lib/storage";

const ALLOWED = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const MAX_BYTES = 8 * 1024 * 1024; // 8 Mo en entrée (on compresse derrière)
const MAX_DIM = 1024; // dimension max après redimensionnement

/**
 * Enregistre une image uploadée — redimensionnée et compressée en WebP (via
 * sharp) pour rester légère. Renvoie son URL publique. La persistance passe par
 * `@/lib/storage` : disque local en dev, Netlify Blobs en prod (voir storage.ts).
 */
export async function saveUploadedImage(file: File): Promise<{ url?: string; error?: string }> {
  if (!file || file.size === 0) return { error: "Aucun fichier sélectionné." };
  if (!ALLOWED.includes(file.type)) return { error: "Format non supporté (PNG, JPG, WEBP, GIF)." };
  if (file.size > MAX_BYTES) return { error: "Image trop lourde (max 8 Mo)." };

  const name = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.webp`;
  const input = Buffer.from(await file.arrayBuffer());

  try {
    const output = await sharp(input)
      .rotate() // respecte l'orientation EXIF
      .resize(MAX_DIM, MAX_DIM, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
    await putImage(name, output);
    return { url: mediaUrl(name) };
  } catch {
    return { error: "Image illisible ou corrompue." };
  }
}
