/**
 * iOS Splash Screen Generator
 * Generates PWA splash screens for all iOS device sizes
 *
 * Usage: node scripts/generate-splash.js
 *
 * Design: Space Void gradient background with centered white logo
 * Colors follow Cosmic Precision Design System v5.1
 */

import sharp from 'sharp';
import { mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Source logo from assets
const logoFilesDir = join(rootDir, 'src/assets/Logo Files');
const whiteLogo = join(logoFilesDir, 'png/White logo - no background.png');

// Output directory
const splashDir = join(rootDir, 'public/splash');

// Cosmic Precision Design System colors
const SPACE_VOID = { r: 5, g: 8, b: 22 };      // #050816
const SPACE_NEBULA = { r: 10, g: 15, b: 30 };  // #0a0f1e
const STELLAR_CYAN = { r: 0, g: 174, b: 239 }; // #00aeef (for glow)

// All iOS splash screen sizes (portrait)
const splashSizes = [
  // iPhones
  { name: 'apple-splash-1290-2796.png', width: 1290, height: 2796, device: 'iPhone 14/15 Pro Max' },
  { name: 'apple-splash-1179-2556.png', width: 1179, height: 2556, device: 'iPhone 14/15 Pro' },
  { name: 'apple-splash-1284-2778.png', width: 1284, height: 2778, device: 'iPhone 14 Plus, 13/12 Pro Max' },
  { name: 'apple-splash-1170-2532.png', width: 1170, height: 2532, device: 'iPhone 14, 13, 12' },
  { name: 'apple-splash-1125-2436.png', width: 1125, height: 2436, device: 'iPhone 13/12 mini, 11 Pro, X' },
  { name: 'apple-splash-1242-2688.png', width: 1242, height: 2688, device: 'iPhone 11 Pro Max, XS Max' },
  { name: 'apple-splash-828-1792.png', width: 828, height: 1792, device: 'iPhone 11, XR' },
  { name: 'apple-splash-1242-2208.png', width: 1242, height: 2208, device: 'iPhone 8/7/6s Plus' },
  { name: 'apple-splash-750-1334.png', width: 750, height: 1334, device: 'iPhone 8/7/6s, SE 2/3' },
  { name: 'apple-splash-640-1136.png', width: 640, height: 1136, device: 'iPhone SE 1st, iPod' },
  // iPads
  { name: 'apple-splash-2048-2732.png', width: 2048, height: 2732, device: 'iPad Pro 12.9"' },
  { name: 'apple-splash-1668-2388.png', width: 1668, height: 2388, device: 'iPad Pro 11"' },
  { name: 'apple-splash-1640-2360.png', width: 1640, height: 2360, device: 'iPad Air 10.9"' },
  { name: 'apple-splash-1620-2160.png', width: 1620, height: 2160, device: 'iPad 10.2"' },
  { name: 'apple-splash-1488-2266.png', width: 1488, height: 2266, device: 'iPad mini 8.3"' },
];

/**
 * Create a vertical gradient from Space Void to Space Nebula
 */
function createGradientSvg(width, height) {
  return Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="spaceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:rgb(${SPACE_VOID.r},${SPACE_VOID.g},${SPACE_VOID.b})"/>
          <stop offset="100%" style="stop-color:rgb(${SPACE_NEBULA.r},${SPACE_NEBULA.g},${SPACE_NEBULA.b})"/>
        </linearGradient>
        <radialGradient id="glowGradient" cx="50%" cy="45%" r="35%">
          <stop offset="0%" style="stop-color:rgb(${STELLAR_CYAN.r},${STELLAR_CYAN.g},${STELLAR_CYAN.b});stop-opacity:0.15"/>
          <stop offset="100%" style="stop-color:rgb(${STELLAR_CYAN.r},${STELLAR_CYAN.g},${STELLAR_CYAN.b});stop-opacity:0"/>
        </radialGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#spaceGradient)"/>
      <rect width="${width}" height="${height}" fill="url(#glowGradient)"/>
    </svg>
  `);
}

async function generateSplashScreens() {
  console.log('='.repeat(55));
  console.log('iOS Splash Screen Generator - Bilavnova');
  console.log('='.repeat(55));
  console.log('');
  console.log('Design: Space Void gradient + centered white logo');
  console.log('');

  // Ensure output directory exists
  if (!existsSync(splashDir)) {
    mkdirSync(splashDir, { recursive: true });
    console.log(`Created directory: public/splash/\n`);
  }

  // Check if logo exists
  if (!existsSync(whiteLogo)) {
    console.error(`Error: Logo not found at ${whiteLogo}`);
    console.error('Please ensure the logo file exists.');
    process.exit(1);
  }

  // Get logo metadata for aspect ratio
  const logoMetadata = await sharp(whiteLogo).metadata();
  const logoAspectRatio = logoMetadata.width / logoMetadata.height;

  console.log(`Source logo: ${logoMetadata.width}x${logoMetadata.height}px\n`);
  console.log('Generating splash screens...\n');

  for (const splash of splashSizes) {
    const outputPath = join(splashDir, splash.name);

    try {
      // Calculate logo size (40% of the smallest dimension)
      const minDimension = Math.min(splash.width, splash.height);
      let logoWidth = Math.floor(minDimension * 0.4);
      let logoHeight = Math.floor(logoWidth / logoAspectRatio);

      // Ensure logo fits within safe margins (20% from edges)
      const maxWidth = splash.width * 0.6;
      const maxHeight = splash.height * 0.6;
      if (logoWidth > maxWidth) {
        logoWidth = Math.floor(maxWidth);
        logoHeight = Math.floor(logoWidth / logoAspectRatio);
      }
      if (logoHeight > maxHeight) {
        logoHeight = Math.floor(maxHeight);
        logoWidth = Math.floor(logoHeight * logoAspectRatio);
      }

      // Create gradient background
      const gradientSvg = createGradientSvg(splash.width, splash.height);
      const backgroundBuffer = await sharp(gradientSvg)
        .png()
        .toBuffer();

      // Resize logo
      const logoResized = await sharp(whiteLogo)
        .resize(logoWidth, logoHeight, { fit: 'contain' })
        .toBuffer();

      // Calculate centered position
      const logoX = Math.floor((splash.width - logoWidth) / 2);
      const logoY = Math.floor((splash.height - logoHeight) / 2);

      // Composite logo onto background
      await sharp(backgroundBuffer)
        .composite([{
          input: logoResized,
          top: logoY,
          left: logoX
        }])
        .png({ compressionLevel: 9 })
        .toFile(outputPath);

      console.log(`  ✓ ${splash.name} (${splash.width}x${splash.height}) - ${splash.device}`);
    } catch (error) {
      console.error(`  ✗ Failed ${splash.name}:`, error.message);
    }
  }

  console.log('\n' + '='.repeat(55));
  console.log(`Done! Generated ${splashSizes.length} splash screens.`);
  console.log('Files saved to: public/splash/');
  console.log('='.repeat(55));
}

generateSplashScreens().catch(console.error);
