import { writeFile, mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";

/* ────────────────────────────────────────────────────────────────────────────
   Abstraction de stockage des médias uploadés (photos de profil, galerie).
   - Dev / auto-hébergé : disque local `public/uploads`, servi en statique.
   - Netlify (FS éphémère en serverless → les fichiers seraient perdus) :
     Netlify Blobs, servis via la route /api/media/[key].
   Bascule EXPLICITE via la variable d'env `MEDIA_STORAGE=blobs` (à poser dans
   les variables d'environnement Netlify). Par défaut : disque local.
   ──────────────────────────────────────────────────────────────────────────── */

const USE_BLOBS = process.env.MEDIA_STORAGE === "blobs";
const STORE = "uploads";
const localDir = () => join(process.cwd(), "public", "uploads");

/** Le backend actif est-il Netlify Blobs ? (sinon disque local). */
export function usingBlobs(): boolean {
  return USE_BLOBS;
}

/** Persiste une image (déjà compressée en WebP) sous un nom de fichier donné. */
export async function putImage(name: string, data: Buffer): Promise<void> {
  if (USE_BLOBS) {
    const { getStore } = await import("@netlify/blobs");
    // Buffer → Blob (entrée acceptée par l'API Blobs, sans souci de type).
    await getStore(STORE).set(name, new Blob([data]));
  } else {
    const dir = localDir();
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, name), data);
  }
}

/** Lit une image stockée (utilisé par la route /api/media en mode Blobs). */
export async function getImage(name: string): Promise<Buffer | null> {
  if (USE_BLOBS) {
    const { getStore } = await import("@netlify/blobs");
    const ab = (await getStore(STORE).get(name, { type: "arrayBuffer" })) as ArrayBuffer | null;
    return ab ? Buffer.from(ab) : null;
  }
  try {
    return await readFile(join(localDir(), name));
  } catch {
    return null;
  }
}

/** URL publique d'un média stocké, selon le backend actif. */
export function mediaUrl(name: string): string {
  return USE_BLOBS ? `/api/media/${name}` : `/uploads/${name}`;
}
