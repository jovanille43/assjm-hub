import { writeFile, mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";

/* ────────────────────────────────────────────────────────────────────────────
   Abstraction de stockage des médias uploadés (photos de profil, galerie).

   Trois backends, choisis automatiquement selon l'environnement :
   - Vercel Blob : si `BLOB_READ_WRITE_TOKEN` est présent (injecté par Vercel
     quand un Blob store est connecté au projet) OU `MEDIA_STORAGE=vercel`.
     C'est le mode prod sur Vercel — le FS serverless est éphémère, les fichiers
     écrits sur disque seraient perdus à chaque déploiement. Les URLs renvoyées
     sont des URLs CDN publiques absolues (servies directement, pas via /api/media).
   - Netlify Blobs : si `MEDIA_STORAGE=blobs` (legacy Netlify), servis via la
     route /api/media/[key].
   - Disque local `public/uploads` (dev / auto-hébergé) : servi en statique.

   `putImage` renvoie l'URL publique à stocker en base — le backend décide de sa
   forme (absolue pour Vercel Blob, relative sinon).
   ──────────────────────────────────────────────────────────────────────────── */

const STORE = "uploads";
const localDir = () => join(process.cwd(), "public", "uploads");

const USE_VERCEL_BLOB =
  process.env.MEDIA_STORAGE === "vercel" || !!process.env.BLOB_READ_WRITE_TOKEN;
const USE_NETLIFY_BLOBS = !USE_VERCEL_BLOB && process.env.MEDIA_STORAGE === "blobs";

/** Le backend actif est-il distant (Vercel Blob ou Netlify Blobs) ? */
export function usingBlobs(): boolean {
  return USE_VERCEL_BLOB || USE_NETLIFY_BLOBS;
}

/**
 * Persiste une image (déjà compressée en WebP) et renvoie son URL publique.
 * Pour Vercel Blob, l'URL est absolue (CDN) ; sinon relative au site.
 */
export async function putImage(name: string, data: Buffer): Promise<string> {
  if (USE_VERCEL_BLOB) {
    const { put } = await import("@vercel/blob");
    // `put` lit automatiquement BLOB_READ_WRITE_TOKEN dans l'environnement.
    // Le nom est déjà unique (timestamp + aléa) → pas de suffixe aléatoire.
    const res = await put(`${STORE}/${name}`, data, {
      access: "public",
      contentType: "image/webp",
      addRandomSuffix: false,
    });
    return res.url;
  }
  if (USE_NETLIFY_BLOBS) {
    const { getStore } = await import("@netlify/blobs");
    // Buffer → Blob (entrée acceptée par l'API Blobs, sans souci de type).
    await getStore(STORE).set(name, new Blob([data]));
    return `/api/media/${name}`;
  }
  const dir = localDir();
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, name), data);
  return `/uploads/${name}`;
}

/**
 * Lit une image stockée. Utilisé par la route /api/media (mode Netlify Blobs)
 * et comme repli disque local. Inutile en mode Vercel Blob (URLs CDN directes).
 */
export async function getImage(name: string): Promise<Buffer | null> {
  if (USE_NETLIFY_BLOBS) {
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

/**
 * URL publique d'un média à partir de son nom, pour les backends qui servent
 * via une route/route statique (Netlify Blobs, disque local). En mode Vercel
 * Blob, l'URL absolue est renvoyée directement par `putImage` (à stocker telle
 * quelle) — cette fonction n'est pas utilisée dans ce cas.
 */
export function mediaUrl(name: string): string {
  return USE_NETLIFY_BLOBS ? `/api/media/${name}` : `/uploads/${name}`;
}
