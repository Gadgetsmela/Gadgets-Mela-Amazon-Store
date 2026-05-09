import { products as staticProducts } from '../data/products.js';
import { DEFAULT_COUNTRY, getCountryConfig } from '../data/countries.js';
import { buildAmazonProductUrl, getAffiliateUrl, withAffiliateTag } from '../utils/affiliate.js';
import { getProductPrices } from '../utils/format.js';
import { normalizeProductImages } from '../utils/productImages.js';
import { runAiDealEngine } from './aiDealEngine.js';
import { getMarketingAnalytics } from './dealMarketing.js';

const STORAGE_KEY = 'gadgets-mela-products-v4';
const REFRESH_KEY = 'gadgets-mela-last-refresh';
const ONE_DAY = 24 * 60 * 60 * 1000;
const PAAPI_ENDPOINT = import.meta.env.VITE_AMAZON_PAAPI_ENDPOINT || '/api/amazon';
const ENABLE_PAAPI = import.meta.env.VITE_ENABLE_AMAZON_PAAPI === 'true';
const ASIN_GLOBAL_REGEX = /(?:dp\/|gp\/product\/)?([A-Z0-9]{10})/g;
const AMAZON_HOST_REGEX = /(^|\.)amazon\.[a-z.]+$/i;

function safeLocalStorage() {
  return typeof window === 'undefined' ? null : window.localStorage;
}

function toNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function slugify(value) {
  return String(value || 'product').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'product';
}

export function calculateDiscount(product) {
  if (Number.isFinite(Number(product.discountPercent)) && Number(product.discountPercent) > 0) return Number(product.discountPercent);
  const { price, originalPrice } = getProductPrices(product, DEFAULT_COUNTRY);
  if (!originalPrice || originalPrice <= price) return 0;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
}

export function deriveBestDeal(product) {
  return calculateDiscount(product) >= 30 && Number(product.rating || 0) >= 4.4;
}

export function enrichProduct(product) {
  const now = new Date().toISOString();
  const asin = product.asin ? String(product.asin).toUpperCase() : '';
  const id = product.id || (asin ? `asin-${asin}` : `manual-${slugify(product.name)}-${Date.now()}`);
  const discount = calculateDiscount(product);
  const bestDeal = product.bestDeal || deriveBestDeal(product);
  const fallbackName = asin ? `Amazon product ${asin}` : 'Affiliate product';

  const images = normalizeProductImages({ ...product, id, asin, name: product.name || product.title || fallbackName });

  return {
    ...product,
    id,
    asin,
    name: product.name || product.title || fallbackName,
    category: product.category || 'Gadgets',
    summary: product.summary || 'Curated affiliate product card with manually managed price, MRP, badge, and marketplace redirect.',
    tags: Array.isArray(product.tags) ? product.tags : ['amazon', asin.toLowerCase()].filter(Boolean),
    image: images.image,
    galleryImages: images.galleryImages,
    thumbnail: images.thumbnail,
    placeholder: images.placeholder,
    imageRatio: images.imageRatio,
    affiliateUrl: product.affiliateUrl || (asin ? buildAmazonProductUrl(asin) : ''),
    discountPercent: discount,
    badge: product.autoBadge || product.badge || (bestDeal ? 'HOT DEAL' : (discount ? `${discount}% off` : 'CREATOR PICK')),
    autoBadge: product.autoBadge || '',
    dealScore: toNumber(product.dealScore, product.trendingScore || 0),
    adminBoost: Boolean(product.adminBoost),
    bestDeal,
    featured: Boolean(product.featured || bestDeal || discount >= 25),
    availability: product.availability || 'Check Amazon for current availability',
    importStatus: product.importStatus || 'local',
    updatedAt: product.updatedAt || now,
    trendingScore: toNumber(product.trendingScore, Math.round((Number(product.rating || 4.1) * 20) + discount + Math.min(Number(product.reviewCount || 0) / 500, 20) + (product.featured ? 12 : 0))),
  };
}

export function loadProducts() {
  const storage = safeLocalStorage();
  const seedProducts = staticProducts.map(enrichProduct);
  if (!storage) return seedProducts;

  const stored = storage.getItem(STORAGE_KEY);
  if (!stored) return saveProducts(seedProducts);

  try {
    const parsed = JSON.parse(stored).map(enrichProduct);
    return parsed.length ? parsed : saveProducts(seedProducts);
  } catch {
    storage.removeItem(STORAGE_KEY);
    return saveProducts(seedProducts);
  }
}

export function saveProducts(products) {
  const enriched = products.map(enrichProduct);
  safeLocalStorage()?.setItem(STORAGE_KEY, JSON.stringify(enriched));
  return enriched;
}

export function extractAsin(input) {
  return extractAsinsFromLines(input)[0] || '';
}

export function extractWishlistId(input) {
  const value = String(input || '').trim();
  const wishlistMatch = value.match(/(?:wishlist\/ls|\/hz\/wishlist\/ls)\/([A-Z0-9]{10,})|[?&](?:list|wishlistId)=([A-Z0-9]{10,})|\b([A-Z0-9]{10,})\b/i);
  return wishlistMatch ? (wishlistMatch[1] || wishlistMatch[2] || wishlistMatch[3]).toUpperCase() : '';
}

export function extractAsinsFromLines(input) {
  const normalizedInput = String(input || '').toUpperCase();
  const matches = normalizedInput.matchAll(ASIN_GLOBAL_REGEX);
  return [...new Set([...matches].map((match) => match[1]).filter(Boolean))];
}

export function isShortAmazonUrl(input) {
  const value = String(input || '').trim();
  if (!value) return false;

  try {
    const parsed = new globalThis.URL(value);
    return parsed.hostname.replace(/^www\./i, '').toLowerCase() === 'amzn.to';
  } catch {
    return false;
  }
}

export function isAmazonUrl(input) {
  const value = String(input || '').trim();
  if (!value) return false;

  try {
    const parsed = new globalThis.URL(value);
    const hostname = parsed.hostname.replace(/^www\./i, '');
    return isShortAmazonUrl(value) || AMAZON_HOST_REGEX.test(hostname);
  } catch {
    return false;
  }
}

export function canCreateFallbackDeal(input) {
  return extractAsinsFromLines(input).length > 0 || isAmazonUrl(input);
}

export function parseAmazonProductUrl(url, countryCode = DEFAULT_COUNTRY) {
  const asin = extractAsin(url);
  if (!asin) throw new Error('No ASIN found. Please paste Amazon product URL or ASIN');
  return createFallbackProduct(asin, { sourceUrl: url, countryCode, importStatus: 'url parsed' });
}

function createFallbackProduct(asin, overrides = {}) {
  const country = getCountryConfig(overrides.countryCode || DEFAULT_COUNTRY);
  const cleanAsin = String(asin || '').toUpperCase();
  return enrichProduct({
    id: `asin-${cleanAsin}`,
    asin: cleanAsin,
    name: overrides.name || `Amazon product ${cleanAsin}`,
    category: overrides.category || 'Gadgets',
    summary: overrides.summary || 'Manual Amazon affiliate card. Add the exact product title, image, badge, MRP, and live price in the editor when PA API is unavailable.',
    badge: overrides.badge || 'Manual ASIN',
    affiliateUrl: withAffiliateTag(buildAmazonProductUrl(cleanAsin, country.code), country.code),
    availability: 'Affiliate link ready; verify live stock on Amazon',
    tags: ['manual', 'asin', cleanAsin.toLowerCase()],
    priceINR: 0,
    originalPriceINR: 0,
    priceUSD: 0,
    originalPriceUSD: 0,
    priceGBP: 0,
    originalPriceGBP: 0,
    priceCAD: 0,
    originalPriceCAD: 0,
    importStatus: overrides.importStatus || 'manual',
    updatedAt: new Date().toISOString(),
    ...overrides,
  });
}


function createManualAffiliateDeal(url, countryCode = DEFAULT_COUNTRY, overrides = {}) {
  const country = getCountryConfig(countryCode);
  const cleanUrl = String(url || '').trim();
  const shortLink = isShortAmazonUrl(cleanUrl);

  return enrichProduct({
    id: `manual-url-${slugify(cleanUrl)}-${Date.now()}`,
    name: overrides.name || (shortLink ? 'Manual Amazon short link deal' : 'Manual Amazon affiliate deal'),
    category: overrides.category || 'Gadgets',
    summary: overrides.summary || (shortLink
      ? 'Short link detected. Product can be saved manually. Add title, price, image, and exact details in the editor.'
      : 'Manual Amazon affiliate card. Add title, price, image, and exact details in the editor.'),
    badge: overrides.badge || (shortLink ? 'Short link' : 'Manual URL'),
    affiliateUrl: shortLink ? cleanUrl : withAffiliateTag(cleanUrl, country.code),
    availability: 'Affiliate link ready; verify live stock on Amazon',
    tags: ['manual', 'amazon', shortLink ? 'short-link' : 'url'],
    sourceUrl: cleanUrl,
    importStatus: shortLink ? 'short-url' : 'manual-url',
    ...overrides,
  });
}

async function callPaapi(payload) {
  if (!ENABLE_PAAPI) throw new Error('PA API disabled; using local fallback database.');

  const controller = new globalThis.AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 4500);
  try {
    const response = await fetch(PAAPI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) throw new Error(data.error || `Amazon PA API proxy returned ${response.status}`);
    return {
      products: Array.isArray(data.products) ? data.products.map(enrichProduct) : [],
      storedProducts: Array.isArray(data.storedProducts) ? data.storedProducts.map(enrichProduct) : [],
      status: data.status,
    };
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function getAmazonApiStatus(countryCode = DEFAULT_COUNTRY) {
  if (!ENABLE_PAAPI) {
    return {
      badge: 'LOCAL FALLBACK',
      connected: false,
      marketplace: getCountryConfig(countryCode).amazonHost,
      missing: ['PA API approval not required'],
    };
  }

  return callPaapi({ action: 'status', countryCode }).then((result) => result.status).catch(() => ({
    badge: 'LOCAL FALLBACK',
    connected: false,
    marketplace: getCountryConfig(countryCode).amazonHost,
    missing: ['API route unavailable'],
  }));
}

export async function fetchStoredProducts() {
  return loadProducts();
}

export async function persistStoredProducts(products) {
  return saveProducts(products);
}

export async function searchAmazonProducts(keywords) {
  const normalized = String(keywords || '').trim().toLowerCase();
  if (!normalized) return [];
  const localMatches = loadProducts().filter((product) => [product.name, product.summary, product.category, product.brand, ...(product.tags || [])].join(' ').toLowerCase().includes(normalized));
  if (localMatches.length || !ENABLE_PAAPI) return localMatches;
  const { products } = await callPaapi({ action: 'search', keywords });
  return products;
}

export async function importAsins(input, countryCode = DEFAULT_COUNTRY) {
  const asins = Array.isArray(input) ? input.map(extractAsin).filter(Boolean) : extractAsinsFromLines(input);
  if (!asins.length) return [];

  if (ENABLE_PAAPI) {
    try {
      const { products } = await callPaapi({ action: 'asins', asins, countryCode });
      if (products.length) return products;
    } catch {
      // Fall through to production-safe manual cards.
    }
  }

  return asins.map((asin) => createFallbackProduct(asin, { countryCode }));
}

export async function importAmazonUrl(url, countryCode = DEFAULT_COUNTRY) {
  const asin = extractAsin(url);
  if (!asin) {
    if (isShortAmazonUrl(url)) return [createManualAffiliateDeal(url, countryCode)];
    if (isAmazonUrl(url)) return [createManualAffiliateDeal(url, countryCode)];
    throw new Error('No ASIN found. Please paste Amazon product URL or ASIN');
  }

  return [parseAmazonProductUrl(url, countryCode)];
}

export async function importWishlist(url, countryCode = DEFAULT_COUNTRY) {
  const wishlistId = extractWishlistId(url);
  const embeddedAsins = extractAsinsFromLines(url);
  if (!wishlistId && !embeddedAsins.length) throw new Error('Enter a public Amazon wishlist URL, or paste wishlist HTML/text that contains product URLs or ASINs.');

  if (ENABLE_PAAPI && wishlistId) {
    try {
      const { products } = await callPaapi({ action: 'wishlist', url, wishlistId, countryCode });
      if (products.length) return products;
    } catch {
      // Fall through to wishlist text parser.
    }
  }

  if (embeddedAsins.length) return importAsins(embeddedAsins, countryCode);
  return [createFallbackProduct(wishlistId.slice(0, 10), { name: `Wishlist import ${wishlistId}`, badge: 'Wishlist seed', countryCode, importStatus: 'wishlist parsed' })];
}

export async function importWishlistFallback(input, countryCode = DEFAULT_COUNTRY) {
  const asins = extractAsinsFromLines(input);
  if (asins.length) return asins.map((asin) => createFallbackProduct(asin, { countryCode }));
  if (isShortAmazonUrl(input)) return [createManualAffiliateDeal(input, countryCode)];
  if (isAmazonUrl(input)) return [createManualAffiliateDeal(input, countryCode)];
  throw new Error('No ASIN found. Please paste Amazon product URL or ASIN');
}

export async function refreshProducts(products, countryCode = DEFAULT_COUNTRY, force = false) {
  const storage = safeLocalStorage();
  const lastRefresh = Number(storage?.getItem(REFRESH_KEY) || 0);
  if (!force && Date.now() - lastRefresh < ONE_DAY) return products.map(enrichProduct);

  if (ENABLE_PAAPI) {
    const asins = products.map((product) => product.asin).filter(Boolean);
    if (asins.length) {
      try {
        const refreshed = await importAsins(asins, countryCode);
        const byAsin = new Map(refreshed.map((product) => [product.asin, product]));
        const merged = products.map((product) => enrichProduct({ ...product, ...byAsin.get(product.asin) }));
        storage?.setItem(REFRESH_KEY, String(Date.now()));
        return saveProducts(merged);
      } catch {
        // Keep local values if PA API is unavailable.
      }
    }
  }

  storage?.setItem(REFRESH_KEY, String(Date.now()));
  const locallyRefreshed = products.map((product) => ({ ...product, updatedAt: new Date().toISOString(), importStatus: product.importStatus || 'local' }));
  return saveProducts(runAiDealEngine(locallyRefreshed, getMarketingAnalytics(), countryCode).products);
}

export function buildProductMeta(product, countryCode = DEFAULT_COUNTRY) {
  const affiliateUrl = getAffiliateUrl(product, countryCode);
  const origin = typeof window === 'undefined' ? 'https://gadgetsmela.example' : window.location.origin;
  const { price } = getProductPrices(product, countryCode);
  const country = getCountryConfig(countryCode);

  return {
    title: `${product.name} - affiliate deal | Gadgets Mela`,
    description: `${product.name}: ${product.summary} Curated Amazon affiliate card with local fallback prices, badges, images, and country-aware marketplace redirects.`,
    canonical: `${origin}/#product-${product.id}`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.summary,
      sku: product.asin || product.id,
      brand: product.brand ? { '@type': 'Brand', name: product.brand } : undefined,
      image: product.galleryImages?.length ? product.galleryImages : product.image,
      aggregateRating: product.rating ? { '@type': 'AggregateRating', ratingValue: product.rating, reviewCount: product.reviewCount || 0 } : undefined,
      offers: {
        '@type': 'Offer',
        url: affiliateUrl,
        price: price || undefined,
        priceCurrency: country.currency || 'INR',
        availability: product.availability?.includes('Out') ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
      },
    },
  };
}
