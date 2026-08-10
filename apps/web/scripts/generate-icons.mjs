// Einmaliges Build-Skript, erzeugt public/icons/*.png aus dem FORT-Logo-Pfad.
// Nicht Teil des Next-Builds — bei Bedarf manuell mit `node scripts/generate-icons.mjs` neu laufen lassen.
import sharp from "sharp";
import { mkdirSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "public", "icons");
mkdirSync(outDir, { recursive: true });

const LOGO_PATH =
  "M1753.937,375.183l1463.813,2882.054l0,553.689l-866.542,774.52l-412.414,0l-184.857,-2888.01l-184.857,2888.01l-412.414,0l-866.542,-774.52l0,-553.689l1463.813,-2882.054Z";
const VB_W = 3508;
const VB_H = 4961;
const BG = "#081e24";
const FG = "#ececE6";

function iconSvg(size, { scaleFactor = 0.55, rounded = true } = {}) {
  const scale = (size * scaleFactor) / Math.max(VB_W, VB_H);
  const tx = (size - VB_W * scale) / 2;
  const ty = (size - VB_H * scale) / 2;
  const rx = rounded ? size * 0.22 : 0;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${rx}" fill="${BG}"/>
  <g transform="translate(${tx},${ty}) scale(${scale})">
    <path d="${LOGO_PATH}" fill="${FG}"/>
  </g>
</svg>`;
}

const targets = [
  { file: "icon-192.png", size: 192, opts: { scaleFactor: 0.55, rounded: true } },
  { file: "icon-512.png", size: 512, opts: { scaleFactor: 0.55, rounded: true } },
  { file: "icon-512-maskable.png", size: 512, opts: { scaleFactor: 0.4, rounded: false } },
  { file: "apple-touch-icon.png", size: 180, opts: { scaleFactor: 0.55, rounded: true } },
];

for (const t of targets) {
  const svg = iconSvg(t.size, t.opts);
  await sharp(Buffer.from(svg)).png().toFile(join(outDir, t.file));
  console.log("wrote", t.file);
}
