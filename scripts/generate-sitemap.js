// scripts/generate-sitemap.js
// Generates a complete, standards-compliant sitemap.xml for English Fluency Journey.
// Covers homepage, core pages, microsite, all 121 daily reading stories, and 19 poem pages.

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const BASE_URL = 'https://myenglish.my.id';
const today = new Date().toISOString().split('T')[0];

const staticPages = [
    { path: '/', priority: '1.0', changefreq: 'weekly' },
    { path: '/poem', priority: '0.8', changefreq: 'weekly' },
    { path: '/roulette', priority: '0.7', changefreq: 'weekly' },
    { path: '/review', priority: '0.7', changefreq: 'weekly' },
    { path: '/about', priority: '0.7', changefreq: 'monthly' },
    { path: '/transcribe', priority: '0.7', changefreq: 'monthly' },
    { path: '/donate', priority: '0.5', changefreq: 'monthly' },
    { path: '/hello', priority: '0.6', changefreq: 'monthly' },
    { path: '/hello/shop', priority: '0.6', changefreq: 'monthly' },
    { path: '/hello/freebies', priority: '0.6', changefreq: 'monthly' },
];

function buildUrlEntry(url, lastmod, changefreq, priority) {
    return [
        '  <url>',
        `    <loc>${url}</loc>`,
        `    <lastmod>${lastmod}</lastmod>`,
        `    <changefreq>${changefreq}</changefreq>`,
        `    <priority>${priority}</priority>`,
        '  </url>'
    ].join('\n');
}

function generateSitemap() {
    const urls = [];

    // 1. Static Core Pages
    for (const page of staticPages) {
        urls.push(buildUrlEntry(`${BASE_URL}${page.path}`, today, page.changefreq, page.priority));
    }

    // 2. Reading Stories (Months 1 to 4)
    for (let month = 1; month <= 4; month++) {
        const jsonPath = join(root, 'src', 'data', `month${month}.json`);
        if (existsSync(jsonPath)) {
            const data = JSON.parse(readFileSync(jsonPath, 'utf8'));
            for (const story of data) {
                const day = story.day;
                urls.push(buildUrlEntry(`${BASE_URL}/m${month}-day${day}`, today, 'monthly', '0.8'));
            }
        }
    }

    // 3. Poems (/poem/:id)
    const poemsPath = join(root, 'src', 'data', 'poems.json');
    if (existsSync(poemsPath)) {
        const poems = JSON.parse(readFileSync(poemsPath, 'utf8'));
        for (const poem of poems) {
            urls.push(buildUrlEntry(`${BASE_URL}/poem/${poem.id}`, today, 'monthly', '0.8'));
        }
    }

    const xml = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        urls.join('\n'),
        '</urlset>'
    ].join('\n');

    // Write to public/sitemap.xml
    const publicSitemap = join(root, 'public', 'sitemap.xml');
    writeFileSync(publicSitemap, xml, 'utf8');
    console.log(`[generate-sitemap] Generated public/sitemap.xml with ${urls.length} URLs.`);

    // If dist directory exists, write to dist/sitemap.xml as well
    const distSitemap = join(root, 'dist', 'sitemap.xml');
    if (existsSync(join(root, 'dist'))) {
        writeFileSync(distSitemap, xml, 'utf8');
        console.log(`[generate-sitemap] Updated dist/sitemap.xml with ${urls.length} URLs.`);
    }
}

generateSitemap();
