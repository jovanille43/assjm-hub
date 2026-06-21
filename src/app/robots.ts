import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const base = siteConfig.url.replace(/\/$/, "");
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // L'espace membre et les routes techniques restent privés.
      disallow: ["/dashboard", "/api"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
