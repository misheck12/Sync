/**
 * PWA Asset Generator Script
 * Generates iOS splash screens and Windows tiles from the base icon
 * 
 * Run: node scripts/generate-pwa-assets.js
 * Requires: sharp (npm install sharp --save-dev)
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Configuration
const SOURCE_ICON = path.join(__dirname, '../public/pwa-512x512.png');
const PUBLIC_DIR = path.join(__dirname, '../public');
const SPLASH_DIR = path.join(PUBLIC_DIR, 'splash');

// Brand colors
const BACKGROUND_COLOR = '#2563eb'; // Blue-600

// iOS Splash Screen Sizes (Portrait)
const IOS_SPLASH_SIZES = [
    { width: 750, height: 1334, name: 'apple-splash-750-1334' },      // iPhone SE, 8, 7, 6s, 6
    { width: 1242, height: 2208, name: 'apple-splash-1242-2208' },    // iPhone 8 Plus, 7 Plus
    { width: 1125, height: 2436, name: 'apple-splash-1125-2436' },    // iPhone X, Xs, 11 Pro
    { width: 828, height: 1792, name: 'apple-splash-828-1792' },      // iPhone Xr, 11
    { width: 1242, height: 2688, name: 'apple-splash-1242-2688' },    // iPhone Xs Max, 11 Pro Max
    { width: 1080, height: 2340, name: 'apple-splash-1080-2340' },    // iPhone 12 mini, 13 mini
    { width: 1170, height: 2532, name: 'apple-splash-1170-2532' },    // iPhone 12, 12 Pro, 13, 13 Pro, 14
    { width: 1284, height: 2778, name: 'apple-splash-1284-2778' },    // iPhone 12 Pro Max, 13 Pro Max
    { width: 1179, height: 2556, name: 'apple-splash-1179-2556' },    // iPhone 14 Pro
    { width: 1290, height: 2796, name: 'apple-splash-1290-2796' },    // iPhone 14 Pro Max
    { width: 1536, height: 2048, name: 'apple-splash-1536-2048' },    // iPad Mini, Air
    { width: 1668, height: 2224, name: 'apple-splash-1668-2224' },    // iPad Pro 10.5"
    { width: 1668, height: 2388, name: 'apple-splash-1668-2388' },    // iPad Pro 11"
    { width: 2048, height: 2732, name: 'apple-splash-2048-2732' },    // iPad Pro 12.9"
];

// Windows Tile Sizes
const WINDOWS_TILES = [
    { width: 70, height: 70, name: 'mstile-70x70' },
    { width: 144, height: 144, name: 'mstile-144x144' },
    { width: 150, height: 150, name: 'mstile-150x150' },
    { width: 310, height: 150, name: 'mstile-310x150' },  // Wide tile
    { width: 310, height: 310, name: 'mstile-310x310' },
];

// macOS Icon Sizes (for .icns generation hint)
const MACOS_SIZES = [
    { size: 16, name: 'icon_16x16' },
    { size: 32, name: 'icon_16x16@2x' },
    { size: 32, name: 'icon_32x32' },
    { size: 64, name: 'icon_32x32@2x' },
    { size: 128, name: 'icon_128x128' },
    { size: 256, name: 'icon_128x128@2x' },
    { size: 256, name: 'icon_256x256' },
    { size: 512, name: 'icon_256x256@2x' },
    { size: 512, name: 'icon_512x512' },
    { size: 1024, name: 'icon_512x512@2x' },
];

async function generateSplashScreen(config) {
    const { width, height, name } = config;
    const outputPath = path.join(SPLASH_DIR, `${name}.png`);

    // Icon size is 40% of the smaller dimension
    const iconSize = Math.round(Math.min(width, height) * 0.35);

    // Create background with centered icon
    const background = await sharp({
        create: {
            width,
            height,
            channels: 4,
            background: BACKGROUND_COLOR
        }
    }).png().toBuffer();

    // Resize the icon
    const icon = await sharp(SOURCE_ICON)
        .resize(iconSize, iconSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();

    // Composite icon onto background (centered)
    const left = Math.round((width - iconSize) / 2);
    const top = Math.round((height - iconSize) / 2);

    await sharp(background)
        .composite([{ input: icon, left, top }])
        .png()
        .toFile(outputPath);

    console.log(`✓ Generated: ${name}.png (${width}x${height})`);
}

async function generateWindowsTile(config) {
    const { width, height, name } = config;
    const outputPath = path.join(PUBLIC_DIR, `${name}.png`);

    // Icon size is 60% of the tile for square, less for wide
    const isWide = width > height;
    const iconSize = isWide
        ? Math.round(height * 0.6)
        : Math.round(width * 0.6);

    // Create background
    const background = await sharp({
        create: {
            width,
            height,
            channels: 4,
            background: BACKGROUND_COLOR
        }
    }).png().toBuffer();

    // Resize the icon
    const icon = await sharp(SOURCE_ICON)
        .resize(iconSize, iconSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();

    // Composite icon onto background (centered)
    const left = Math.round((width - iconSize) / 2);
    const top = Math.round((height - iconSize) / 2);

    await sharp(background)
        .composite([{ input: icon, left, top }])
        .png()
        .toFile(outputPath);

    console.log(`✓ Generated: ${name}.png (${width}x${height})`);
}

async function main() {
    console.log('🚀 PWA Asset Generator\n');

    // Check if source icon exists
    if (!fs.existsSync(SOURCE_ICON)) {
        console.error(`❌ Source icon not found: ${SOURCE_ICON}`);
        console.log('   Please ensure pwa-512x512.png exists in the public folder.');
        process.exit(1);
    }

    // Create splash directory
    if (!fs.existsSync(SPLASH_DIR)) {
        fs.mkdirSync(SPLASH_DIR, { recursive: true });
        console.log(`📁 Created: ${SPLASH_DIR}\n`);
    }

    // Generate iOS Splash Screens
    console.log('📱 Generating iOS Splash Screens...');
    for (const config of IOS_SPLASH_SIZES) {
        await generateSplashScreen(config);
    }

    console.log('\n🪟 Generating Windows Tiles...');
    for (const config of WINDOWS_TILES) {
        await generateWindowsTile(config);
    }

    console.log('\n✅ All assets generated successfully!');
    console.log(`\n📍 Splash screens: ${SPLASH_DIR}`);
    console.log(`📍 Windows tiles: ${PUBLIC_DIR}`);

    console.log('\n💡 Tip: For macOS .icns file, use iconutil or online converter.');
}

main().catch(console.error);
