// scripts/sync-data.js
// Prepares and syncs src/data JSON files into public/data/ so Cloudflare Functions
// can fetch them at runtime without bundler imports.
// For story months 1-4, embeds the Markdown story text so server middleware can
// pre-render full article HTML for search engine crawlers (Googlebot, Bingbot, AI search).
// Run automatically via "prebuild" in package.json.

import { copyFileSync, mkdirSync, readdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const src = join(root, 'src', 'data');
const dest = join(root, 'public', 'data');

mkdirSync(dest, { recursive: true });

const files = readdirSync(src).filter(f => f.endsWith('.json'));

for (const file of files) {
    const monthMatch = file.match(/^month(\d+)\.json$/);
    if (monthMatch) {
        const monthNum = parseInt(monthMatch[1], 10);
        const rawList = JSON.parse(readFileSync(join(src, file), 'utf8'));
        const enriched = rawList.map(story => {
            const mdPath = join(src, `month${monthNum}`, `day${story.day}.md`);
            let storyText = '';
            if (existsSync(mdPath)) {
                storyText = readFileSync(mdPath, 'utf8').trim();
            }
            return {
                ...story,
                text: storyText,
                story: storyText
            };
        });
        writeFileSync(join(dest, file), JSON.stringify(enriched, null, 2), 'utf8');
        console.log(`  [enriched & copied] ${file} (with full Markdown text) -> public/data/${file}`);
    } else {
        copyFileSync(join(src, file), join(dest, file));
        console.log(`  [copied] ${file} -> public/data/${file}`);
    }
}

console.log(`\n[sync-data] ${files.length} files synced to public/data/\n`);
