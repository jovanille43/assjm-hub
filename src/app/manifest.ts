import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ASSJM HUB — AS Saint-Just-Malmont",
    short_name: "ASSJM HUB",
    description:
      "Le cœur numérique de l'AS Saint-Just-Malmont : actualités, résultats, équipes, calendrier et communauté.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a1733",
    theme_color: "#0E1E46",
    lang: "fr",
    categories: ["sports", "social"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
