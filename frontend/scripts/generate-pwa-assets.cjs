const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Configuration
const SOURCE_ICON = path.join(__dirname, '../public/pwa-512x512.png');
const PUBLIC_DIR = path.join(__dirname, '../public');
const SPLASH_DIR = path.join(PUBLIC_DIR, 'splash');

// Brand colors
const BACKGROUND_COLOR = { r: 37, g: 99, b: 235, alpha: 1 }; // #2563eb

// iOS Splash Screen Sizes (Portrait)
const IOS_SPLASH_SIZES = [
    { width: 750, height: 1334, name: 'apple-splash-750-1334' },
    { width: 1242, height: 2208, name: 'apple-splash-1242-2208' },
    { width: 1125, height: 2436, name: 'apple-splash-1125-2436' },
    { width: 828, height: 1792, name: 'apple-splash-828-1792' },
    { width: 1242, height: 2688, name: 'apple-splash-1242-2688' },
    { width: 1080, height: 2340, name: 'apple-splash-1080-2340' },
    { width: 1170, height: 2532, name: 'apple-splash-1170-2532' },
    { width: 1284, height: 2778, name: 'apple-splash-1284-2778' },
    { width: 1179, height: 2556, name: 'apple-splash-1179-2556' },
    { width: 1290, height: 2796, name: 'apple-splash-1290-2796' },
    { width: 1536, height: 2048, name: 'apple-splash-1536-2048' },
    { width: 1668, height: 2224, name: 'apple-splash-1668-2224' },
    { width: 1668, height: 2388, name: 'apple-splash-1668-2388' },
    { width: 2048, height: 2732, name: 'apple-splash-2048-2732' },
];

// Windows Tile Sizes
const WINDOWS_TILES = [
    { width: 70, height: 70, name: 'mstile-70x70' },
    { width: 144, height: 144, name: 'mstile-144x144' },
    { width: 150, height: 150, name: 'mstile-150x150' },
    { width: 310, height: 150, name: 'mstile-310x150' },
    { width: 310, height: 310, name: 'mstile-310x310' },
];

async function generateSplashScreen(config) {
    const { width, height, name } = config;
    const outputPath = path.join(SPLASH_DIR, `${name}.png`);

    const iconSize = Math.round(Math.min(width, height) * 0.35);

    const background = await sharp({
        create: {
            width,
            height,
            channels: 4,
            background: BACKGROUND_COLOR
        }
    }).png().toBuffer();

    const icon = await sharp(SOURCE_ICON)
        .resize(iconSize, iconSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();

    const left = Math.round((width - iconSize) / 2);
    const top = Math.round((height - iconSize) / 2);

    await sharp(background)
        .composite([{ input: icon, left, top }])
        .png()
        .toFile(outputPath);

    console.log(`Generated: ${name}.png (${width}x${height})`);
}

async function generateWindowsTile(config) {
    const { width, height, name } = config;
    const outputPath = path.join(PUBLIC_DIR, `${name}.png`);

    const isWide = width > height;
    const iconSize = isWide
        ? Math.round(height * 0.6)
        : Math.round(width * 0.6);

    const background = await sharp({
        create: {
            width,
            height,
            channels: 4,
            background: BACKGROUND_COLOR
        }
    }).png().toBuffer();

    const icon = await sharp(SOURCE_ICON)
        .resize(iconSize, iconSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();

    const left = Math.round((width - iconSize) / 2);
    const top = Math.round((height - iconSize) / 2);

    await sharp(background)
        .composite([{ input: icon, left, top }])
        .png()
        .toFile(outputPath);

    console.log(`Generated: ${name}.png (${width}x${height})`);
}

async function main() {
    console.log('PWA Asset Generator\n');

    if (!fs.existsSync(SOURCE_ICON)) {
        console.error('Source icon not found:', SOURCE_ICON);
        process.exit(1);
    }

    if (!fs.existsSync(SPLASH_DIR)) {
        fs.mkdirSync(SPLASH_DIR, { recursive: true });
        console.log('Created:', SPLASH_DIR, '\n');
    }

    console.log('Generating iOS Splash Screens...');
    for (const config of IOS_SPLASH_SIZES) {
        await generateSplashScreen(config);
    }

    console.log('\nGenerating Windows Tiles...');
    for (const config of WINDOWS_TILES) {
        await generateWindowsTile(config);
    }

    console.log('\nAll assets generated successfully!');
}

main().catch(console.error);
