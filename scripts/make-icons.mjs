/**
 * Génère les icônes d'INSTALLATION de l'app (PWA + iOS).
 * Usage : npm run icons   (ou : node scripts/make-icons.mjs)
 *
 * Source prioritaire : public/icon-source.png — l'icône carrée arrondie
 * fournie pour l'app. Dépose ce fichier puis lance `npm run icons`.
 * À défaut, repli sur le blason du club (logo-assjm.png) sur fond marine.
 *
 * ⚠️ Ne touche pas au logo du club affiché dans l'app (Crest / logo-assjm.png)
 *    ni au favicon d'onglet (src/app/icon.svg).
 */
import sharp from "sharp";
import { existsSync } from "node:fs";
import { join } from "node:path";

const PUB = join(process.cwd(), "public");
const SOURCE = join(PUB, "icon-source.png");
const FALLBACK = join(PUB, "logo-assjm.png");
const NAVY = { r: 14, g: 30, b: 70, alpha: 1 };

const useSource = existsSync(SOURCE);
const src = useSource ? SOURCE : FALLBACK;

// Masque coins arrondis (pour évacuer les coins crème du badge → fond marine).
function roundedMask(size, radiusRatio = 0.2) {
  const r = Math.round(size * radiusRatio);
  return Buffer.from(
    `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg"><rect width="${size}" height="${size}" rx="${r}" ry="${r}" fill="#fff"/></svg>`,
  );
}

// L'icône fournie a un cadre crème autour du badge → on le DÉTOURE (trim sur la
// couleur de bord), on remplit le cadre bord-à-bord, on arrondit les coins et on
// pose le tout sur fond marine : plus aucun liseré blanc, même après le masque iOS.
async function fromSource(size, name) {
  const over = Math.round(size * 1.09); // léger sur-cadrage…
  const inset = Math.round((over - size) / 2);
  const filled = await sharp(src)
    .trim({ threshold: 55 }) // enlève le pourtour crème + l'ombre douce
    .resize(over, over, { fit: "cover" })
    .extract({ left: inset, top: inset, width: size, height: size }) // …puis rogne le liseré résiduel
    .toBuffer();
  const rounded = await sharp(filled)
    .composite([{ input: roundedMask(size), blend: "dest-in" }]) // coins crème → transparents
    .png()
    .toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: NAVY } })
    .composite([{ input: rounded }]) // fond marine sous les coins
    .png()
    .toFile(join(PUB, name));
  console.log(`✓ ${name} (${size}×${size}) — depuis icon-source.png (cadre crème retiré)`);
}

// Repli : blason détouré centré sur fond marine, avec marge.
async function fromCrest(size, pad, name) {
  const inner = size - pad * 2;
  const logo = await sharp(src)
    .resize({ width: inner, height: inner, fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: NAVY } })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toFile(join(PUB, name));
  console.log(`✓ ${name} (${size}×${size}) — repli blason`);
}

const targets = [
  { size: 192, pad: 26, name: "icon-192.png" },
  { size: 512, pad: 72, name: "icon-512.png" },
  { size: 180, pad: 24, name: "apple-icon.png" },
];

for (const t of targets) {
  if (useSource) await fromSource(t.size, t.name);
  else await fromCrest(t.size, t.pad, t.name);
}

console.log(
  useSource
    ? "\n🎉 Icône d'app mise à jour depuis icon-source.png. Le logo du club reste inchangé."
    : "\nℹ️ icon-source.png absent — icônes régénérées depuis le blason. Dépose public/icon-source.png pour utiliser ton icône d'app.",
);
