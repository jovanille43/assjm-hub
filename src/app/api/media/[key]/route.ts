import { getImage } from "@/lib/storage";

// Sert les images stockées dans Netlify Blobs (mode serverless). En dev/local,
// les uploads sont servis en statique depuis /uploads — cette route n'est alors
// pas sollicitée, mais reste un repli fonctionnel (lecture disque).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const { key } = await params;

  // Anti-traversal : on n'accepte qu'un nom de fichier simple.
  if (!/^[a-z0-9._-]+$/i.test(key)) {
    return new Response("Not found", { status: 404 });
  }

  const buf = await getImage(key);
  if (!buf) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": "image/webp",
      // Noms de fichiers uniques → cache agressif immuable.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
