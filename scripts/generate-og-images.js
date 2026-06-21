// scripts/generate-og-images.js
// Generates static PNG OG images for all poems and stories at build time.
// Run automatically via "prebuild". Uses sharp (already in dependencies) to
// render SVG templates to PNG — proper format for WhatsApp, Discord, etc.

import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'fs';
import { writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// ── Helpers ────────────────────────────────────────────────────────────────

function xe(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function wrapText(text, max) {
    const words = text.split(' ');
    const lines = [];
    let cur = '';
    for (const w of words) {
        if ((cur + ' ' + w).trim().length > max) {
            if (cur) lines.push(cur.trim());
            cur = w;
        } else {
            cur = (cur + ' ' + w).trim();
        }
    }
    if (cur) lines.push(cur.trim());
    return lines;
}

function firstLine(text, maxLen = 110) {
    if (!text) return '';
    const first = text.split('\n')[0].replace(/^["""'']+|["""'']+$/g, '').trim();
    return first.length > maxLen ? first.slice(0, maxLen - 1) + '…' : first;
}

// ── Favicon inline paths ──────────────────────────────────────────────────

const LOGO = `
  <circle fill="#fff" cx="117.2" cy="117.2" r="117.2"/>
  <circle fill="#921b1e" cx="117.2" cy="117.2" r="88.63"/>
  <path fill="#e02127" d="M66.65,58.83l3.64,1.31c1.94,.7,2.88,2.9,2.03,4.78l-3.19,7.11c-.7,1.56-.18,3.41,1.23,4.37h0c.98,.67,1.56,1.78,1.54,2.96l-.1,9.36c-.03,2.77,3,4.51,5.37,3.07l20.42-12.34c.85-.51,1.44-1.36,1.64-2.33l4.44-22.04c.31-1.55,1.62-2.71,3.2-2.83,4.92-.39,15.14-1.53,17.49-4.32,2.09-2.49,5.59,.63,7.67,2.96,1.08,1.21,2.84,1.54,4.28,.78l6.18-3.23c2.75-1.44,2.46-5.47-.47-6.48-7.45-2.57-19.79-5.84-33.12-5.21-15.19,.71-33.43,10.18-42.85,15.69-2.6,1.52-2.25,5.37,.59,6.39Z"/>
  <path fill="#e02127" d="M160.25,53.02l-7.8,5.01c-2.25,1.45-2.98,4.41-1.64,6.73,.32,.55,.65,1.11,.96,1.65,1.2,2.05,.8,4.66-.96,6.26l-4.43,4.01c-3.02,2.74-1.69,7.75,2.29,8.63h.02c2.04,.45,3.59,2.12,3.89,4.19l.91,6.25c.53,3.64,4.66,5.5,7.74,3.48l7.89-5.2c.63-.42,1.35-.68,2.1-.78l9.48-1.25c1.67-.22,3.13-1.27,3.86-2.79l4.36-8.99c.77-1.59,.65-3.45-.31-4.93-3.05-4.69-10.74-15.08-23.12-22.37-1.63-.96-3.67-.9-5.25,.12Z"/>
  <path fill="#fff" d="M151.92,153.52v.37c0,4.5-3.65,8.14-8.14,8.14h-53.15c-4.5,0-8.14-3.65-8.14-8.14V80.5c0-4.5,3.65-8.14,8.14-8.14h51.49c4.5,0,8.14,3.65,8.14,8.14v.37c0,4.5-3.65,8.14-8.14,8.14h-39.01v19.34h33.49c4.5,0,8.14,3.65,8.14,8.14h0c0,4.5-3.65,8.14-8.14,8.14h-33.49v20.74h40.66c4.5,0,8.14,3.65,8.14,8.14Z"/>
  <path fill="#921b1e" d="M76.83,161.48c-.18,.55-10.67,21.2-16.98,33.61-1.9,3.73,1.34,8,5.44,7.19l44.41-8.71-32.87-32.09Z"/>
  <path fill="#e02127" d="M70.85,162.08l-7.93,7.43c-1.4,1.31-1.34,3.56,.14,4.79l6.43,5.35c.57,.48,1.3,.74,2.05,.74h5.12c.86,0,1.69,.35,2.29,.97l3.75,3.85c1.35,1.38,3.61,1.27,4.8-.25l1.35-1.71c1.2-1.52,.79-3.74-.87-4.73l-4.69-2.8c-1.35-.81-1.92-2.48-1.33-3.94l1.59-3.98c.7-1.75-.26-3.73-2.07-4.26l-7.54-2.21c-1.09-.32-2.26-.04-3.09,.73Z"/>
`;

// ── Poem SVG ──────────────────────────────────────────────────────────────

function poemSvg({ id, title, author, opening }) {
    const W = 1200, H = 630;
    const titleLines = wrapText(title, 26);
    const LINE_H = 72;
    const titleBlock = titleLines.length * LINE_H;
    const titleY = Math.round(H / 2 - titleBlock / 2 - 44);

    const titleSvg = titleLines.map((line, i) =>
        `<text x="600" y="${titleY + i * LINE_H}"
            font-family="Arial,sans-serif" font-size="64" font-weight="bold"
            fill="white" text-anchor="middle" dominant-baseline="middle"
            filter="url(#tg)">${xe(line)}</text>`
    ).join('');

    const authorY  = titleY + titleBlock + 32;
    const dividerY = authorY + 52;
    const openingY = dividerY + 36;
    const openLines = opening ? wrapText(opening, 60) : [];
    const openSvg = openLines.map((line, i) =>
        `<text x="600" y="${openingY + i * 30}"
            font-family="Arial,sans-serif" font-size="20" font-style="italic"
            fill="white" text-anchor="middle" opacity="0.5">${xe(line)}</text>`
    ).join('');
    const tagY = openingY + openLines.length * 30 + 38;

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#0d0608"/>
    <stop offset="50%" stop-color="#1c060a"/>
    <stop offset="100%" stop-color="#080412"/>
  </linearGradient>
  <radialGradient id="glow" cx="50%" cy="50%" r="55%">
    <stop offset="0%" stop-color="#6b0f1a" stop-opacity="0.65"/>
    <stop offset="100%" stop-color="#0d0608" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="b1" cx="50%" cy="50%" r="50%">
    <stop offset="0%" stop-color="#8b1a2a" stop-opacity="0.3"/>
    <stop offset="100%" stop-color="#8b1a2a" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="b2" cx="50%" cy="50%" r="50%">
    <stop offset="0%" stop-color="#1a0840" stop-opacity="0.28"/>
    <stop offset="100%" stop-color="#1a0840" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="acc" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%" stop-color="#cc2233" stop-opacity="0"/>
    <stop offset="35%" stop-color="#cc2233"/>
    <stop offset="65%" stop-color="#d4a844"/>
    <stop offset="100%" stop-color="#d4a844" stop-opacity="0"/>
  </linearGradient>
  <filter id="tg" x="-10%" y="-10%" width="120%" height="120%">
    <feGaussianBlur in="SourceAlpha" stdDeviation="8" result="b"/>
    <feFlood flood-color="#cc2233" flood-opacity="0.5" result="c"/>
    <feComposite in="c" in2="b" operator="in" result="g"/>
    <feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <filter id="ds"><feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#000" flood-opacity="0.6"/></filter>
</defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/>
<ellipse cx="600" cy="315" rx="540" ry="340" fill="url(#glow)"/>
<circle cx="100" cy="90" r="200" fill="url(#b1)"/>
<circle cx="1100" cy="540" r="220" fill="url(#b2)"/>
<circle cx="960" cy="70" r="130" fill="url(#b1)" opacity="0.45"/>
<rect x="0" y="0" width="${W}" height="3" fill="url(#acc)"/>
<rect x="0" y="${H-3}" width="${W}" height="3" fill="url(#acc)"/>
<g transform="translate(44,18) scale(0.188)" opacity="0.92">${LOGO}</g>
<text x="100" y="44" font-family="Arial,sans-serif" font-size="17" font-weight="bold"
    letter-spacing="3" fill="#d4a844" opacity="0.9" filter="url(#ds)">ENGLISH FLUENCY JOURNEY</text>
<text x="${W-48}" y="44" font-family="Arial,sans-serif" font-size="13" letter-spacing="2"
    fill="white" text-anchor="end" opacity="0.3">POEM #${id}</text>
<text x="600" y="${titleY - 52}" font-family="Georgia,serif" font-size="130"
    fill="#880000" text-anchor="middle" opacity="0.15">&quot;</text>
${titleSvg}
<text x="600" y="${authorY + 14}" font-family="Arial,sans-serif" font-size="26"
    font-weight="300" font-style="italic" fill="#d4a844" text-anchor="middle"
    filter="url(#ds)">&#8212; ${xe(author)}</text>
<line x1="160" y1="${dividerY}" x2="1040" y2="${dividerY}" stroke="white" stroke-width="0.5" opacity="0.1"/>
${openSvg}
<text x="600" y="${tagY}" font-family="Arial,sans-serif" font-size="13" letter-spacing="4"
    fill="white" text-anchor="middle" opacity="0.22">POETRY PRACTICE &#183; myenglish.my.id</text>
</svg>`;
}

// ── Story SVG ─────────────────────────────────────────────────────────────

function storySvg({ month, day, title, country, imageDescription }) {
    const W = 1200, H = 630;
    const titleLines = wrapText(title, 26);
    const LINE_H = 72;
    const titleBlock = titleLines.length * LINE_H;
    const titleY = Math.round(H / 2 - titleBlock / 2 - 44);

    const titleSvg = titleLines.map((line, i) =>
        `<text x="600" y="${titleY + i * LINE_H}"
            font-family="Arial,sans-serif" font-size="64" font-weight="bold"
            fill="white" text-anchor="middle" dominant-baseline="middle"
            filter="url(#tg)">${xe(line)}</text>`
    ).join('');

    const countryY  = titleY + titleBlock + 30;
    const dividerY  = countryY + 52;
    const snippetY  = dividerY + 36;
    const rawSnip   = imageDescription || '';
    const snip      = rawSnip.length > 130 ? rawSnip.slice(0, 127).trim() + '…' : rawSnip;
    const snipLines = snip ? wrapText(snip, 62) : [];
    const snipSvg   = snipLines.map((line, i) =>
        `<text x="600" y="${snippetY + i * 30}"
            font-family="Arial,sans-serif" font-size="20" font-style="italic"
            fill="white" text-anchor="middle" opacity="0.48">${xe(line)}</text>`
    ).join('');
    const tagY     = snippetY + snipLines.length * 30 + 38;
    const globalDay = (month - 1) * 30 + day;

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#060d0f"/>
    <stop offset="50%" stop-color="#061218"/>
    <stop offset="100%" stop-color="#04080e"/>
  </linearGradient>
  <radialGradient id="glow" cx="50%" cy="50%" r="55%">
    <stop offset="0%" stop-color="#0a3a50" stop-opacity="0.7"/>
    <stop offset="100%" stop-color="#060d0f" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="b1" cx="50%" cy="50%" r="50%">
    <stop offset="0%" stop-color="#093050" stop-opacity="0.35"/>
    <stop offset="100%" stop-color="#093050" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="b2" cx="50%" cy="50%" r="50%">
    <stop offset="0%" stop-color="#880000" stop-opacity="0.22"/>
    <stop offset="100%" stop-color="#880000" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="acc" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%" stop-color="#0077aa" stop-opacity="0"/>
    <stop offset="35%" stop-color="#0077aa"/>
    <stop offset="65%" stop-color="#d4a844"/>
    <stop offset="100%" stop-color="#d4a844" stop-opacity="0"/>
  </linearGradient>
  <filter id="tg" x="-10%" y="-10%" width="120%" height="120%">
    <feGaussianBlur in="SourceAlpha" stdDeviation="8" result="b"/>
    <feFlood flood-color="#0099cc" flood-opacity="0.45" result="c"/>
    <feComposite in="c" in2="b" operator="in" result="g"/>
    <feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <filter id="ds"><feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#000" flood-opacity="0.6"/></filter>
</defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/>
<ellipse cx="600" cy="315" rx="540" ry="340" fill="url(#glow)"/>
<circle cx="100" cy="90" r="200" fill="url(#b1)"/>
<circle cx="1100" cy="540" r="220" fill="url(#b2)"/>
<circle cx="980" cy="80" r="130" fill="url(#b1)" opacity="0.4"/>
<rect x="0" y="0" width="${W}" height="3" fill="url(#acc)"/>
<rect x="0" y="${H-3}" width="${W}" height="3" fill="url(#acc)"/>
<g transform="translate(44,18) scale(0.188)" opacity="0.9">${LOGO}</g>
<text x="100" y="44" font-family="Arial,sans-serif" font-size="17" font-weight="bold"
    letter-spacing="3" fill="#d4a844" opacity="0.88" filter="url(#ds)">ENGLISH FLUENCY JOURNEY</text>
<text x="${W-48}" y="44" font-family="Arial,sans-serif" font-size="13" letter-spacing="2"
    fill="white" text-anchor="end" opacity="0.3">DAY ${globalDay}</text>
${titleSvg}
<text x="600" y="${countryY + 14}" font-family="Arial,sans-serif" font-size="22"
    font-weight="600" letter-spacing="5" fill="#d4a844" text-anchor="middle"
    filter="url(#ds)">${xe(country.toUpperCase())}</text>
<line x1="160" y1="${dividerY}" x2="1040" y2="${dividerY}" stroke="white" stroke-width="0.5" opacity="0.1"/>
${snipSvg}
<text x="600" y="${tagY}" font-family="Arial,sans-serif" font-size="13" letter-spacing="4"
    fill="white" text-anchor="middle" opacity="0.22">90-DAY READING CHALLENGE &#183; myenglish.my.id</text>
</svg>`;
}

// ── Main ──────────────────────────────────────────────────────────────────

const outDir = join(root, 'public/og');
mkdirSync(outDir, { recursive: true });

// Poems
const poems = JSON.parse(readFileSync(join(root, 'src/data/poems.json'), 'utf8'));
console.log(`\n[generate-og] Generating poem OG images...`);
for (const poem of poems) {
    const opening = firstLine(poem.text);
    const svg = poemSvg({ id: poem.id, title: poem.title, author: poem.author, opening });
    const png = await sharp(Buffer.from(svg)).png().toBuffer();
    await writeFile(join(outDir, `poem-${poem.id}.png`), png);
    console.log(`  ✓ poem-${poem.id}.png  (${poem.title})`);
}

// Stories
console.log(`\n[generate-og] Generating story OG images...`);
for (const month of [1, 2, 3, 4]) {
    const data = JSON.parse(readFileSync(join(root, `src/data/month${month}.json`), 'utf8'));
    for (const story of data) {
        const svg = storySvg({
            month, day: story.day,
            title: story.title,
            country: story.country,
            imageDescription: story.imageDescription || '',
        });
        const png = await sharp(Buffer.from(svg)).png().toBuffer();
        await writeFile(join(outDir, `story-${month}-${story.day}.png`), png);
        console.log(`  ✓ story-${month}-${story.day}.png  (${story.title})`);
    }
}

console.log(`\n[generate-og] Done.\n`);
