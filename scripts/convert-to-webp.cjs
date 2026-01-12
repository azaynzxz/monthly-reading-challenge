/**
 * Convert all downloaded images to WebP format for faster loading
 * This script converts images in public/images/stories and public/images/hero
 * and updates the JSON files to reference the new WebP files
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const STORIES_DIR = path.join(__dirname, '..', 'public', 'images', 'stories');
const HERO_DIR = path.join(__dirname, '..', 'public', 'images', 'hero');
const DATA_DIR = path.join(__dirname, '..', 'src', 'data');

// Quality setting for WebP conversion (0-100)
const WEBP_QUALITY = 80;

async function convertImageToWebP(inputPath) {
    const ext = path.extname(inputPath).toLowerCase();

    // Skip if already webp or if it's a gif (animated)
    if (ext === '.webp') {
        return inputPath;
    }

    // Skip SVG files
    if (ext === '.svg') {
        console.log(`  ⏭️  Skipping SVG: ${path.basename(inputPath)}`);
        return inputPath;
    }

    const outputPath = inputPath.replace(/\.(jpg|jpeg|png|gif|JPG|JPEG|PNG|GIF)$/i, '.webp');

    try {
        await sharp(inputPath)
            .webp({ quality: WEBP_QUALITY })
            .toFile(outputPath);

        // Get file sizes for comparison
        const originalSize = fs.statSync(inputPath).size;
        const webpSize = fs.statSync(outputPath).size;
        const savings = ((originalSize - webpSize) / originalSize * 100).toFixed(1);

        console.log(`  ✅ ${path.basename(inputPath)} → ${path.basename(outputPath)} (${savings}% smaller)`);

        // Delete original file
        fs.unlinkSync(inputPath);

        return outputPath;
    } catch (error) {
        console.log(`  ❌ Failed to convert ${path.basename(inputPath)}: ${error.message}`);
        return inputPath;
    }
}

async function convertStoryImages(monthDir) {
    const monthName = path.basename(monthDir);
    console.log(`\n📂 Converting ${monthName}...`);

    const files = fs.readdirSync(monthDir);
    const conversions = {};

    for (const file of files) {
        const filePath = path.join(monthDir, file);
        const stat = fs.statSync(filePath);

        if (stat.isFile()) {
            const ext = path.extname(file).toLowerCase();
            if (['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
                const newPath = await convertImageToWebP(filePath);
                const oldName = `/images/stories/${monthName}/${file}`;
                const newName = `/images/stories/${monthName}/${path.basename(newPath)}`;
                conversions[oldName] = newName;
            }
        }
    }

    return conversions;
}

async function convertHeroImages() {
    console.log(`\n🏛️  Converting hero images...`);

    if (!fs.existsSync(HERO_DIR)) {
        console.log('  ⚠️  Hero directory not found');
        return {};
    }

    const files = fs.readdirSync(HERO_DIR);
    const conversions = {};

    for (const file of files) {
        if (file === 'hero-images.json') continue;

        const filePath = path.join(HERO_DIR, file);
        const stat = fs.statSync(filePath);

        if (stat.isFile()) {
            const ext = path.extname(file).toLowerCase();
            if (['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
                const newPath = await convertImageToWebP(filePath);
                const oldName = `/images/hero/${file}`;
                const newName = `/images/hero/${path.basename(newPath)}`;
                conversions[oldName] = newName;
            }
        }
    }

    return conversions;
}

function updateJsonFile(filePath, conversions) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Remove BOM if present
    if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
    }

    let data = JSON.parse(content);
    let updated = false;

    // Update localImage paths in the array
    for (const item of data) {
        if (item.localImage && conversions[item.localImage]) {
            item.localImage = conversions[item.localImage];
            updated = true;
        }
    }

    if (updated) {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 4));
        console.log(`  💾 Updated ${path.basename(filePath)}`);
    }

    return updated;
}

function updateHeroJson(conversions) {
    const heroJsonPath = path.join(HERO_DIR, 'hero-images.json');

    if (!fs.existsSync(heroJsonPath)) {
        console.log('  ⚠️  hero-images.json not found');
        return;
    }

    let content = fs.readFileSync(heroJsonPath, 'utf8');
    let data = JSON.parse(content);
    let updated = false;

    for (const item of data) {
        if (item.localImage && conversions[item.localImage]) {
            item.localImage = conversions[item.localImage];
            updated = true;
        }
    }

    if (updated) {
        fs.writeFileSync(heroJsonPath, JSON.stringify(data, null, 4));
        console.log(`  💾 Updated hero-images.json`);
    }
}

async function main() {
    console.log('🖼️  WebP Image Converter');
    console.log('========================\n');

    const allConversions = {};

    // Convert story images for each month
    const monthDirs = ['month1', 'month2', 'month3'];
    for (const month of monthDirs) {
        const monthPath = path.join(STORIES_DIR, month);
        if (fs.existsSync(monthPath)) {
            const conversions = await convertStoryImages(monthPath);
            Object.assign(allConversions, conversions);
        }
    }

    // Convert hero images
    const heroConversions = await convertHeroImages();
    Object.assign(allConversions, heroConversions);

    // Update JSON files
    console.log('\n📝 Updating JSON files...');

    for (const month of monthDirs) {
        const jsonPath = path.join(DATA_DIR, `${month}.json`);
        if (fs.existsSync(jsonPath)) {
            updateJsonFile(jsonPath, allConversions);
        }
    }

    // Update hero-images.json
    updateHeroJson(heroConversions);

    console.log('\n========================');
    console.log(`📊 Converted ${Object.keys(allConversions).length} images to WebP`);
    console.log('✨ Done!');
}

main().catch(console.error);
