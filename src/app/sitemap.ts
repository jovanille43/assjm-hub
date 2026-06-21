import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { siteConfig } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url.replace(/\/$/, "");

  const staticRoutes = [
    "",
    "/equipes",
    "/calendrier",
    "/joueurs",
    "/stats",
    "/galerie",
    "/connexion",
    "/inscription",
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.7,
  }));

  let teamRoutes: MetadataRoute.Sitemap = [];
  try {
    const teams = await db.team.findMany({ select: { slug: true } });
    teamRoutes = teams.map((t) => ({
      url: `${base}/equipes/${t.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    }));
  } catch {
    // base indisponible au build : on se contente des routes statiques
  }

  return [...staticRoutes, ...teamRoutes];
}
