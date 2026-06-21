// Middleware for reading challenge day pages: /m{month}-day{day}
// Injects per-story Open Graph meta tags.
// OG images are static PNGs generated at build time by scripts/generate-og-images.js

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

    const match = pathname.match(/^\/m(\d+)-day(\d+)\/?$/);
    if (!match) return context.next();

    const month = parseInt(match[1]);
    const day   = parseInt(match[2]);

    const response = await context.next();
    const ct = response.headers.get('content-type') || '';
    if (!ct.includes('text/html')) return response;

    // Load story data at runtime
    let story = null;
    if (month >= 1 && month <= 4) {
        try {
            const res = await fetch(new URL(`/data/month${month}.json`, url.origin).href);
            if (res.ok) {
                const list = await res.json();
                story = list.find(s => s.day === day) || null;
            }
        } catch (_) { /* fall through */ }
    }

    if (!story) return response;

    const globalDay    = (month - 1) * 30 + day;
    const rawDesc      = story.imageDescription || `Read today's story from ${story.country} and build your English fluency.`;
    const shortDesc    = rawDesc.length > 150 ? rawDesc.slice(0, 147).trim() + '…' : rawDesc;

    const titleText    = he(`${story.title} — Day ${globalDay} | English Fluency Journey`);
    const description  = he(`${story.country}: ${shortDesc}`);
    // Static PNG generated at build time
    const ogImage      = `https://myenglish.my.id/og/story-${month}-${day}.png`;
    const canonicalUrl = `https://myenglish.my.id${pathname}`;

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
