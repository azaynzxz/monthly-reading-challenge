// Middleware for reading challenge day pages: /m{month}-day{day}
// Injects per-story Open Graph meta tags so WhatsApp, Telegram, Discord etc.
// show the story title, country, and the dynamic OG image.
// Data is fetched at runtime from /data/month{n}.json — zero manual updates needed.

function escRx(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function replaceAttr(html, selector, attr, value) {
    // Handles: <meta property="..." content="..." /> with attributes in any order
    const re = new RegExp(
        `(<meta\\s[^>]*${escRx(selector)}[^>]*${escRx(attr)}=["\'])[^"\']*(["\'])`,
        'i'
    );
    const re2 = new RegExp(
        `(<meta\\s[^>]*${escRx(attr)}=["\'])[^"\']*(["\'][^>]*${escRx(selector)})`,
        'i'
    );
    if (re.test(html))  return html.replace(re,  `$1${value}$2`);
    if (re2.test(html)) return html.replace(re2, `$1${value}$2`);
    return html;
}

export async function onRequest(context) {
    const { request } = context;
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Only handle /m{1-4}-day{1-30}
    const match = pathname.match(/^\/m(\d+)-day(\d+)\/?$/);
    if (!match) return context.next();

    const month = parseInt(match[1]);
    const day   = parseInt(match[2]);

    // Fetch original SPA HTML
    const response = await context.next();
    const ct = response.headers.get('content-type') || '';
    if (!ct.includes('text/html')) return response;

    // Load story data at runtime
    let story = null;
    if (month >= 1 && month <= 4) {
        try {
            const dataUrl = new URL(`/data/month${month}.json`, url.origin);
            const res = await fetch(dataUrl.href);
            if (res.ok) {
                const list = await res.json();
                story = list.find(s => s.day === day) || null;
            }
        } catch (_) { /* fall through to generic */ }
    }

    // If no matching story, return unmodified
    if (!story) return response;

    const globalDay   = (month - 1) * 30 + day;
    const titleText   = `${story.title} — Day ${globalDay} | English Fluency Journey`;
    const description = `${story.country}: ${story.imageDescription
        ? story.imageDescription.slice(0, 140).trim() + (story.imageDescription.length > 140 ? '…' : '')
        : `Read today's story from ${story.country} and build your English fluency.`}`;
    const ogImage     = `https://myenglish.my.id/story-og/${month}/${day}`;
    const canonicalUrl = `https://myenglish.my.id${pathname}`;

    let html = await response.text();

    // <title>
    html = html.replace(/<title>[^<]*<\/title>/, `<title>${titleText}</title>`);

    // meta name="title"
    html = html.replace(
        /(<meta\s+name=["']title["']\s+content=["'])[^"']*(["'])/,
        `$1${titleText}$2`
    );

    // meta name="description"
    html = html.replace(
        /(<meta\s+name=["']description["']\s+content=["'])[^"']*(["'])/,
        `$1${description}$2`
    );

    // og:title
    html = html.replace(
        /(<meta\s+property=["']og:title["']\s+content=["'])[^"']*(["'])/,
        `$1${titleText}$2`
    );

    // og:description
    html = html.replace(
        /(<meta\s+property=["']og:description["']\s+content=["'])[^"']*(["'])/,
        `$1${description}$2`
    );

    // og:url
    html = html.replace(
        /(<meta\s+property=["']og:url["']\s+content=["'])[^"']*(["'])/,
        `$1${canonicalUrl}$2`
    );

    // og:image  (dynamic SVG endpoint)
    html = html.replace(
        /(<meta\s+property=["']og:image["']\s+content=["'])[^"']*(["'])/,
        `$1${ogImage}$2`
    );

    // og:image:width / height
    html = html.replace(
        /(<meta\s+property=["']og:image:width["']\s+content=["'])[^"']*(["'])/,
        `$11200$2`
    );
    html = html.replace(
        /(<meta\s+property=["']og:image:height["']\s+content=["'])[^"']*(["'])/,
        `$1630$2`
    );

    // twitter:title
    html = html.replace(
        /(<meta\s+name=["']twitter:title["']\s+content=["'])[^"']*(["'])/,
        `$1${titleText}$2`
    );

    // twitter:description
    html = html.replace(
        /(<meta\s+name=["']twitter:description["']\s+content=["'])[^"']*(["'])/,
        `$1${description}$2`
    );

    // twitter:image
    html = html.replace(
        /(<meta\s+name=["']twitter:image["']\s+content=["'])[^"']*(["'])/,
        `$1${ogImage}$2`
    );

    // canonical
    html = html.replace(
        /(<link\s+rel=["']canonical["']\s+href=["'])[^"']*(["'])/,
        `$1${canonicalUrl}$2`
    );

    return new Response(html, {
        status: response.status,
        headers: {
            'content-type': 'text/html;charset=UTF-8',
            'cache-control': 'public, max-age=3600',
        },
    });
}
