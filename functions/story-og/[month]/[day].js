// Dynamic OG image endpoint: /story-og/:month/:day
// Returns a branded SVG per reading-challenge story.
// Data loaded at runtime from /data/month{n}.json — zero manual updates needed.

import { favicon } from '../../_shared/favicon.js';

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

function x(s) {
    return String(s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function generateSvg({ month, day, title, country, imageDescription }) {
    const W = 1200, H = 630;

    const titleLines = wrapText(title, 26);
    const LINE_H = 74;
    const titleBlock = titleLines.length * LINE_H;
    const titleY = Math.round(H / 2 - titleBlock / 2 - 44);

    const titleSvg = titleLines.map((line, i) => `
    <text x="600" y="${titleY + i * LINE_H}"
          font-family="Helvetica Neue,Helvetica,Arial,sans-serif"
          font-size="66" font-weight="700"
          fill="white" text-anchor="middle" dominant-baseline="middle"
          filter="url(#tg)">${x(line)}</text>`).join('');

    const countryY = titleY + titleBlock + 30;
    const dividerY = countryY + 54;
    const snippetY = dividerY + 36;

    // Use imageDescription as a sneak peek (trim to ~130 chars)
    const snippet = imageDescription
        ? imageDescription.length > 130
            ? imageDescription.slice(0, 127).trim() + '…'
            : imageDescription
        : '';
    const snippetLines = snippet ? wrapText(snippet, 64) : [];
    const snippetSvg   = snippetLines.map((line, i) => `
    <text x="600" y="${snippetY + i * 30}"
          font-family="Helvetica Neue,Helvetica,Arial,sans-serif"
          font-size="20" font-style="italic"
          fill="white" text-anchor="middle" opacity="0.48">${x(line)}</text>`).join('');

    const tagY = snippetY + snippetLines.length * 30 + 38;
    const dayLabel = `Day ${(month - 1) * 30 + day}`;

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%"   stop-color="#060d0f"/>
    <stop offset="50%"  stop-color="#061218"/>
    <stop offset="100%" stop-color="#04080e"/>
  </linearGradient>
  <radialGradient id="glow" cx="50%" cy="50%" r="55%">
    <stop offset="0%"   stop-color="#0a3a50" stop-opacity="0.7"/>
    <stop offset="100%" stop-color="#060d0f" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="b1" cx="50%" cy="50%" r="50%">
    <stop offset="0%"   stop-color="#093050" stop-opacity="0.35"/>
    <stop offset="100%" stop-color="#093050" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="b2" cx="50%" cy="50%" r="50%">
    <stop offset="0%"   stop-color="#880000" stop-opacity="0.22"/>
    <stop offset="100%" stop-color="#880000" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="acc" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%"   stop-color="#0077aa" stop-opacity="0"/>
    <stop offset="35%"  stop-color="#0077aa"/>
    <stop offset="65%"  stop-color="#d4a844"/>
    <stop offset="100%" stop-color="#d4a844" stop-opacity="0"/>
  </linearGradient>
  <filter id="tg" x="-10%" y="-10%" width="120%" height="120%">
    <feGaussianBlur in="SourceAlpha" stdDeviation="8" result="b"/>
    <feFlood flood-color="#0099cc" flood-opacity="0.45" result="c"/>
    <feComposite in="c" in2="b" operator="in" result="g"/>
    <feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <filter id="ds">
    <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#000" flood-opacity="0.7"/>
  </filter>
</defs>

<rect width="${W}" height="${H}" fill="url(#bg)"/>
<ellipse cx="600" cy="315" rx="540" ry="340" fill="url(#glow)"/>
<circle cx="100"  cy="90"  r="200" fill="url(#b1)"/>
<circle cx="1100" cy="540" r="220" fill="url(#b2)"/>
<circle cx="980"  cy="80"  r="130" fill="url(#b1)" opacity="0.4"/>

<rect x="0" y="0" width="${W}" height="3" fill="url(#acc)"/>
<rect x="0" y="${H-3}" width="${W}" height="3" fill="url(#acc)"/>

<!-- LOGO -->
<g transform="translate(44,20) scale(0.188)" opacity="0.9">
${favicon}
</g>

<!-- brand -->
<text x="100" y="44"
      font-family="Helvetica Neue,Helvetica,Arial,sans-serif"
      font-size="17" font-weight="600" letter-spacing="3"
      fill="#d4a844" opacity="0.88" filter="url(#ds)">ENGLISH FLUENCY JOURNEY</text>

<!-- day label top-right -->
<text x="${W-48}" y="44"
      font-family="Helvetica Neue,Helvetica,Arial,sans-serif"
      font-size="14" letter-spacing="2"
      fill="white" text-anchor="end" opacity="0.3">${x(dayLabel)}</text>

<!-- globe emoji-style decoration -->
<text x="600" y="${titleY - 48}"
      font-family="Helvetica Neue,Helvetica,Arial,sans-serif"
      font-size="52" text-anchor="middle" opacity="0.2">🌍</text>

<!-- TITLE -->
${titleSvg}

<!-- COUNTRY -->
<text x="600" y="${countryY + 14}"
      font-family="Helvetica Neue,Helvetica,Arial,sans-serif"
      font-size="24" font-weight="300" letter-spacing="4"
      fill="#d4a844" text-anchor="middle" filter="url(#ds)">${x(country.toUpperCase())}</text>

<!-- divider -->
<line x1="160" y1="${dividerY}" x2="1040" y2="${dividerY}"
      stroke="white" stroke-width="0.5" opacity="0.1"/>

<!-- snippet -->
${snippetSvg}

<!-- tagline -->
<text x="600" y="${tagY}"
      font-family="Helvetica Neue,Helvetica,Arial,sans-serif"
      font-size="13" letter-spacing="4"
      fill="white" text-anchor="middle" opacity="0.22">90-DAY READING CHALLENGE · myenglish.my.id</text>
</svg>`;
}

export async function onRequest(context) {
    const url   = new URL(context.request.url);
    const parts = url.pathname.split('/').filter(Boolean);
    // path: /story-og/:month/:day
    const month = parseInt(parts[1]);
    const day   = parseInt(parts[2]);

    let story = null;
    if (month >= 1 && month <= 4 && day >= 1) {
        try {
            const dataUrl = new URL(`/data/month${month}.json`, url.origin);
            const res = await fetch(dataUrl.href);
            if (res.ok) {
                const list = await res.json();
                story = list.find(s => s.day === day) || null;
            }
        } catch (_) { /* fall through */ }
    }

    const target = story
        ? { month, day, title: story.title, country: story.country, imageDescription: story.imageDescription }
        : { month: 0, day: 0, title: 'English Fluency Journey', country: '90-Day Reading Challenge', imageDescription: 'Read captivating stories from 30+ countries and build your English fluency.' };

    return new Response(generateSvg(target), {
        status: 200,
        headers: {
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 'public, max-age=86400, s-maxage=86400',
            'Access-Control-Allow-Origin': '*',
        },
    });
}
