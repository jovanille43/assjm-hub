/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // `sharp` est un module natif : on le garde externe au bundle serverless pour
  // qu'il soit chargé depuis node_modules au runtime (sinon « Could not load the
  // sharp module » sur Vercel).
  serverExternalPackages: ["sharp"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "i.pravatar.cc" },
      { protocol: "https", hostname: "api.dicebear.com" },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
};

export default nextConfig;
