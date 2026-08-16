// fetchSocialIcon.js
// Returns a Simple Icons CDN URL for a given brand slug.
// No network request — just URL composition.
// Full icon list: https://simpleicons.org

/**
 * Get the CDN URL for a Simple Icons brand logo.
 * @param {string} slug  - Brand slug from simpleicons.org (e.g. 'instagram', 'tiktok')
 * @param {string} color - Hex color WITHOUT the # prefix (default: 'ffffff')
 * @returns {string} CDN image URL
 */
export function getSocialIconUrl(slug, color = 'ffffff') {
  return `https://cdn.simpleicons.org/${slug}/${color}`;
}
