import { putImage } from "@/lib/storage";

const ALLOWED = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const EXT_BY_TYPE: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};
const MAX_BYTES = 8 * 1024 * 1024; // 8 Mo en entrée (on compresse derrière si possible)
const MAX_DIM = 1024; // dimension max après redimensionnement

/**
 * Enregistre une image uploadée et renvoie son URL publique. Persistance via
 * `@/lib/storage` : disque local en dev, Vercel Blob en prod (voir storage.ts).
 *
 * Compression : on TENTE de redimensionner + convertir en WebP via `sharp`,
 * mais `sharp` est un module natif qui ne se charge pas toujours en serverless
 * (Vercel). En cas d'échec, on **stocke l'image d'origine telle quelle** plutôt
 * que de faire échouer l'upload — la fonctionnalité prime sur l'optimisation.
 */
export async function saveUploadedImage(file: File): Promise<{ url?: string; error?: string }> {
  if (!file || file.size === 0) return { error: "Aucun fichier sélectionné." };
  if (!ALLOWED.includes(file.type)) return { error: "Format non supporté (PNG, JPG, WEBP, GIF)." };
  if (file.size > MAX_BYTES) return { error: "Image trop lourde (max 8 Mo)." };

  const slug = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const input = Buffer.from(await file.arrayBuffer());

  // 1) Tentative de compression via sharp (import dynamique : un échec de
  //    chargement du module natif ne doit pas casser le fichier entier).
  try {
    const { default: sharp } = await import("sharp");
    const output = await sharp(input)
      .rotate() // respecte l'orientation EXIF
      .resize(MAX_DIM, MAX_DIM, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
    const url = await putImage(`${slug}.webp`, output, "image/webp");
    return { url };
  } catch (err) {
    console.error("saveUploadedImage: compression sharp indisponible, stockage de l'original —", err);
  }

  // 2) Repli : stocker l'image d'origine sans compression (déjà validée).
  try {
    const ext = EXT_BY_TYPE[file.type] ?? "img";
    const url = await putImage(`${slug}.${ext}`, input, file.type);
    return { url };
  } catch (err) {
    console.error("saveUploadedImage: échec du stockage —", err);
    return { error: "Enregistrement de l'image impossible. Réessaie plus tard." };
  }
}
