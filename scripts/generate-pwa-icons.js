/**
 * App Icon Generator
 * Generates PWA and Android icons from Bilavnova logo PNG files
 *
 * Usage: node scripts/generate-pwa-icons.js
 *
 * Source files:
 * - public/Bilavnova-Logo-Light-Bg.png (light background - for dark mode)
 * - public/Bilavnova-Logo-Dark-Bg.png (dark background - for light mode / main icon)
 */

import sharp from 'sharp';
import { mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Source images
const darkBgLogo = join(rootDir, 'public/Bilavnova-Logo-Dark-Bg.png');   // Main icon (dark bg)
const lightBgLogo = join(rootDir, 'public/Bilavnova-Logo-Light-Bg.png'); // Alternative (light bg)

// Output directories
const publicDir = join(rootDir, 'public');
const androidResDir = join(rootDir, 'android/app/src/main/res');

// Ensure directories exist
if (!existsSync(publicDir)) {
  mkdirSync(publicDir, { recursive: true });
}

// PWA icon sizes
const pwaIcons = [
  { name: 'pwa-192x192.png', size: 192 },
  { name: 'pwa-512x512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'favicon-16x16.png', size: 16 },
];

// Android mipmap sizes (for launcher icons)
const androidMipmaps = [
  { folder: 'mipmap-mdpi', size: 48 },
  { folder: 'mipmap-hdpi', size: 72 },
  { folder: 'mipmap-xhdpi', size: 96 },
  { folder: 'mipmap-xxhdpi', size: 144 },
  { folder: 'mipmap-xxxhdpi', size: 192 },
];

// Android adaptive icon foreground sizes (with safe zone padding)
const androidForegrounds = [
  { folder: 'mipmap-mdpi', size: 108 },
  { folder: 'mipmap-hdpi', size: 162 },
  { folder: 'mipmap-xhdpi', size: 216 },
  { folder: 'mipmap-xxhdpi', size: 324 },
  { folder: 'mipmap-xxxhdpi', size: 432 },
];

async function generatePWAIcons() {
  console.log('Generating PWA icons from Bilavnova-Logo-Dark-Bg.png...\n');

  for (const icon of pwaIcons) {
    const outputPath = join(publicDir, icon.name);

    try {
      await sharp(darkBgLogo)
        .resize(icon.size, icon.size, {
          fit: 'contain',
          background: { r: 15, g: 23, b: 42, alpha: 1 } // slate-900
        })
        .png()
        .toFile(outputPath);

      console.log(`  ✓ ${icon.name} (${icon.size}x${icon.size})`);
    } catch (error) {
      console.error(`  ✗ Failed ${icon.name}:`, error.message);
    }
  }

  // Maskable icon (with padding for safe zone)
  try {
    const maskableSize = 512;
    const iconSize = Math.floor(maskableSize * 0.7); // 70% of canvas
    const padding = Math.floor((maskableSize - iconSize) / 2);

    // Create base with brand color background
    const baseImage = await sharp({
      create: {
        width: maskableSize,
        height: maskableSize,
        channels: 4,
        background: { r: 26, g: 90, b: 142, alpha: 1 } // Lavpop blue #1a5a8e
      }
    }).png().toBuffer();

    // Resize logo
    const logoResized = await sharp(darkBgLogo)
      .resize(iconSize, iconSize, { fit: 'contain' })
      .toBuffer();

    // Composite
    await sharp(baseImage)
      .composite([{
        input: logoResized,
        top: padding,
        left: padding
      }])
      .png()
      .toFile(join(publicDir, 'pwa-maskable-512x512.png'));

    console.log(`  ✓ pwa-maskable-512x512.png (512x512 with safe zone)`);
  } catch (error) {
    console.error(`  ✗ Failed maskable icon:`, error.message);
  }
}

async function generateAndroidIcons() {
  if (!existsSync(androidResDir)) {
    console.log('\nAndroid project not found, skipping Android icons.');
    return;
  }

  console.log('\nGenerating Android launcher icons...\n');

  // Standard launcher icons (ic_launcher.png)
  for (const mipmap of androidMipmaps) {
    const outputDir = join(androidResDir, mipmap.folder);
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    try {
      await sharp(darkBgLogo)
        .resize(mipmap.size, mipmap.size, {
          fit: 'contain',
          background: { r: 15, g: 23, b: 42, alpha: 1 }
        })
        .png()
        .toFile(join(outputDir, 'ic_launcher.png'));

      console.log(`  ✓ ${mipmap.folder}/ic_launcher.png (${mipmap.size}x${mipmap.size})`);
    } catch (error) {
      console.error(`  ✗ Failed ${mipmap.folder}/ic_launcher.png:`, error.message);
    }

    // Round icon
    try {
      const roundedImage = await sharp(darkBgLogo)
        .resize(mipmap.size, mipmap.size, {
          fit: 'contain',
          background: { r: 15, g: 23, b: 42, alpha: 1 }
        })
        .png()
        .toBuffer();

      // Create circular mask
      const circleMask = Buffer.from(
        `<svg width="${mipmap.size}" height="${mipmap.size}">
          <circle cx="${mipmap.size/2}" cy="${mipmap.size/2}" r="${mipmap.size/2}" fill="white"/>
        </svg>`
      );

      await sharp(roundedImage)
        .composite([{
          input: circleMask,
          blend: 'dest-in'
        }])
        .png()
        .toFile(join(outputDir, 'ic_launcher_round.png'));

      console.log(`  ✓ ${mipmap.folder}/ic_launcher_round.png (${mipmap.size}x${mipmap.size})`);
    } catch (error) {
      console.error(`  ✗ Failed ${mipmap.folder}/ic_launcher_round.png:`, error.message);
    }
  }

  // Adaptive icon foreground (ic_launcher_foreground.png)
  console.log('\nGenerating Android adaptive icon foregrounds...\n');

  for (const fg of androidForegrounds) {
    const outputDir = join(androidResDir, fg.folder);
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    try {
      // Adaptive icons need logo centered with padding (safe zone is 66% of icon)
      const logoSize = Math.floor(fg.size * 0.5); // 50% for logo
      const padding = Math.floor((fg.size - logoSize) / 2);

      // Create transparent base
      const baseImage = await sharp({
        create: {
          width: fg.size,
          height: fg.size,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
      }).png().toBuffer();

      // Resize logo
      const logoResized = await sharp(lightBgLogo) // Use light bg version for foreground
        .resize(logoSize, logoSize, { fit: 'contain' })
        .toBuffer();

      // Composite
      await sharp(baseImage)
        .composite([{
          input: logoResized,
          top: padding,
          left: padding
        }])
        .png()
        .toFile(join(outputDir, 'ic_launcher_foreground.png'));

      console.log(`  ✓ ${fg.folder}/ic_launcher_foreground.png (${fg.size}x${fg.size})`);
    } catch (error) {
      console.error(`  ✗ Failed ${fg.folder}/ic_launcher_foreground.png:`, error.message);
    }
  }
}

async function generateFavicon() {
  console.log('\nGenerating favicon.ico...\n');

  try {
    // Generate multiple sizes for favicon
    const sizes = [16, 32, 48];
    const buffers = await Promise.all(
      sizes.map(size =>
        sharp(darkBgLogo)
          .resize(size, size, {
            fit: 'contain',
            background: { r: 15, g: 23, b: 42, alpha: 1 }
          })
          .png()
          .toBuffer()
      )
    );

    // For simplicity, just use 32x32 as favicon.ico (browsers handle it)
    await sharp(darkBgLogo)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 15, g: 23, b: 42, alpha: 1 }
      })
      .png()
      .toFile(join(publicDir, 'favicon.ico'));

    console.log(`  ✓ favicon.ico (32x32)`);
  } catch (error) {
    console.error(`  ✗ Failed favicon.ico:`, error.message);
  }
}

async function main() {
  console.log('='.repeat(50));
  console.log('App Icon Generator - Bilavnova');
  console.log('='.repeat(50));
  console.log('');

  await generatePWAIcons();
  await generateAndroidIcons();
  await generateFavicon();

  console.log('\n' + '='.repeat(50));
  console.log('Done! Run "npx cap sync" to update Android project.');
  console.log('='.repeat(50));
}

main().catch(console.error);
