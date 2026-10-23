// Middleware for reading challenge day pages: /m{month}-day{day}
// Injects per-story Open Graph meta tags, canonical URL, Article JSON-LD schema,
// and pre-renders semantic story HTML into #root for crawlers (Googlebot, Bingbot, AI search).
// OG images are static PNGs generated at build time by scripts/generate-og-images.js

function he(s) {
    return String(s || '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

const MONTH_DAYS = { 1: 30, 2: 31, 3: 30, 4: 30 };

export async function onRequest(context) {
    const { request } = context;
    const url = new URL(request.url);
    const pathname = url.pathname;

    const match = pathname.match(/^\/m(\d+)-day(\d+)\/?$/);
    if (!match) return context.next();

    const month = parseInt(match[1], 10);
    const day   = parseInt(match[2], 10);

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
    const shortDesc    = rawDesc.length > 150 ? rawDesc.slice(0, 147).trim() + '...' : rawDesc;

    const titleText    = he(`${story.title} - Day ${globalDay} | English Fluency Journey`);
    const description  = he(`${story.country}: ${shortDesc}`);
    const ogImage      = `https://myenglish.my.id/og/story-${month}-${day}.png`;
    const canonicalUrl = `https://myenglish.my.id/m${month}-day${day}`;

    // Calculate previous and next story links for SEO crawl chain
    const maxDays = MONTH_DAYS[month] || 30;
    let prevUrl = null;
    let nextUrl = null;

    if (day > 1) {
        prevUrl = `/m${month}-day${day - 1}`;
    } else if (month > 1) {
        const prevMonthMax = MONTH_DAYS[month - 1] || 30;
        prevUrl = `/m${month - 1}-day${prevMonthMax}`;
    }

    if (day < maxDays) {
        nextUrl = `/m${month}-day${day + 1}`;
    } else if (month < 4) {
        nextUrl = `/m${month + 1}-day1`;
    }

    // Prepare story paragraphs
    const storyText = story.text || story.story || '';
    const paragraphs = storyText
        .split(/\n\n+/)
        .map(p => p.trim())
        .filter(Boolean);

    const paragraphsHtml = paragraphs.length > 0
        ? paragraphs.map(p => `<p style="margin-bottom: 1.25rem;">${he(p)}</p>`).join('')
        : `<p style="margin-bottom: 1.25rem;">${he(storyText)}</p>`;

    // Pre-rendered semantic HTML for Googlebot and crawlers
    const preRenderedContent = `
<div id="root">
  <main class="reading-article" style="max-width: 760px; margin: 0 auto; padding: 2rem 1rem; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1f2937;">
    <nav style="margin-bottom: 1.5rem; font-size: 0.875rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
      <div>
        <a href="/" style="color: #880000; text-decoration: none; font-weight: 500;">Home</a> / <a href="/m1-day1" style="color: #880000; text-decoration: none; font-weight: 500;">Stories</a> / <span>Month ${month} Day ${day}</span>
      </div>
      <div>
        <a href="/poem" style="color: #4b5563; text-decoration: none; font-size: 0.875rem; margin-right: 1rem;">Poems</a>
        <a href="/roulette" style="color: #4b5563; text-decoration: none; font-size: 0.875rem;">Roulette</a>
      </div>
    </nav>
    <header style="margin-bottom: 2rem;">
      <p style="color: #880000; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; font-size: 0.875rem; margin-bottom: 0.5rem;">
        Day ${globalDay} - ${he(story.country)}
      </p>
      <h1 style="font-size: 2.25rem; font-weight: 800; line-height: 1.25; margin: 0 0 1rem 0; color: #111827;">
        ${he(story.title)}
      </h1>
    </header>
    ${story.localImage ? `
    <figure style="margin: 0 0 2rem 0;">
      <img src="${story.localImage}" alt="${he(story.imageTitle || story.title)}" style="width: 100%; max-height: 480px; object-fit: cover; border-radius: 12px;" />
    </figure>
    ` : ''}
    <article class="story-body" style="font-size: 1.125rem; line-height: 1.8; color: #374151;">
      ${paragraphsHtml}
    </article>
    ${story.imageDescription ? `
    <section style="margin-top: 2.5rem; padding: 1.25rem; background-color: #f3f4f6; border-radius: 8px; border-left: 4px solid #880000;">
      <h2 style="font-size: 1rem; font-weight: 600; margin-top: 0; margin-bottom: 0.5rem; color: #1f2937;">Cultural Context</h2>
      <p style="margin: 0; font-size: 0.875rem; line-height: 1.6; color: #4b5563;">${he(story.imageDescription)}</p>
    </section>
    ` : ''}
    <footer style="margin-top: 3rem; padding-top: 1.5rem; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
      ${prevUrl ? `<a href="${prevUrl}" style="color: #880000; text-decoration: none; font-weight: 600;">&larr; Previous Story</a>` : '<span></span>'}
      <a href="/" style="color: #6b7280; text-decoration: none; font-size: 0.875rem;">Challenge Overview</a>
      ${nextUrl ? `<a href="${nextUrl}" style="color: #880000; text-decoration: none; font-weight: 600;">Next Story &rarr;</a>` : '<span></span>'}
    </footer>
  </main>
</div>`;

    // JSON-LD structured data for Google Article Rich Results
    const schemaJson = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: `${story.title} - Day ${globalDay}`,
        description: shortDesc,
        image: ogImage,
        inLanguage: 'en',
        mainEntityOfPage: canonicalUrl,
        author: {
            '@type': 'Organization',
            name: 'English Fluency Journey',
            url: 'https://myenglish.my.id'
        },
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

    // Replace empty root with pre-rendered story content
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
