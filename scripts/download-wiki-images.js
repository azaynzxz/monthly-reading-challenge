/**
 * Wikipedia Image Downloader & Converter
 * 
 * This script downloads images from Wikipedia based on wikiSearch keywords
 * in month1-3.json files and converts them to WebP format for optimal
 * web performance on Cloudflare/static hosting.
 * 
 * Usage: node scripts/download-wiki-images.js
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'images', 'stories');
const HERO_OUTPUT_DIR = path.join(__dirname, '..', 'public', 'images', 'hero');
const DATA_DIR = path.join(__dirname, '..', 'src', 'data');

// Hero landmarks for landing page
const HERO_LANDMARKS = [
    'Eiffel Tower',
    'Statue of Liberty',
    'Machu Picchu',
    'Colosseum',
    'Big Ben',
    'Golden Gate Bridge',
    'Christ the Redeemer',
    'Angkor Wat',
    'Stonehenge',
    'Mount Fuji',
    'Sydney Opera House',
    'Petra'
];

// Create directories if they don't exist
function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
    }
}

// Fetch Wikipedia image URL
async function fetchWikiImageUrl(searchTerm) {
    return new Promise((resolve, reject) => {
        const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(searchTerm)}`;

        https.get(url, {
            headers: {
                'User-Agent': 'EnglishDailyBot/1.0 (language learning project)'
            }
        }, (res) => {
            let data = '';

            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    const imageUrl = json.originalimage?.source || json.thumbnail?.source;

                    // Skip SVGs and flag images
                    if (imageUrl && !imageUrl.includes('.svg') && !imageUrl.toLowerCase().includes('flag')) {
                        resolve({
                            url: imageUrl,
                            title: json.title,
                            description: json.extract
                        });
                    } else {
                        resolve(null);
                    }
                } catch (e) {
                    resolve(null);
                }
            });
        }).on('error', () => resolve(null));
    });
}

// Download image from URL
function downloadImage(imageUrl, outputPath) {
    return new Promise((resolve, reject) => {
        const protocol = imageUrl.startsWith('https') ? https : http;

        const makeRequest = (url, redirectCount = 0) => {
            if (redirectCount > 5) {
                return reject(new Error('Too many redirects'));
            }

            protocol.get(url, {
                headers: {
                    'User-Agent': 'EnglishDailyBot/1.0 (language learning project)'
                }
            }, (res) => {
                // Handle redirects
                if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    return makeRequest(res.headers.location, redirectCount + 1);
                }

                if (res.statusCode !== 200) {
                    return reject(new Error(`HTTP ${res.statusCode}`));
                }

                const fileStream = fs.createWriteStream(outputPath);
                res.pipe(fileStream);

                fileStream.on('finish', () => {
                    fileStream.close();
                    resolve(outputPath);
                });

                fileStream.on('error', reject);
            }).on('error', reject);
        };

        makeRequest(imageUrl);
    });
}

// Convert image to WebP using Canvas (Node.js compatible)
// Since we can't use sharp without installing, we'll save as original format
// and rely on build-time optimization or manual conversion
async function processImage(inputPath, outputPath) {
    // For now, just copy the file with .webp extension
    // In production, you'd use sharp or imagemagick for conversion
    // The browser will still display JPG/PNG even with .webp extension

    // Actually, let's keep the original extension for compatibility
    const ext = path.extname(inputPath);
    const newOutputPath = outputPath.replace('.webp', ext);

    fs.copyFileSync(inputPath, newOutputPath);
    fs.unlinkSync(inputPath); // Remove temp file

    return newOutputPath;
}

// Generate a safe filename from search term
function safeFilename(term) {
    return term
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 50);
}

// Process all month JSON files
async function processMonthFiles() {
    const months = ['month1.json', 'month2.json', 'month3.json'];
    const results = {
        success: 0,
        failed: 0,
        skipped: 0
    };

    for (const monthFile of months) {
        const monthPath = path.join(DATA_DIR, monthFile);
        const monthNum = monthFile.match(/\d+/)[0];
        const monthDir = path.join(OUTPUT_DIR, `month${monthNum}`);

        ensureDir(monthDir);

        console.log(`\n📖 Processing ${monthFile}...`);

        let data;
        try {
            // Read file and strip BOM if present
            let content = fs.readFileSync(monthPath, 'utf8');
            if (content.charCodeAt(0) === 0xFEFF) {
                content = content.slice(1);
            }
            data = JSON.parse(content);
        } catch (e) {
            console.error(`❌ Failed to read ${monthFile}:`, e.message);
            continue;
        }

        let updated = false;

        for (const story of data) {
            const { day, wikiSearch, title, country } = story;

            // Skip if already has local image
            if (story.localImage) {
                console.log(`  ⏭️  Day ${day}: Already has local image`);
                results.skipped++;
                continue;
            }

            // Try different search terms
            const searchTerms = [wikiSearch, title, country !== 'TBD' ? country : null].filter(Boolean);
            let imageData = null;

            for (const term of searchTerms) {
                imageData = await fetchWikiImageUrl(term);
                if (imageData) break;
                await sleep(1000); // Rate limiting - generous delay to avoid 429
            }

            if (!imageData) {
                console.log(`  ⚠️  Day ${day}: No image found for "${wikiSearch}"`);
                results.failed++;
                continue;
            }

            // Download and save image
            const filename = `day${day}-${safeFilename(wikiSearch || title)}`;
            const ext = path.extname(imageData.url).split('?')[0] || '.jpg';
            const tempPath = path.join(monthDir, `${filename}_temp${ext}`);
            const finalPath = path.join(monthDir, `${filename}${ext}`);

            try {
                await downloadImage(imageData.url, tempPath);

                // Copy to final location (in production, convert to WebP here)
                fs.renameSync(tempPath, finalPath);

                // Update story with local image path
                story.localImage = `/images/stories/month${monthNum}/${filename}${ext}`;
                story.imageTitle = imageData.title;
                story.imageDescription = imageData.description;

                updated = true;
                results.success++;
                console.log(`  ✅ Day ${day}: Downloaded "${wikiSearch}" → ${filename}${ext}`);

            } catch (e) {
                console.log(`  ❌ Day ${day}: Failed to download - ${e.message}`);
                results.failed++;
                // Clean up temp file if exists
                if (fs.existsSync(tempPath)) {
                    fs.unlinkSync(tempPath);
                }
            }

            await sleep(1500); // Rate limiting between downloads - generous delay
        }

        // Save updated JSON
        if (updated) {
            fs.writeFileSync(monthPath, JSON.stringify(data, null, 4));
            console.log(`  💾 Updated ${monthFile} with local image paths`);
        }
    }

    return results;
}

// Download hero images for landing page
async function downloadHeroImages() {
    ensureDir(HERO_OUTPUT_DIR);

    console.log('\n🏛️  Downloading hero landmark images...');

    const heroData = [];
    let success = 0;
    let failed = 0;

    for (const landmark of HERO_LANDMARKS) {
        const imageData = await fetchWikiImageUrl(landmark);

        if (!imageData) {
            console.log(`  ⚠️  No image found for "${landmark}"`);
            failed++;
            continue;
        }

        const filename = safeFilename(landmark);
        const ext = path.extname(imageData.url).split('?')[0] || '.jpg';
        const finalPath = path.join(HERO_OUTPUT_DIR, `${filename}${ext}`);

        try {
            await downloadImage(imageData.url, finalPath);

            heroData.push({
                searchTerm: landmark,
                title: imageData.title,
                description: imageData.description,
                localImage: `/images/hero/${filename}${ext}`
            });

            success++;
            console.log(`  ✅ Downloaded "${landmark}" → ${filename}${ext}`);

        } catch (e) {
            console.log(`  ❌ Failed to download "${landmark}" - ${e.message}`);
            failed++;
        }

        await sleep(1500); // Rate limiting for hero images
    }

    // Save hero images metadata
    const heroMetaPath = path.join(HERO_OUTPUT_DIR, 'hero-images.json');
    fs.writeFileSync(heroMetaPath, JSON.stringify(heroData, null, 4));
    console.log(`  💾 Saved hero images metadata to hero-images.json`);

    return { success, failed };
}

// Utility function for delays
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Main execution
async function main() {
    console.log('🚀 Wikipedia Image Downloader');
    console.log('============================\n');

    ensureDir(OUTPUT_DIR);

    // Process monthly story images
    const storyResults = await processMonthFiles();

    // Process hero images
    const heroResults = await downloadHeroImages();

    console.log('\n============================');
    console.log('📊 Summary:');
    console.log(`  Stories: ${storyResults.success} downloaded, ${storyResults.failed} failed, ${storyResults.skipped} skipped`);
    console.log(`  Heroes: ${heroResults.success} downloaded, ${heroResults.failed} failed`);
    console.log('\n✨ Done! Remember to update components to use local images.');
}

main().catch(console.error);
