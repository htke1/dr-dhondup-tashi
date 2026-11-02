const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

function createSvg(size, maskable = false) {
  const center = size / 2;
  const rx = maskable ? 0 : Math.round(size * 0.22);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#8E3448" />
      <stop offset="100%" stop-color="#541724" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F2C981" />
      <stop offset="100%" stop-color="#C47F3A" />
    </linearGradient>
  </defs>

  <!-- Background Base -->
  <rect width="${size}" height="${size}" rx="${rx}" fill="url(#bgGrad)" />

  <!-- Outer Ring -->
  <circle cx="${center}" cy="${center}" r="${Math.round(size * 0.38)}" fill="none" stroke="url(#goldGrad)" stroke-width="${Math.round(size * 0.016)}" opacity="0.75" />
  <circle cx="${center}" cy="${center}" r="${Math.round(size * 0.34)}" fill="none" stroke="url(#goldGrad)" stroke-width="${Math.round(size * 0.008)}" stroke-dasharray="${Math.round(size * 0.018)} ${Math.round(size * 0.018)}" opacity="0.45" />

  <!-- Medical Cross Symbol -->
  <rect x="${Math.round(center - size * 0.07)}" y="${Math.round(center - size * 0.22)}" width="${Math.round(size * 0.14)}" height="${Math.round(size * 0.44)}" rx="${Math.round(size * 0.035)}" fill="url(#goldGrad)" />
  <rect x="${Math.round(center - size * 0.22)}" y="${Math.round(center - size * 0.07)}" width="${Math.round(size * 0.44)}" height="${Math.round(size * 0.14)}" rx="${Math.round(size * 0.035)}" fill="url(#goldGrad)" />

  <!-- Center Seal & Doctor Monogram -->
  <circle cx="${center}" cy="${center}" r="${Math.round(size * 0.11)}" fill="#541724" stroke="url(#goldGrad)" stroke-width="${Math.round(size * 0.012)}" />
  <text x="${center}" y="${Math.round(center + size * 0.038)}" font-family="Georgia, serif" font-size="${Math.round(size * 0.11)}px" font-weight="bold" fill="#FFFFFF" text-anchor="middle">DT</text>
</svg>`;
}

async function run() {
  const publicDir = path.resolve(__dirname, '..', 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const svg192 = Buffer.from(createSvg(192));
  const svg512 = Buffer.from(createSvg(512));
  const svgMaskable = Buffer.from(createSvg(512, true));
  const svgApple = Buffer.from(createSvg(180));

  await sharp(svg192).png().toFile(path.join(publicDir, 'icon-192.png'));
  await sharp(svg512).png().toFile(path.join(publicDir, 'icon-512.png'));
  await sharp(svgMaskable).png().toFile(path.join(publicDir, 'icon-maskable.png'));
  await sharp(svgApple).png().toFile(path.join(publicDir, 'apple-touch-icon.png'));

  // Also write raw SVG
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), createSvg(512));

  console.log('PWA icons successfully created in public directory');
}

run().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
