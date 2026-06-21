// Dynamic OG image endpoint: /og/:id
// Returns a branded SVG per poem — data loaded at runtime from /data/poems.json
// so adding new poems requires NO changes to this file.

import { favicon } from '../_shared/favicon.js';

// ── helpers ──────────────────────────────────────────────────────────────────

function wrapText(text, maxCharsPerLine) {
    const words = text.split(' ');
    const lines = [];
    let current = '';
    for (const word of words) {
        if ((current + ' ' + word).trim().length > maxCharsPerLine) {
            if (current) lines.push(current.trim());
            current = word;
        } else {
            current = (current + ' ' + word).trim();
        }
    }
    if (current) lines.push(current.trim());
    return lines;
}

function x(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

// ── SVG generator ─────────────────────────────────────────────────────────────

function generateSvg({ id, title, author, opening }) {
    const W = 1200, H = 630;

    const titleLines = wrapText(title, 26);
    const LINE_H = 74;
    const titleBlock = titleLines.length * LINE_H;
    const titleY = Math.round(H / 2 - titleBlock / 2 - 50);

    const titleSvg = titleLines.map((line, i) => `
    <text x="600" y="${titleY + i * LINE_H}"
          font-family="Helvetica Neue,Helvetica,Arial,sans-serif"
          font-size="66" font-weight="700"
          fill="white" text-anchor="middle" dominant-baseline="middle"
          filter="url(#tg)">${x(line)}</text>`).join('');

    const authorY   = titleY + titleBlock + 32;
    const dividerY  = authorY + 54;
    const openingY  = dividerY + 36;
    const openLines = opening ? wrapText(opening, 62) : [];
    const openSvg   = openLines.map((line, i) => `
    <text x="600" y="${openingY + i * 30}"
          font-family="Helvetica Neue,Helvetica,Arial,sans-serif"
          font-size="20" font-style="italic"
          fill="white" text-anchor="middle" opacity="0.5">${x(line)}</text>`).join('');

    const tagY = openingY + openLines.length * 30 + 36;

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%"   stop-color="#0d0608"/>
    <stop offset="50%"  stop-color="#1c060a"/>
    <stop offset="100%" stop-color="#080412"/>
  </linearGradient>
  <radialGradient id="glow" cx="50%" cy="50%" r="55%">
    <stop offset="0%"   stop-color="#6b0f1a" stop-opacity="0.65"/>
    <stop offset="100%" stop-color="#0d0608" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="b1" cx="50%" cy="50%" r="50%">
    <stop offset="0%"   stop-color="#8b1a2a" stop-opacity="0.3"/>
    <stop offset="100%" stop-color="#8b1a2a" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="b2" cx="50%" cy="50%" r="50%">
    <stop offset="0%"   stop-color="#1a0840" stop-opacity="0.28"/>
    <stop offset="100%" stop-color="#1a0840" stop-opacity="0"/>
  </radialGradient>
  <!-- accent gradient (crimson→gold) -->
  <linearGradient id="acc" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%"   stop-color="#cc2233" stop-opacity="0"/>
    <stop offset="35%"  stop-color="#cc2233"/>
    <stop offset="65%"  stop-color="#d4a844"/>
    <stop offset="100%" stop-color="#d4a844" stop-opacity="0"/>
  </linearGradient>
  <!-- title glow filter -->
  <filter id="tg" x="-10%" y="-10%" width="120%" height="120%">
    <feGaussianBlur in="SourceAlpha" stdDeviation="8" result="b"/>
    <feFlood flood-color="#cc2233" flood-opacity="0.55" result="c"/>
    <feComposite in="c" in2="b" operator="in" result="g"/>
    <feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <filter id="ds">
    <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#000" flood-opacity="0.7"/>
  </filter>
</defs>

<!-- BG -->
<rect width="${W}" height="${H}" fill="url(#bg)"/>
<ellipse cx="600" cy="315" rx="540" ry="340" fill="url(#glow)"/>
<circle cx="100" cy="90"  r="200" fill="url(#b1)"/>
<circle cx="1100" cy="540" r="220" fill="url(#b2)"/>
<circle cx="960"  cy="70"  r="130" fill="url(#b1)" opacity="0.45"/>

<!-- top accent bar -->
<rect x="0" y="0" width="${W}" height="3" fill="url(#acc)"/>
<!-- bottom accent bar -->
<rect x="0" y="${H-3}" width="${W}" height="3" fill="url(#acc)"/>

<!-- ── LOGO (top-left) — favicon.svg inline, scaled to 44px ── -->
<g transform="translate(44,20) scale(0.188)" opacity="0.92">
${favicon}
</g>

<!-- brand name -->
<text x="100" y="44"
      font-family="Helvetica Neue,Helvetica,Arial,sans-serif"
      font-size="17" font-weight="600" letter-spacing="3"
      fill="#d4a844" opacity="0.9" filter="url(#ds)">ENGLISH FLUENCY JOURNEY</text>

<!-- TYPE label top-right -->
<text x="${W-48}" y="44"
      font-family="Helvetica Neue,Helvetica,Arial,sans-serif"
      font-size="14" letter-spacing="2"
      fill="white" text-anchor="end" opacity="0.3">POEM #${id}</text>

<!-- large open-quote decoration -->
<text x="600" y="${titleY - 50}"
      font-family="Georgia,serif" font-size="140"
      fill="#880000" text-anchor="middle" opacity="0.18">"</text>

<!-- TITLE -->
${titleSvg}

<!-- AUTHOR -->
<text x="600" y="${authorY + 14}"
      font-family="Helvetica Neue,Helvetica,Arial,sans-serif"
      font-size="26" font-weight="300" font-style="italic"
      fill="#d4a844" text-anchor="middle" filter="url(#ds)">— ${x(author)}</text>

<!-- divider -->
<line x1="160" y1="${dividerY}" x2="1040" y2="${dividerY}"
      stroke="white" stroke-width="0.5" opacity="0.1"/>

<!-- OPENING LINE SNEAK PEEK -->
${openSvg}

<!-- tagline -->
<text x="600" y="${tagY}"
      font-family="Helvetica Neue,Helvetica,Arial,sans-serif"
      font-size="13" letter-spacing="4"
      fill="white" text-anchor="middle" opacity="0.22">POETRY PRACTICE · myenglish.my.id</text>
</svg>`;
}

// ── handler ───────────────────────────────────────────────────────────────────

export async function onRequest(context) {
    const url  = new URL(context.request.url);
    const parts = url.pathname.split('/').filter(Boolean);
    const id   = parseInt(parts[parts.length - 1]);

    // Load poems.json at runtime — no manual list needed
    let poem = null;
    try {
        const dataUrl = new URL('/data/poems.json', url.origin);
        const res = await fetch(dataUrl.href);
        if (res.ok) {
            const poems = await res.json();
            poem = poems.find(p => p.id === id) || null;
        }
    } catch (_) { /* fall through to fallback */ }

    const target = poem
        ? { id: poem.id, title: poem.title, author: poem.author, opening: poem.opening || '' }
        : { id: 0, title: 'English Fluency Journey', author: 'Read the World, Speak with Confidence', opening: '' };

    return new Response(generateSvg(target), {
        status: 200,
        headers: {
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 'public, max-age=86400, s-maxage=86400',
            'Access-Control-Allow-Origin': '*',
        },
    });
}
