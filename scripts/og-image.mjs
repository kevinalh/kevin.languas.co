// Renders the Open Graph preview card to public/og.png. The card is static, so
// rerun this (`node scripts/og-image.mjs`) when the name, role, or avatar
// changes. Text uses Noto Sans, which must be installed locally.
import sharp from "sharp";

const AVATAR_URL = "https://avatars.githubusercontent.com/u/3322228?s=600";
const WIDTH = 1200;
const HEIGHT = 630;
const AVATAR_SIZE = 300;
const AVATAR_X = 120;
const AVATAR_Y = (HEIGHT - AVATAR_SIZE) / 2;

const response = await fetch(AVATAR_URL);
if (!response.ok) {
  throw new Error(`Avatar request failed with status ${response.status}`);
}
const avatar = await sharp(Buffer.from(await response.arrayBuffer()))
  .resize(AVATAR_SIZE, AVATAR_SIZE)
  .png()
  .toBuffer();

// Colors from the Sage Ledger palette in src/styles/global.css.
const svg = `
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
  width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <clipPath id="avatar">
      <circle cx="${AVATAR_X + AVATAR_SIZE / 2}" cy="${HEIGHT / 2}" r="${AVATAR_SIZE / 2}" />
    </clipPath>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="#edf1ec" />
  <circle cx="${AVATAR_X + AVATAR_SIZE / 2}" cy="${HEIGHT / 2}" r="${AVATAR_SIZE / 2 + 8}" fill="#d3dbd1" />
  <image x="${AVATAR_X}" y="${AVATAR_Y}" width="${AVATAR_SIZE}" height="${AVATAR_SIZE}"
    clip-path="url(#avatar)"
    xlink:href="data:image/png;base64,${avatar.toString("base64")}" />
  <g font-family="Noto Sans">
    <text x="500" y="272" font-size="68" font-weight="700" fill="#1e2621">Kevin Languasco</text>
    <text x="500" y="342" font-size="38" fill="#3d453f">Distributed Systems Engineer</text>
    <text x="500" y="394" font-size="38" fill="#3d453f">Cloudflare · London</text>
    <text x="500" y="476" font-size="30" font-weight="600" fill="#2e6f40">kevin.languas.co</text>
  </g>
</svg>`;

await sharp(Buffer.from(svg))
  .png({ compressionLevel: 9, palette: true, quality: 90 })
  .toFile("public/og.png");
console.log("Wrote public/og.png");
