/**
 * Résout l'URL du site depuis l'environnement, de façon défensive.
 * `.trim()` supprime espaces, retours chariot et BOM (U+FEFF) qu'un outil CLI
 * (PowerShell, etc.) peut injecter dans la valeur. La validation par `new URL`
 * garantit qu'on ne propage jamais une URL malformée à `metadataBase` — sinon le
 * build Next.js plante (« Invalid URL ») lors de la collecte des métadonnées.
 */
function resolveSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) {
    try {
      return new URL(raw).origin;
    } catch {
      // valeur malformée : on retombe sur le repli local plutôt que de planter.
    }
  }
  return "http://localhost:3000";
}

/** Configuration publique du site (SEO, Open Graph, sitemap). */
export const siteConfig = {
  name: "ASSJM HUB",
  shortName: "ASSJM",
  description:
    "La plateforme qui fait vivre l'AS Saint-Just-Malmont : actualités, résultats, équipes, calendrier, cartes joueurs et la communauté du club, au même endroit.",
  // Pilotée par l'environnement ; repli local pour le dev.
  url: resolveSiteUrl(),
} as const;
