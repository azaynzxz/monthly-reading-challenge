// scripts/sync-data.js
// Copies src/data JSON files into public/data/ so Cloudflare Functions
// can fetch them at runtime without bundler imports.
// Run automatically via "prebuild" in package.json.

import { copyFileSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const src = join(root, 'src', 'data');
const dest = join(root, 'public', 'data');

mkdirSync(dest, { recursive: true });

const files = readdirSync(src).filter(f => f.endsWith('.json'));
for (const file of files) {
    copyFileSync(join(src, file), join(dest, file));
    console.log(`  ✓ copied ${file} → public/data/${file}`);
}
console.log(`\n[sync-data] ${files.length} files synced to public/data/\n`);
