// Build OG image for WhatsApp / social share:
//   • Dark navy background (no colored box behind the logo)
//   • SINA logo in white, centered, sitting directly on the background
//   • Two tagline lines below the logo:
//       1) "الفرصة القادمة تبدأ هنا"
//       2) "سينا | استثمر بذكاء"
// Output: public/og-image.png (1200x630)
import sharp from "sharp";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const W = 1200, H = 630;

// Dark navy canvas — no side boxes, just a subtle gradient + faint gold glow.
// The logo sits directly on this background (no opaque tile behind it).
const bgSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"   stop-color="#0B1826"/>
      <stop offset="50%"  stop-color="#14283B"/>
      <stop offset="100%" stop-color="#0A1520"/>
    </linearGradient>
    <radialGradient id="halo" cx="50%" cy="42%" r="48%">
      <stop offset="0%"   stop-color="#E4C97A" stop-opacity="0.14"/>
      <stop offset="100%" stop-color="#E4C97A" stop-opacity="0"/>
    </radialGradient>
    <pattern id="dots" width="34" height="34" patternUnits="userSpaceOnUse">
      <circle cx="1" cy="1" r="1" fill="#ffffff" opacity="0.035"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <rect width="100%" height="100%" fill="url(#dots)"/>
  <rect width="100%" height="100%" fill="url(#halo)"/>
  <!-- Gold hairline accents -->
  <rect x="0" y="${H - 4}" width="100%" height="4" fill="#C2A86B"/>
  <line x1="${W/2 - 90}" y1="${H - 90}" x2="${W/2 + 90}" y2="${H - 90}" stroke="#C2A86B" stroke-opacity="0.35" stroke-width="1"/>
</svg>`;

// Tagline overlay — two lines under the logo. No text behind/around the logo itself.
const textSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <style>
    .tagline { font: 700 44px 'Tajawal','Segoe UI',sans-serif; fill: #ffffff; }
    .brand   { font: 500 26px 'Tajawal','Segoe UI',sans-serif; fill: #D7C084; letter-spacing: 2px; }
  </style>
  <text x="${W/2}" y="430" text-anchor="middle" class="tagline" direction="rtl">الفرصة القادمة تبدأ هنا</text>
  <text x="${W/2}" y="485" text-anchor="middle" class="brand"   direction="rtl">سينا  |  استثمر بذكاء</text>
</svg>`;

async function main() {
  const logoPath = resolve(ROOT, "src/assets/logo.png");
  const outPath  = resolve(ROOT, "public/og-image.png");

  const logoBuf  = readFileSync(logoPath);
  const logoMeta = await sharp(logoBuf).metadata();

  // Logo sized to be the focal element. Keeps aspect ratio.
  const targetH = 170;
  const scale   = targetH / logoMeta.height;
  const targetW = Math.round(logoMeta.width * scale);

  // Convert the logo to a white-on-transparent silhouette.
  //
  // logo.png is a BLACK glyph on a fully opaque WHITE background, so its
  // alpha channel is uniformly 255 — using it as a mask produces a solid
  // rectangle (this is what caused the white-box bug on WhatsApp previews).
  //
  // Instead, derive the mask from luminance: dark pixels are the glyph
  // (high opacity), bright pixels are background (zero opacity). Then use
  // that mask to cut a pure-white silhouette.
  const { data: rgba, info } = await sharp(logoBuf)
    .resize(targetW, targetH)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Build the white silhouette directly as an RGBA raw buffer:
  //   R=G=B=255 (pure white), A = derived opacity from (luminance × source alpha).
  // This avoids sharp's quirky single-channel-mask composite behaviour that
  // was producing a fully opaque rectangle.
  const outRgba = Buffer.alloc(info.width * info.height * 4);
  for (let i = 0; i < rgba.length; i += 4) {
    const r = rgba[i], g = rgba[i + 1], b = rgba[i + 2], srcA = rgba[i + 3];
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    let alpha;
    if (lum >= 245) alpha = 0;
    else if (lum <= 60) alpha = 255;
    else alpha = Math.round(255 * (1 - (lum - 60) / (245 - 60)));
    // Respect pre-existing alpha in the source PNG.
    alpha = Math.round((alpha * srcA) / 255);
    outRgba[i]     = 255;
    outRgba[i + 1] = 255;
    outRgba[i + 2] = 255;
    outRgba[i + 3] = alpha;
  }

  const whiteLogo = await sharp(outRgba, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();

  // Center the logo horizontally, position it in the upper third so the
  // tagline sits comfortably beneath it.
  const logoX = Math.round((W - targetW) / 2);
  const logoY = 150;

  await sharp(Buffer.from(bgSvg))
    .composite([
      { input: whiteLogo,              top: logoY, left: logoX },
      { input: Buffer.from(textSvg),   top: 0,     left: 0     },
    ])
    .png({ quality: 95, compressionLevel: 9 })
    .toFile(outPath);

  console.log(`Wrote ${outPath} (${W}x${H})`);
}

main().catch((e) => { console.error(e); process.exit(1); });
