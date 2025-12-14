/**
 * PWA Icon Generator
 * Generates PWA icons from the LogoNoBackground.svg
 *
 * Usage: node scripts/generate-pwa-icons.js
 */

import sharp from 'sharp';
import { readFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Read the SVG file
const svgPath = join(rootDir, 'src/assets/LogoNoBackground.svg');
const svgContent = readFileSync(svgPath, 'utf-8');

// Output directory
const publicDir = join(rootDir, 'public');
if (!existsSync(publicDir)) {
  mkdirSync(publicDir, { recursive: true });
}

// Icon sizes to generate
const icons = [
  { name: 'pwa-192x192.png', size: 192 },
  { name: 'pwa-512x512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'favicon-16x16.png', size: 16 },
];

async function generateIcons() {
  console.log('Generating PWA icons from LogoNoBackground.svg...\n');

  for (const icon of icons) {
    const outputPath = join(publicDir, icon.name);

    try {
      await sharp(Buffer.from(svgContent))
        .resize(icon.size, icon.size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background
        })
        .png()
        .toFile(outputPath);

      console.log(`✓ Generated ${icon.name} (${icon.size}x${icon.size})`);
    } catch (error) {
      console.error(`✗ Failed to generate ${icon.name}:`, error.message);
    }
  }

  // Also create a maskable icon with padding (for Android adaptive icons)
  try {
    const maskableSize = 512;
    const iconSize = Math.floor(maskableSize * 0.6); // 60% of the canvas for safe zone
    const padding = Math.floor((maskableSize - iconSize) / 2);

    await sharp({
      create: {
        width: maskableSize,
        height: maskableSize,
        channels: 4,
        background: { r: 26, g: 90, b: 142, alpha: 1 } // Lavpop blue background
      }
    })
    .composite([{
      input: await sharp(Buffer.from(svgContent))
        .resize(iconSize, iconSize)
        .toBuffer(),
      top: padding,
      left: padding
    }])
    .png()
    .toFile(join(publicDir, 'pwa-maskable-512x512.png'));

    console.log(`✓ Generated pwa-maskable-512x512.png (512x512 with safe zone)`);
  } catch (error) {
    console.error(`✗ Failed to generate maskable icon:`, error.message);
  }

  console.log('\nDone! Icons saved to /public/');
}

generateIcons().catch(console.error);
