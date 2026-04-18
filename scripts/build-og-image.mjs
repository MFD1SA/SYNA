// Build OG image: dark navy canvas + white-toned SINA logo + tagline
// Output: public/og-image.png (1200x630)
import sharp from "sharp";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const W = 1200, H = 630;

// Background SVG: deep navy gradient + gold glow + subtle dot pattern
const bgSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0F1F2E"/>
      <stop offset="50%" stop-color="#1E374B"/>
      <stop offset="100%" stop-color="#0A1520"/>
    </linearGradient>
    <radialGradient id="goldGlow" cx="85%" cy="20%" r="45%">
      <stop offset="0%" stop-color="#C2A86B" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#C2A86B" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="navyGlow" cx="10%" cy="90%" r="55%">
      <stop offset="0%" stop-color="#2B4C66" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#2B4C66" stop-opacity="0"/>
    </radialGradient>
    <pattern id="dots" width="32" height="32" patternUnits="userSpaceOnUse">
      <circle cx="1" cy="1" r="1" fill="#ffffff" opacity="0.04"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <rect width="100%" height="100%" fill="url(#goldGlow)"/>
  <rect width="100%" height="100%" fill="url(#navyGlow)"/>
  <rect width="100%" height="100%" fill="url(#dots)"/>
  <!-- Gold accent bar bottom -->
  <rect x="0" y="${H - 6}" width="100%" height="6" fill="#C2A86B"/>
</svg>`;

// Text SVG — rendered as image layer (Arabic + English title)
// Two-line: tagline under big brand title
const textSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <style>
    .brand-ar { font: 700 92px 'Tajawal','Segoe UI',sans-serif; fill: #ffffff; }
    .brand-en { font: 700 48px 'Segoe UI',sans-serif; fill: #D7C084; letter-spacing: 8px; }
    .tagline-ar { font: 500 34px 'Tajawal','Segoe UI',sans-serif; fill: rgba(255,255,255,0.78); }
    .license { font: 600 18px 'Segoe UI',sans-serif; fill: rgba(215,192,132,0.85); letter-spacing: 3px; }
  </style>
  <text x="${W/2}" y="390" text-anchor="middle" class="brand-ar" direction="rtl">سينا للاستثمارات العقارية</text>
  <text x="${W/2}" y="445" text-anchor="middle" class="brand-en">SINA · CIDOMA.COM</text>
  <text x="${W/2}" y="510" text-anchor="middle" class="tagline-ar" direction="rtl">شركة رقمية لشراكات التطوير العقاري</text>
  <text x="${W/2}" y="565" text-anchor="middle" class="license">LICENSED BY REGA</text>
</svg>`;

async function main() {
  const logoPath = resolve(ROOT, "src/assets/logo.png");
  const outPath = resolve(ROOT, "public/og-image.png");

  // Read logo, resize to height 140, invert to white version
  // Use composite with white fill via modulation: take alpha channel, tint white
  const logoBuf = readFileSync(logoPath);
  const logoMeta = await sharp(logoBuf).metadata();
  // Target: height 150, preserving aspect ratio
  const targetH = 150;
  const scale = targetH / logoMeta.height;
  const targetW = Math.round(logoMeta.width * scale);

  // Turn the logo white by extracting alpha and using it as mask over white pixel
  // Raw alpha channel (single byte per pixel)
  const alpha = await sharp(logoBuf)
    .resize(targetW, targetH)
    .extractChannel("alpha")
    .raw()
    .toBuffer();

  // Build a white version of the logo: white-filled rect masked by logo alpha
  const whiteFilled = await sharp({
    create: { width: targetW, height: targetH, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } }
  })
    .composite([{ input: alpha, blend: "dest-in", raw: { width: targetW, height: targetH, channels: 1 } }])
    .png()
    .toBuffer();

  const logoX = Math.round((W - targetW) / 2);
  const logoY = 160;

  await sharp(Buffer.from(bgSvg))
    .composite([
      { input: whiteFilled, top: logoY, left: logoX },
      { input: Buffer.from(textSvg), top: 0, left: 0 },
    ])
    .png({ quality: 95, compressionLevel: 9 })
    .toFile(outPath);

  console.log(`Wrote ${outPath} (${W}x${H})`);
}

main().catch((e) => { console.error(e); process.exit(1); });
