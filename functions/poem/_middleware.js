// Middleware for poem pages: /poem/:id
// Injects per-poem Open Graph meta tags.
// OG images are static PNGs generated at build time by scripts/generate-og-images.js
// Data fetched at runtime from /data/poems.json — no manual updates when adding poems.

// HTML-encode values before inserting into HTML attributes
function he(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

export async function onRequest(context) {
    const { request } = context;
    const url = new URL(request.url);
    const pathname = url.pathname;

    const poemMatch = pathname.match(/^\/poem\/(\d+)\/?$/);
    if (!poemMatch) return context.next();

    const poemId = parseInt(poemMatch[1]);

    // Fetch original SPA HTML
    const response = await context.next();
    const ct = response.headers.get('content-type') || '';
    if (!ct.includes('text/html')) return response;

    // Load poem data at runtime from /data/poems.json (synced from src/data at build time)
    let poem = null;
    try {
        const res = await fetch(new URL('/data/poems.json', url.origin).href);
        if (res.ok) {
            const poems = await res.json();
            poem = poems.find(p => p.id === poemId) || null;
        }
    } catch (_) { /* fall through */ }

    if (!poem) return response;

    // Extract opening line from poem text (first non-empty line)
    const opening = poem.text
        ? poem.text.split('\n').find(l => l.trim())?.replace(/^["""'']+|["""'']+$/g, '').trim() || poem.title
        : poem.title;
    const shortOpening = opening.length > 120 ? opening.slice(0, 117) + '…' : opening;

    // Safe values — HTML-encoded for attribute insertion
    const titleText    = he(`${poem.title} by ${poem.author} | English Fluency Journey`);
    const description  = he(`${shortOpening} — Practice this poem by ${poem.author} on English Fluency Journey.`);
    // Static PNG generated at build time — proper format for WhatsApp, Discord etc.
    const ogImage      = `https://myenglish.my.id/og/poem-${poem.id}.png`;
    const canonicalUrl = `https://myenglish.my.id/poem/${poem.id}`;

    let html = await response.text();

    html = html.replace(/<title>[^<]*<\/title>/, `<title>${titleText}</title>`);
    html = html.replace(/(<meta\s+name=["']title["']\s+content=["'])[^"']*(["'])/, `$1${titleText}$2`);
    html = html.replace(/(<meta\s+name=["']description["']\s+content=["'])[^"']*(["'])/, `$1${description}$2`);
    html = html.replace(/(<meta[\s\S]*?property=["']og:title["'][\s\S]*?content=["'])[^"']*(["'])/, `$1${titleText}$2`);
    html = html.replace(/(<meta[\s\S]*?property=["']og:description["'][\s\S]*?content=["'])[^"']*(["'])/, `$1${description}$2`);
    html = html.replace(/(<meta[\s\S]*?property=["']og:url["'][\s\S]*?content=["'])[^"']*(["'])/, `$1${canonicalUrl}$2`);
    html = html.replace(/(<meta[\s\S]*?property=["']og:image["'][\s\S]*?content=["'])[^"']*(["'])/, `$1${ogImage}$2`);
    html = html.replace(/(<meta[\s\S]*?property=["']og:image:width["'][\s\S]*?content=["'])[^"']*(["'])/, `${`$1`}1200$2`);
    html = html.replace(/(<meta[\s\S]*?property=["']og:image:height["'][\s\S]*?content=["'])[^"']*(["'])/, `${`$1`}630$2`);
    html = html.replace(/(<meta\s+name=["']twitter:title["']\s+content=["'])[^"']*(["'])/, `$1${titleText}$2`);
    html = html.replace(/(<meta\s+name=["']twitter:description["']\s+content=["'])[^"']*(["'])/, `$1${description}$2`);
    html = html.replace(/(<meta\s+name=["']twitter:image["']\s+content=["'])[^"']*(["'])/, `$1${ogImage}$2`);
    html = html.replace(/(<link\s+rel=["']canonical["']\s+href=["'])[^"']*(["'])/, `$1${canonicalUrl}$2`);

    return new Response(html, {
        status: response.status,
        headers: {
            'content-type': 'text/html;charset=UTF-8',
            'cache-control': 'public, max-age=3600',
        },
    });
}
