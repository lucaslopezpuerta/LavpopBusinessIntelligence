/**
 * App Icon Generator
 * Generates PWA and Android icons from Bilavnova logo files
 *
 * Usage: node scripts/generate-pwa-icons.js
 *
 * Source files (in src/assets/Logo Files/):
 * - Favicons/Android.png - Main icon for Android and PWA
 * - Favicons/iPhone.png - Apple touch icon
 * - Favicons/browser.png - Browser favicon
 * - png/Color logo - no background.png - Full color logo
 * - png/White logo - no background.png - White logo for dark backgrounds
 */

import sharp from 'sharp';
import { mkdirSync, existsSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Source images from src/assets/Logo Files/
const logoFilesDir = join(rootDir, 'src/assets/Logo Files');
const androidIcon = join(logoFilesDir, 'Favicons/Android.png');    // Main icon for Android/PWA
const iphoneIcon = join(logoFilesDir, 'Favicons/iPhone.png');      // Apple touch icon
const browserIcon = join(logoFilesDir, 'Favicons/browser.png');    // Browser favicon
const colorLogo = join(logoFilesDir, 'png/Color logo - no background.png');   // Full color logo
const whiteLogo = join(logoFilesDir, 'png/White logo - no background.png');   // White logo for adaptive icons

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
  console.log('Generating PWA icons from Bilavnova logo files...\n');

  // Generate PWA icons from Android.png source
  for (const icon of pwaIcons) {
    const outputPath = join(publicDir, icon.name);

    // Use iPhone.png for apple-touch-icon, Android.png for others
    const sourceIcon = icon.name === 'apple-touch-icon.png' ? iphoneIcon : androidIcon;

    try {
      await sharp(sourceIcon)
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
        background: { r: 26, g: 90, b: 142, alpha: 1 } // Bilavnova blue #1a5a8e
      }
    }).png().toBuffer();

    // Resize logo
    const logoResized = await sharp(androidIcon)
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
      await sharp(androidIcon)
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
      const roundedImage = await sharp(androidIcon)
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

      // Resize logo - use Android icon for foreground (square icon, not wide text logo)
      const logoResized = await sharp(androidIcon)
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
  console.log('\nGenerating theme-aware browser favicons from browser.png...\n');

  try {
    // Generate favicon for LIGHT system theme (browser icon on white background)
    await sharp(browserIcon)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png()
      .toFile(join(publicDir, 'favicon-light.png'));

    console.log(`  ✓ favicon-light.png (32x32) - for light system theme`);

    // Generate favicon for DARK system theme (browser icon on dark background)
    await sharp(browserIcon)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 15, g: 23, b: 42, alpha: 1 } // slate-900
      })
      .png()
      .toFile(join(publicDir, 'favicon-dark.png'));

    console.log(`  ✓ favicon-dark.png (32x32) - for dark system theme`);

    // Generate favicon.ico (32x32) - fallback for older browsers (use dark variant)
    await sharp(browserIcon)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 15, g: 23, b: 42, alpha: 1 }
      })
      .png()
      .toFile(join(publicDir, 'favicon.ico'));

    console.log(`  ✓ favicon.ico (32x32) - fallback`);
  } catch (error) {
    console.error(`  ✗ Failed favicon:`, error.message);
  }
}

async function generateInAppLogos() {
  console.log('\nGenerating in-app theme-aware logos...\n');

  try {
    // Color logo for light theme (resized for sidebar use ~48px)
    await sharp(colorLogo)
      .resize(96, 96, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 } // transparent
      })
      .png()
      .toFile(join(publicDir, 'logo-color.png'));

    console.log(`  ✓ logo-color.png (96x96) - for light app theme`);

    // White logo for dark theme
    await sharp(whiteLogo)
      .resize(96, 96, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 } // transparent
      })
      .png()
      .toFile(join(publicDir, 'logo-white.png'));

    console.log(`  ✓ logo-white.png (96x96) - for dark app theme`);
  } catch (error) {
    console.error(`  ✗ Failed in-app logos:`, error.message);
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
  await generateInAppLogos();

  console.log('\n' + '='.repeat(50));
  console.log('Done! Run "npx cap sync" to update Android project.');
  console.log('='.repeat(50));
}

main().catch(console.error);
