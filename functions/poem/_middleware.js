// Middleware for poem pages: /poem/:id
// Injects per-poem Open Graph meta tags, canonical URL, CreativeWork JSON-LD schema,
// and pre-renders semantic poem HTML into #root for search engine crawlers.
// OG images are static PNGs generated at build time by scripts/generate-og-images.js
// Data fetched at runtime from /data/poems.json

function he(s) {
    return String(s || '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

const TOTAL_POEMS = 19;

export async function onRequest(context) {
    const { request } = context;
    const url = new URL(request.url);
    const pathname = url.pathname;

    const poemMatch = pathname.match(/^\/poem\/(\d+)\/?$/);
    if (!poemMatch) return context.next();

    const poemId = parseInt(poemMatch[1], 10);

    // Fetch original SPA HTML
    const response = await context.next();
    const ct = response.headers.get('content-type') || '';
    if (!ct.includes('text/html')) return response;

    // Load poem data at runtime from /data/poems.json
    let poem = null;
    try {
        const res = await fetch(new URL('/data/poems.json', url.origin).href);
        if (res.ok) {
            const poems = await res.json();
            poem = poems.find(p => p.id === poemId) || null;
        }
    } catch (_) { /* fall through */ }

    if (!poem) return response;

    const opening = poem.text
        ? poem.text.split('\n').find(l => l.trim())?.replace(/^["""'']+|["""'']+$/g, '').trim() || poem.title
        : poem.title;
    const shortOpening = opening.length > 120 ? opening.slice(0, 117).trim() + '...' : opening;

    const titleText    = he(`${poem.title} by ${poem.author} | English Fluency Journey`);
    const description  = he(`${shortOpening} - Practice this poem by ${poem.author} on English Fluency Journey.`);
    const ogImage      = `https://myenglish.my.id/og/poem-${poem.id}.png`;
    const canonicalUrl = `https://myenglish.my.id/poem/${poem.id}`;

    // Internal crawl chain links
    const prevPoemUrl = poemId > 1 ? `/poem/${poemId - 1}` : null;
    const nextPoemUrl = poemId < TOTAL_POEMS ? `/poem/${poemId + 1}` : null;

    // Pre-rendered semantic HTML for Googlebot and crawlers
    const preRenderedContent = `
<div id="root">
  <main class="poem-article" style="max-width: 760px; margin: 0 auto; padding: 2rem 1rem; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1f2937;">
    <nav style="margin-bottom: 1.5rem; font-size: 0.875rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
      <div>
        <a href="/" style="color: #880000; text-decoration: none; font-weight: 500;">Home</a> / <a href="/poem" style="color: #880000; text-decoration: none; font-weight: 500;">Poems</a> / <span>${he(poem.title)}</span>
      </div>
      <div>
        <a href="/m1-day1" style="color: #4b5563; text-decoration: none; font-size: 0.875rem;">Reading Stories</a>
      </div>
    </nav>
    <header style="margin-bottom: 2rem;">
      <h1 style="font-size: 2.25rem; font-weight: 800; line-height: 1.25; margin: 0 0 0.5rem 0; color: #111827;">
        ${he(poem.title)}
      </h1>
      <p style="color: #6b7280; font-style: italic; font-size: 1rem; margin: 0;">
        Written by ${he(poem.author)}
      </p>
    </header>
    <article class="poem-body" style="font-size: 1.125rem; line-height: 1.9; white-space: pre-line; color: #374151;">
      ${he(poem.text || '')}
    </article>
    <footer style="margin-top: 3rem; padding-top: 1.5rem; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
      ${prevPoemUrl ? `<a href="${prevPoemUrl}" style="color: #880000; text-decoration: none; font-weight: 600;">&larr; Previous Poem</a>` : '<span></span>'}
      <a href="/poem" style="color: #6b7280; text-decoration: none; font-size: 0.875rem;">All Poems</a>
      ${nextPoemUrl ? `<a href="${nextPoemUrl}" style="color: #880000; text-decoration: none; font-weight: 600;">Next Poem &rarr;</a>` : '<span></span>'}
    </footer>
  </main>
</div>`;

    // JSON-LD structured data for Poem / CreativeWork
    const schemaJson = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'CreativeWork',
        headline: poem.title,
        name: poem.title,
        author: {
            '@type': 'Person',
            name: poem.author
        },
        description: shortOpening,
        image: ogImage,
        inLanguage: 'en',
        mainEntityOfPage: canonicalUrl,
        publisher: {
            '@type': 'Organization',
            name: 'English Fluency Journey',
            logo: {
                '@type': 'ImageObject',
                url: 'https://myenglish.my.id/logo-icon.svg'
            }
        }
    });

    const schemaTag = `<script type="application/ld+json">${schemaJson}</script>`;

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

    // Inject Schema JSON-LD before closing head tag
    if (html.includes('</head>')) {
        html = html.replace('</head>', `${schemaTag}\n</head>`);
    }

    // Replace empty root with pre-rendered poem content
    if (html.includes('<div id="root"></div>')) {
        html = html.replace('<div id="root"></div>', preRenderedContent);
    }

    return new Response(html, {
        status: response.status,
        headers: {
            'content-type': 'text/html;charset=UTF-8',
            'cache-control': 'public, max-age=3600',
        },
    });
}
