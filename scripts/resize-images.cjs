const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
    hero: {
        maxWidth: 1200,
        quality: 80
    },
    stories: {
        maxWidth: 800,
        quality: 75
    }
};

// Output directory for optimized images
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'images_optimized');

async function getImageFiles(dir) {
    const files = [];
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
            files.push(...await getImageFiles(fullPath));
        } else if (item.name.endsWith('.webp')) {
            files.push(fullPath);
        }
    }
    return files;
}

async function resizeImage(filePath, baseDir) {
    const isHero = filePath.includes('hero');
    const config = isHero ? CONFIG.hero : CONFIG.stories;
    
    const originalSize = fs.statSync(filePath).size;
    const originalSizeKB = (originalSize / 1024).toFixed(1);
    
    // Calculate output path (preserve folder structure)
    const relativePath = path.relative(baseDir, filePath);
    const outputPath = path.join(OUTPUT_DIR, relativePath);
    const outputDir = path.dirname(outputPath);
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Skip if already small (under 150KB)
    if (originalSize < 150 * 1024) {
        // Just copy the file
        fs.copyFileSync(filePath, outputPath);
        console.log(`⏭️  Copying ${path.basename(filePath)} (${originalSizeKB}KB - already optimized)`);
        return { skipped: true, saved: 0 };
    }
    
    try {
        const image = sharp(filePath);
        const metadata = await image.metadata();
        
        // Only resize if wider than max
        let resizeOptions = {};
        if (metadata.width > config.maxWidth) {
            resizeOptions = { width: config.maxWidth };
        }
        
        await sharp(filePath)
            .resize(resizeOptions)
            .webp({ quality: config.quality })
            .toFile(outputPath);
        
        const newSize = fs.statSync(outputPath).size;
        const newSizeKB = (newSize / 1024).toFixed(1);
        const savedKB = ((originalSize - newSize) / 1024).toFixed(1);
        const savedPercent = ((1 - newSize / originalSize) * 100).toFixed(0);
        
        console.log(`✅ ${path.basename(filePath)}: ${originalSizeKB}KB → ${newSizeKB}KB (saved ${savedKB}KB / ${savedPercent}%)`);
        
        return { skipped: false, saved: originalSize - newSize };
    } catch (error) {
        console.error(`❌ Error processing ${filePath}:`, error.message);
        // Copy original on error
        fs.copyFileSync(filePath, outputPath);
        return { skipped: true, saved: 0 };
    }
}

async function main() {
    console.log('🖼️  Resizing images to web-friendly sizes...\n');
    console.log(`Hero images: max ${CONFIG.hero.maxWidth}px, quality ${CONFIG.hero.quality}%`);
    console.log(`Story images: max ${CONFIG.stories.maxWidth}px, quality ${CONFIG.stories.quality}%`);
    console.log(`Output: ${OUTPUT_DIR}\n`);
    
    // Clean output directory
    if (fs.existsSync(OUTPUT_DIR)) {
        fs.rmSync(OUTPUT_DIR, { recursive: true });
    }
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    
    // Also copy hero-images.json
    const heroJsonSrc = path.join(__dirname, '..', 'public', 'images', 'hero', 'hero-images.json');
    const heroJsonDst = path.join(OUTPUT_DIR, 'hero', 'hero-images.json');
    
    const imagesDir = path.join(__dirname, '..', 'public', 'images');
    const files = await getImageFiles(imagesDir);
    
    console.log(`Found ${files.length} images to process\n`);
    
    let totalSaved = 0;
    let processed = 0;
    let skipped = 0;
    
    for (const file of files) {
        const result = await resizeImage(file, imagesDir);
        if (result.skipped) {
            skipped++;
        } else {
            processed++;
            totalSaved += result.saved;
        }
    }
    
    // Copy JSON file
    if (fs.existsSync(heroJsonSrc)) {
        fs.copyFileSync(heroJsonSrc, heroJsonDst);
        console.log(`\n📄 Copied hero-images.json`);
    }
    
    console.log('\n' + '='.repeat(50));
    console.log(`📊 Summary:`);
    console.log(`   Processed: ${processed} images`);
    console.log(`   Skipped/Copied: ${skipped} images (already optimized)`);
    console.log(`   Total saved: ${(totalSaved / 1024 / 1024).toFixed(2)} MB`);
    console.log('='.repeat(50));
    console.log(`\n📁 Optimized images saved to: ${OUTPUT_DIR}`);
    console.log(`\n⚠️  To use optimized images:`);
    console.log(`   1. Stop the dev server`);
    console.log(`   2. Delete public/images folder`);
    console.log(`   3. Rename public/images_optimized to public/images`);
}

main().catch(console.error);
