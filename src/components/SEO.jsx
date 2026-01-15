import { useEffect } from 'react';

/**
 * SEO Component - Dynamically updates meta tags for each page
 * Helps Google index individual reading challenge pages with unique content
 */
const SEO = ({
    title,
    description,
    keywords,
    ogImage,
    url,
    type = 'article',
    author = 'English Fluency Journey'
}) => {
    useEffect(() => {
        // Update document title
        if (title) {
            document.title = title;
        }

        // Update or create meta tags
        const updateMetaTag = (name, content, isProperty = false) => {
            if (!content) return;

            const attribute = isProperty ? 'property' : 'name';
            let element = document.querySelector(`meta[${attribute}="${name}"]`);

            if (!element) {
                element = document.createElement('meta');
                element.setAttribute(attribute, name);
                document.head.appendChild(element);
            }

            element.setAttribute('content', content);
        };

        // Basic meta tags
        updateMetaTag('description', description);
        updateMetaTag('keywords', keywords);
        updateMetaTag('author', author);

        // Open Graph tags
        updateMetaTag('og:title', title, true);
        updateMetaTag('og:description', description, true);
        updateMetaTag('og:type', type, true);
        updateMetaTag('og:url', url, true);
        updateMetaTag('og:image', ogImage, true);

        // Twitter Card tags
        updateMetaTag('twitter:title', title);
        updateMetaTag('twitter:description', description);
        updateMetaTag('twitter:image', ogImage);

        // Update canonical URL
        let canonical = document.querySelector('link[rel="canonical"]');
        if (url) {
            if (!canonical) {
                canonical = document.createElement('link');
                canonical.setAttribute('rel', 'canonical');
                document.head.appendChild(canonical);
            }
            canonical.setAttribute('href', url);
        }

    }, [title, description, keywords, ogImage, url, type, author]);

    return null; // This component doesn't render anything
};

export default SEO;
