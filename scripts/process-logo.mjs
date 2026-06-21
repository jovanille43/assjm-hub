/**
 * Détoure le logo ASSJM : enlève le fond blanc EXTÉRIEUR (connecté aux bords)
 * tout en conservant le blanc INTÉRIEUR (lettres, ballon, rubans), via un
 * flood-fill depuis les bords. Recadre ensuite sur le blason.
 *
 * Usage : node scripts/process-logo.mjs
 */
import sharp from "sharp";

const SRC = "C:/Users/Utilisateur/Desktop/logo assjm.jpeg";
const OUT = "C:/Users/Utilisateur/Desktop/ASSJM-hub/public/logo-assjm.png";

const LIGHT = 200; // un pixel "clair" (fond) : chaque canal > LIGHT

const { data, info } = await sharp(SRC)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const { width, height, channels } = info;
const at = (x, y) => (y * width + x) * channels;
const isLight = (i) => data[i] > LIGHT && data[i + 1] > LIGHT && data[i + 2] > LIGHT;

const visited = new Uint8Array(width * height);
const qx = [];
const qy = [];
const seed = (x, y) => {
  if (x < 0 || y < 0 || x >= width || y >= height) return;
  const p = y * width + x;
  if (visited[p] || !isLight(at(x, y))) return;
  visited[p] = 1;
  qx.push(x);
  qy.push(y);
};

for (let x = 0; x < width; x++) {
  seed(x, 0);
  seed(x, height - 1);
}
for (let y = 0; y < height; y++) {
  seed(0, y);
  seed(width - 1, y);
}

let head = 0;
while (head < qx.length) {
  const x = qx[head];
  const y = qy[head];
  head++;
  seed(x + 1, y);
  seed(x - 1, y);
  seed(x, y + 1);
  seed(x, y - 1);
}

let minX = width;
let minY = height;
let maxX = 0;
let maxY = 0;
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const p = y * width + x;
    if (visited[p]) {
      data[at(x, y) + 3] = 0;
    } else {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}

const pad = 10;
minX = Math.max(0, minX - pad);
minY = Math.max(0, minY - pad);
maxX = Math.min(width - 1, maxX + pad);
maxY = Math.min(height - 1, maxY + pad);
const cw = maxX - minX + 1;
const ch = maxY - minY + 1;

await sharp(data, { raw: { width, height, channels: 4 } })
  .extract({ left: minX, top: minY, width: cw, height: ch })
  .png()
  .toFile(OUT);

console.log(`OK detourage : ${width}x${height} -> ${cw}x${ch}`);
console.log(`-> ${OUT}`);
