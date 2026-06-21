import poemsData from '../../src/data/poems.json';

export async function onRequest(context) {
    const { request } = context;
    const url = new URL(request.url);
    const pathname = url.pathname;

    const poemMatch = pathname.match(/\/poem\/(\d+)/);
    if (!poemMatch) {
        return context.next();
    }

    // Fetch the original response (index.html)
    const response = await context.next();
    const contentType = response.headers.get("content-type") || "";

    // Only rewrite HTML pages
    if (!contentType.includes("text/html")) {
        return response;
    }

    const poemId = parseInt(poemMatch[1]);
    const poem = poemsData.find(p => p.id === poemId);
    
    if (!poem) {
        return response;
    }

    const titleText = `${poem.title} by ${poem.author} | English Fluency Journey`;
    const descriptionText = `Read and recite "${poem.title}" by ${poem.author}. Practice English reading with our poetry collection.`;
    const ogImage = "https://myenglish.my.id/og-image.jpg";

    // Use HTMLRewriter to rewrite title and meta tags
    return new HTMLRewriter()
        .on("title", {
            element(element) {
                element.setText(titleText);
            }
        })
        .on("meta[name='title']", {
            element(element) {
                element.setAttribute("content", titleText);
            }
        })
        .on("meta[name='description']", {
            element(element) {
                element.setAttribute("content", descriptionText);
            }
        })
        .on("meta[property='og:title']", {
            element(element) {
                element.setAttribute("content", titleText);
            }
        })
        .on("meta[property='og:description']", {
            element(element) {
                element.setAttribute("content", descriptionText);
            }
        })
        .on("meta[property='og:image']", {
            element(element) {
                element.setAttribute("content", ogImage);
            }
        })
        .on("meta[property='og:url']", {
            element(element) {
                element.setAttribute("content", url.href);
            }
        })
        .on("meta[name='twitter:title']", {
            element(element) {
                element.setAttribute("content", titleText);
            }
        })
        .on("meta[name='twitter:description']", {
            element(element) {
                element.setAttribute("content", descriptionText);
            }
        })
        .on("meta[name='twitter:image']", {
            element(element) {
                element.setAttribute("content", ogImage);
            }
        })
        .transform(response);
}
