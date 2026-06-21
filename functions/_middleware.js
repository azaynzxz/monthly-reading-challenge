import poemsData from '../src/data/poems.json';
import month1Data from '../src/data/month1.json';
import month2Data from '../src/data/month2.json';
import month3Data from '../src/data/month3.json';
import month4Data from '../src/data/month4.json';

const allMonthsData = {
    1: month1Data,
    2: month2Data,
    3: month3Data,
    4: month4Data
};

export async function onRequest(context) {
    const { request } = context;
    const url = new URL(request.url);
    const pathname = url.pathname;

    const poemMatch = pathname.match(/^\/poem\/(\d+)$/);
    const readingMatch = pathname.match(/^\/m(\d+)-day(\d+)$/);

    if (!poemMatch && !readingMatch) {
        return context.next();
    }

    // Fetch the original response (index.html)
    const response = await context.next();
    const contentType = response.headers.get("content-type") || "";

    // Only rewrite HTML pages
    if (!contentType.includes("text/html")) {
        return response;
    }

    let titleText = "";
    let descriptionText = "";
    let ogImage = "https://myenglish.my.id/og-image.jpg";

    if (poemMatch) {
        const poemId = parseInt(poemMatch[1]);
        const poem = poemsData.find(p => p.id === poemId);
        if (poem) {
            titleText = `${poem.title} by ${poem.author} | English Fluency Journey`;
            descriptionText = `Read and recite "${poem.title}" by ${poem.author}. Practice English reading with our poetry collection.`;
        }
    } else if (readingMatch) {
        const month = parseInt(readingMatch[1]);
        const day = parseInt(readingMatch[2]);

        const monthData = allMonthsData[month];
        if (monthData) {
            const dayData = monthData.find(d => d.day === day);
            if (dayData) {
                titleText = `${dayData.title} (Day ${day}) | English Fluency Journey`;
                descriptionText = `Read "${dayData.title}" from ${dayData.country}. Practice English reading and build vocabulary.`;
                if (dayData.localImage) {
                    ogImage = `https://myenglish.my.id${dayData.localImage}`;
                }
            }
        }
    }

    if (!titleText) {
        return response;
    }

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
