/** Configuration publique du site (SEO, Open Graph, sitemap). */
export const siteConfig = {
  name: "ASSJM HUB",
  shortName: "ASSJM",
  description:
    "La plateforme qui fait vivre l'AS Saint-Just-Malmont : actualités, résultats, équipes, calendrier, cartes joueurs et la communauté du club, au même endroit.",
  // Pilotée par l'environnement ; repli local pour le dev.
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
} as const;
