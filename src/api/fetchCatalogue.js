// fetchCatalogue.js
// Fetches product catalogue from Google Apps Script Web App.
// The URL is a read-only public endpoint — it only returns product data (titles, prices, links).
// No credentials or private data are exposed.

const APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbwj-ohbnrgN008fusZjdek8aK3qZ74k3xIpbs9I_HiNoqRmvf-iiPkrLFQS1jb8sw3k/exec';

/**
 * Format a price value from the sheet into Indonesian Rupiah display string.
 * Handles both plain numbers (150000) and already-formatted strings ("Rp 150.000").
 * Returns the original string if it's already formatted or is a special value.
 *
 * @param {string} value
 * @returns {string}
 */
function formatRupiah(value) {
  if (!value || value === '' || value === 'Free' || value === 'free') {
    return value || '';
  }
  // Already contains 'Rp' — return as-is
  if (String(value).includes('Rp')) return String(value);
  // Try to parse as a number
  const num = Number(String(value).replace(/[^0-9]/g, ''));
  if (num === 0) return 'Free';          // 0 means free — no price to display
  if (!isNaN(num) && num > 0) {
    // Format as "Rp 150.000"
    return 'Rp ' + num.toLocaleString('id-ID');
  }
  return String(value);
}

/**
 * Fetch all catalogue items from the Apps Script endpoint.
 * Optionally filter by type: 'shop' | 'freebie' | undefined (returns all)
 *
 * IMPORTANT: Do NOT set Content-Type header on a GET request — it triggers
 * a CORS preflight that Google Apps Script does not support.
 *
 * @param {'shop'|'freebie'|undefined} type
 * @returns {Promise<Array>}
 */
export async function fetchCatalogue(type) {
  console.log('[Catalogue] Fetching from Apps Script...');

  try {
    // Simple GET — no Content-Type header, follow redirects (Apps Script uses a redirect)
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'GET',
      redirect: 'follow',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} — ${response.statusText}`);
    }

    const raw = await response.json();

    if (!Array.isArray(raw)) {
      throw new Error('Unexpected response format — expected JSON array');
    }

    console.log(`[Catalogue] OK — ${raw.length} total items fetched`);

    const shopCount = raw.filter((item) => item.type === 'shop').length;
    const freebieCount = raw.filter((item) => item.type === 'freebie').length;
    console.log(`[Catalogue] Shop: ${shopCount} | Freebies: ${freebieCount}`);

    // Normalize each row — format numeric prices to Rupiah display strings
    const normalized = raw.map((item) => ({
      product_id: item.product_id ?? '',
      type: item.type ?? 'shop',
      title: item.title ?? 'Untitled Product',
      link: item.link ?? '',
      image: item.image ?? '',
      price: formatRupiah(item.price),
      sale_price: formatRupiah(item.sale_price),
      isComingSoon:
        !item.link ||
        item.link === '' ||
        item.link === '#coming-soon',
    }));

    // Filter by type if requested
    if (type) {
      const filtered = normalized.filter((item) => item.type === type);
      console.log(`[Catalogue] Filtered to "${type}": ${filtered.length} items`);
      return filtered;
    }

    return normalized;
  } catch (err) {
    console.error(`[Catalogue] ERROR — ${err.message}`);
    console.error('[Catalogue] Full error:', err);
    return [];
  }
}

