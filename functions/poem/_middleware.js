// Middleware for poem pages: /poem/:id
// Injects per-poem Open Graph meta tags for WhatsApp, Telegram, Discord etc.
// Data fetched at runtime from /data/poems.json — no manual updates when adding poems.

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

    // Load poem data at runtime from /data/poems.json
    let poem = null;
    try {
        const dataUrl = new URL('/data/poems.json', url.origin);
        const res = await fetch(dataUrl.href);
        if (res.ok) {
            const poems = await res.json();
            poem = poems.find(p => p.id === poemId) || null;
        }
    } catch (_) { /* fall through */ }

    if (!poem) return response;

    const titleText   = `${poem.title} by ${poem.author} | English Fluency Journey`;
    const description = `"${poem.opening || poem.title}" — Practice this poem by ${poem.author} on English Fluency Journey.`;
    const ogImage     = `https://myenglish.my.id/og/${poem.id}`;
    const canonicalUrl = `https://myenglish.my.id/poem/${poem.id}`;

    let html = await response.text();

    // <title>
    html = html.replace(/<title>[^<]*<\/title>/, `<title>${titleText}</title>`);

    html = html.replace(/(<meta\s+name=["']title["']\s+content=["'])[^"']*(["'])/, `$1${titleText}$2`);
    html = html.replace(/(<meta\s+name=["']description["']\s+content=["'])[^"']*(["'])/, `$1${description}$2`);

    html = html.replace(/(<meta\s+property=["']og:title["']\s+content=["'])[^"']*(["'])/, `$1${titleText}$2`);
    html = html.replace(/(<meta\s+property=["']og:description["']\s+content=["'])[^"']*(["'])/, `$1${description}$2`);
    html = html.replace(/(<meta\s+property=["']og:url["']\s+content=["'])[^"']*(["'])/, `$1${canonicalUrl}$2`);
    html = html.replace(/(<meta\s+property=["']og:image["']\s+content=["'])[^"']*(["'])/, `$1${ogImage}$2`);
    html = html.replace(/(<meta\s+property=["']og:image:width["']\s+content=["'])[^"']*(["'])/, `$11200$2`);
    html = html.replace(/(<meta\s+property=["']og:image:height["']\s+content=["'])[^"']*(["'])/, `$1630$2`);

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
