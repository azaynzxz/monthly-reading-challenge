// Root middleware for Cloudflare Pages
// Fixes canonical URLs and SEO meta tags across all core static pages (/about, /poem, /roulette, etc.)
// Prevents all sub-pages from falling back to homepage canonical and title tags.

const routeMetadata = {
    '/about': {
        title: 'About Us | English Fluency Journey',
        description: 'Learn about English Fluency Journey, our mission to make language learning accessible, and how our 90-day reading challenge works.'
    },
    '/poem': {
        title: 'English Poems Collection | English Fluency Journey',
        description: 'Explore inspirational English poems with audio recitation, vocabulary highlights, and reading practice.'
    },
    '/roulette': {
        title: 'Story Roulette - Random Reading Practice | English Fluency Journey',
        description: 'Spin the roulette wheel to get a random English practice story from 30+ countries around the world.'
    },
    '/review': {
        title: 'Review and Vocabulary Practice | English Fluency Journey',
        description: 'Review your learned English vocabulary, bookmarked stories, and track your daily reading progress.'
    },
    '/transcribe': {
        title: 'Speech to Text Transcription Practice | English Fluency Journey',
        description: 'Listen and transcribe audio to test your English listening comprehension and spelling accuracy.'
    },
    '/donate': {
        title: 'Support English Fluency Journey | English Fluency Journey',
        description: 'Help keep English Fluency Journey 100% free forever for learners around the world.'
    },
    '/hello': {
        title: 'Hello - Welcome to English Fluency Journey',
        description: 'Connect with English Fluency Journey community, resources, and free learning tools.'
    },
    '/hello/shop': {
        title: 'Shop Learning Materials | English Fluency Journey',
        description: 'Explore curated learning materials, e-books, and practice worksheets.'
    },
    '/hello/freebies': {
        title: 'Free English Learning Resources & Downloads | English Fluency Journey',
        description: 'Download free printable English practice sheets, vocabulary guides, and reading trackers.'
    }
};

export async function onRequest(context) {
    const { request } = context;
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Skip static assets
    if (pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico|xml|txt|json|js|css|woff2?|webmanifest)$/i)) {
        return context.next();
    }

    const response = await context.next();
    const ct = response.headers.get('content-type') || '';
    if (!ct.includes('text/html')) return response;

    // If sub-middleware already handled it (/m*-day* or /poem/:id), pass through directly
    if (pathname.match(/^\/m\d+-day\d+\/?$/) || pathname.match(/^\/poem\/\d+\/?$/)) {
        return response;
    }

    const cleanPath = pathname.replace(/\/+$/, '') || '/';
    const canonicalUrl = cleanPath === '/' ? 'https://myenglish.my.id/' : `https://myenglish.my.id${cleanPath}`;

    const meta = routeMetadata[cleanPath];
    let html = await response.text();

    // Set correct canonical URL for this page
    html = html.replace(/(<link\s+rel=["']canonical["']\s+href=["'])[^"']*(["'])/, `$1${canonicalUrl}$2`);

    if (meta) {
        html = html.replace(/<title>[^<]*<\/title>/, `<title>${meta.title}</title>`);
        html = html.replace(/(<meta\s+name=["']title["']\s+content=["'])[^"']*(["'])/, `$1${meta.title}$2`);
        html = html.replace(/(<meta\s+name=["']description["']\s+content=["'])[^"']*(["'])/, `$1${meta.description}$2`);
        html = html.replace(/(<meta[\s\S]*?property=["']og:title["'][\s\S]*?content=["'])[^"']*(["'])/, `$1${meta.title}$2`);
        html = html.replace(/(<meta[\s\S]*?property=["']og:description["'][\s\S]*?content=["'])[^"']*(["'])/, `$1${meta.description}$2`);
        html = html.replace(/(<meta[\s\S]*?property=["']og:url["'][\s\S]*?content=["'])[^"']*(["'])/, `$1${canonicalUrl}$2`);
        html = html.replace(/(<meta\s+name=["']twitter:title["']\s+content=["'])[^"']*(["'])/, `$1${meta.title}$2`);
        html = html.replace(/(<meta\s+name=["']twitter:description["']\s+content=["'])[^"']*(["'])/, `$1${meta.description}$2`);
    }

    return new Response(html, {
        status: response.status,
        headers: {
            'content-type': 'text/html;charset=UTF-8',
            'cache-control': 'public, max-age=3600',
        },
    });
}
