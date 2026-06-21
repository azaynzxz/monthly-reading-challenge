// Poem metadata embedded directly to avoid cross-directory import issues in Cloudflare Pages
const poems = [
    { id: 1, title: "Sleepy Eyes, Brave Heart", author: "Lis Syamsiah" },
    { id: 2, title: "Solitude", author: "Lis Syamsiah" },
    { id: 3, title: "Let Me Go", author: "Lis Syamsiah" },
    { id: 4, title: "Between Hate and Love", author: "Lis Syamsiah" },
    { id: 5, title: "I Miss the Child I Used to Be", author: "Lis Syamsiah" },
    { id: 6, title: "The Beauty of Sacrifice", author: "Lis Syamsiah" },
    { id: 7, title: "Myself", author: "Lis Syamsiah" },
    { id: 8, title: "Tired of the Same Sky", author: "Lis Syamsiah" },
    { id: 9, title: "Never Give Up", author: "Lis Syamsiah" },
    { id: 10, title: "Dear Mother", author: "Lis Syamsiah" },
    { id: 11, title: "Don't Lie to Your Heart", author: "Lis Syamsiah" },
];

export async function onRequest(context) {
    const { request } = context;
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Only handle /poem/:id paths
    const poemMatch = pathname.match(/^\/poem\/(\d+)\/?$/);
    if (!poemMatch) {
        return context.next();
    }

    const poemId = parseInt(poemMatch[1]);
    const poem = poems.find(p => p.id === poemId);

    // Fetch the original SPA response (index.html)
    const response = await context.next();
    const contentType = response.headers.get("content-type") || "";

    // Only rewrite HTML pages
    if (!contentType.includes("text/html")) {
        return response;
    }

    // If poem not found, return the original response unchanged
    if (!poem) {
        return response;
    }

    const titleText = `${poem.title} by ${poem.author} | English Fluency Journey`;
    const descriptionText = `Read and practice "${poem.title}" by ${poem.author}. Build English fluency with our poetry collection.`;
    const ogImage = "https://myenglish.my.id/og-image.jpg";
    const canonicalUrl = `https://myenglish.my.id/poem/${poem.id}`;

    // Read the full HTML body as text, then do string replacement
    // This avoids streaming issues with HTMLRewriter
    const originalHtml = await response.text();

    let rewrittenHtml = originalHtml;

    // Replace <title>
    rewrittenHtml = rewrittenHtml.replace(
        /<title>[^<]*<\/title>/,
        `<title>${titleText}</title>`
    );

    // Replace meta name="title"
    rewrittenHtml = rewrittenHtml.replace(
        /(<meta\s+name=["']title["']\s+content=["'])[^"']*(['"])/,
        `$1${titleText}$2`
    );

    // Replace meta name="description"
    rewrittenHtml = rewrittenHtml.replace(
        /(<meta\s+name=["']description["']\s+content=["'])[^"']*(['"])/,
        `$1${descriptionText}$2`
    );

    // Replace og:title
    rewrittenHtml = rewrittenHtml.replace(
        /(<meta\s+property=["']og:title["']\s+content=["'])[^"']*(['"])/,
        `$1${titleText}$2`
    );

    // Replace og:description
    rewrittenHtml = rewrittenHtml.replace(
        /(<meta\s+property=["']og:description["']\s+content=["'])[^"']*(['"])/,
        `$1${descriptionText}$2`
    );

    // Replace og:url
    rewrittenHtml = rewrittenHtml.replace(
        /(<meta\s+property=["']og:url["']\s+content=["'])[^"']*(['"])/,
        `$1${canonicalUrl}$2`
    );

    // Replace og:image
    rewrittenHtml = rewrittenHtml.replace(
        /(<meta\s+property=["']og:image["']\s+content=["'])[^"']*(['"])/,
        `$1${ogImage}$2`
    );

    // Replace twitter:title
    rewrittenHtml = rewrittenHtml.replace(
        /(<meta\s+name=["']twitter:title["']\s+content=["'])[^"']*(['"])/,
        `$1${titleText}$2`
    );

    // Replace twitter:description
    rewrittenHtml = rewrittenHtml.replace(
        /(<meta\s+name=["']twitter:description["']\s+content=["'])[^"']*(['"])/,
        `$1${descriptionText}$2`
    );

    // Replace canonical link
    rewrittenHtml = rewrittenHtml.replace(
        /(<link\s+rel=["']canonical["']\s+href=["'])[^"']*(['"])/,
        `$1${canonicalUrl}$2`
    );

    // Return the fully rewritten HTML as a new Response
    return new Response(rewrittenHtml, {
        status: response.status,
        headers: {
            "content-type": "text/html;charset=UTF-8",
            "cache-control": "public, max-age=3600",
        },
    });
}
