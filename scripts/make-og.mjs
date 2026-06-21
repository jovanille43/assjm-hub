// Génère l'image Open Graph statique (public/og.png) à partir d'un SVG brandé.
// Robuste multi-plateforme (contourne le bug Windows de next/og).
//   node scripts/make-og.mjs
import sharp from "sharp";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const W = 1200;
const H = 630;

const stripes = Array.from({ length: 24 }, (_, i) => {
  const w = (W - 80 * 2 - 23 * 8) / 24;
  const x = 80 + i * (w + 8);
  const color = i % 2 === 0 ? "#e11d2a" : "#1a2f5b";
  return `<rect x="${x.toFixed(1)}" y="64" width="${w.toFixed(1)}" height="10" rx="4" fill="${color}" />`;
}).join("");

const svg = `
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0a1733" />
      <stop offset="1" stop-color="#08122c" />
    </linearGradient>
    <radialGradient id="glow" cx="0.8" cy="-0.1" r="0.7">
      <stop offset="0" stop-color="#1a2f5b" stop-opacity="0.9" />
      <stop offset="1" stop-color="#08122c" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="emblem" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#26417c" />
      <stop offset="1" stop-color="#08122c" />
    </linearGradient>
    <style>
      .sans { font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; }
    </style>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)" />
  <rect width="${W}" height="${H}" fill="url(#glow)" />
  ${stripes}

  <!-- Emblème -->
  <rect x="80" y="250" width="104" height="104" rx="28" fill="url(#emblem)" stroke="rgba(255,255,255,0.12)" stroke-width="2" />
  <text x="132" y="318" text-anchor="middle" class="sans" font-size="40" font-weight="700" fill="#ffffff">AM</text>

  <!-- Eyebrow -->
  <text x="212" y="312" class="sans" font-size="24" font-weight="700" letter-spacing="8" fill="#e11d2a">CLUB AMATEUR · HAUTE-LOIRE</text>

  <!-- Wordmark -->
  <text x="78" y="440" class="sans" font-size="110" font-weight="800" letter-spacing="-2" fill="#ffffff">ASSJM <tspan fill="#e11d2a">HUB</tspan></text>

  <!-- Tagline -->
  <text x="80" y="500" class="sans" font-size="32" fill="#9fb2d4">Tout le club, au même endroit — l'AS Saint-Just-Malmont.</text>

  <!-- Footer -->
  <text x="80" y="574" class="sans" font-size="26" font-weight="700" fill="#6b80a8">AS Saint-Just-Malmont</text>
  <text x="${W - 80}" y="574" text-anchor="end" class="sans" font-size="26" font-weight="700" fill="#9fb2d4">Fier de nos couleurs</text>
</svg>`;

const out = join(process.cwd(), "public", "og.png");
const png = await sharp(Buffer.from(svg)).png().toBuffer();
writeFileSync(out, png);
console.log(`✅ OG image générée : public/og.png (${(png.length / 1024).toFixed(0)} Ko)`);
