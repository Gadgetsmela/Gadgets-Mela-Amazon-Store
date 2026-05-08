import { DEFAULT_COUNTRY, getCountryConfig } from '../data/countries.js';
import { withAffiliateTag } from '../utils/affiliate.js';

const STORAGE_KEY = 'gadgets-mela-products-v3';
const REFRESH_KEY = 'gadgets-mela-last-refresh';
const ONE_DAY = 24 * 60 * 60 * 1000;
const PAAPI_ENDPOINT = import.meta.env.VITE_AMAZON_PAAPI_ENDPOINT || '/api/amazon';

function safeLocalStorage() {
  return typeof window === 'undefined' ? null : window.localStorage;
}

export function calculateDiscount(product) {
  if (Number.isFinite(Number(product.discountPercent)) && Number(product.discountPercent) > 0) return Number(product.discountPercent);
  if (!product.originalPriceINR || product.originalPriceINR <= product.priceINR) return 0;
  return Math.round(((product.originalPriceINR - product.priceINR) / product.originalPriceINR) * 100);
}

export function deriveBestDeal(product) {
  return calculateDiscount(product) >= 30 && Number(product.rating || 0) >= 4.4;
}

export function enrichProduct(product) {
  const discount = calculateDiscount(product);
  const bestDeal = product.bestDeal || deriveBestDeal(product);
  return {
    ...product,
    name: product.name || product.title || product.asin || 'Amazon product',
    summary: product.summary || 'Live Amazon Product Advertising API data.',
    tags: Array.isArray(product.tags) ? product.tags : ['amazon', product.asin?.toLowerCase()].filter(Boolean),
    galleryImages: Array.isArray(product.galleryImages) ? product.galleryImages : [product.image].filter(Boolean),
    discountPercent: discount,
    badge: bestDeal ? 'Best Deal' : product.badge || (discount ? `${discount}% off` : 'Live Amazon'),
    bestDeal,
    availability: product.availability || 'Check Amazon for current availability',
    importStatus: product.importStatus || 'imported',
    updatedAt: product.updatedAt || new Date().toISOString(),
    trendingScore: product.trendingScore || Math.round((Number(product.rating || 0) * 20) + discount + Math.min(Number(product.reviewCount || 0) / 500, 20)),
  };
}

export function loadProducts() {
  const storage = safeLocalStorage();
  if (!storage) return [];

  const stored = storage.getItem(STORAGE_KEY);
  if (!stored) return [];

  try {
    return JSON.parse(stored).map(enrichProduct);
  } catch {
    storage.removeItem(STORAGE_KEY);
    return [];
  }
}

export function saveProducts(products) {
  const enriched = products.map(enrichProduct);
  safeLocalStorage()?.setItem(STORAGE_KEY, JSON.stringify(enriched));
  return enriched;
}

export function extractAsin(input) {
  const value = String(input || '').trim();
  const asinMatch = value.match(/(?:dp|gp\/product|product|ASIN)\/([A-Z0-9]{10})|[?&]asin=([A-Z0-9]{10})|\b([A-Z0-9]{10})\b/i);
  return asinMatch ? (asinMatch[1] || asinMatch[2] || asinMatch[3]).toUpperCase() : '';
}

export function extractWishlistId(input) {
  const value = String(input || '').trim();
  const wishlistMatch = value.match(/(?:wishlist\/ls|\/hz\/wishlist\/ls)\/([A-Z0-9]{10,})|[?&](?:list|wishlistId)=([A-Z0-9]{10,})|\b([A-Z0-9]{10,})\b/i);
  return wishlistMatch ? (wishlistMatch[1] || wishlistMatch[2] || wishlistMatch[3]).toUpperCase() : '';
}

export function extractAsinsFromLines(input) {
  return [...new Set(String(input || '')
    .split(/[\n,]+/)
    .map(extractAsin)
    .filter(Boolean))];
}

async function callPaapi(payload) {
  const response = await fetch(PAAPI_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) throw new Error(data.error || `Amazon PA API proxy returned ${response.status}`);
  return {
    products: Array.isArray(data.products) ? data.products.map(enrichProduct) : [],
    storedProducts: Array.isArray(data.storedProducts) ? data.storedProducts.map(enrichProduct) : [],
    status: data.status,
  };
}

export async function getAmazonApiStatus(countryCode = DEFAULT_COUNTRY) {
  return callPaapi({ action: 'status', countryCode }).then((result) => result.status);
}

export async function fetchStoredProducts(countryCode = DEFAULT_COUNTRY) {
  const { products } = await callPaapi({ action: 'list', countryCode });
  return saveProducts(products);
}

export async function persistStoredProducts(products, countryCode = DEFAULT_COUNTRY) {
  const result = await callPaapi({ action: 'store', products, countryCode });
  const saved = result.products.length ? result.products : result.storedProducts;
  return saveProducts(saved.length ? saved : products);
}

export async function searchAmazonProducts(keywords, countryCode = DEFAULT_COUNTRY) {
  if (!keywords.trim()) return [];
  const { products } = await callPaapi({ action: 'search', keywords, countryCode });
  return products;
}

export async function importAsins(input, countryCode = DEFAULT_COUNTRY) {
  const asins = Array.isArray(input) ? input.map(extractAsin).filter(Boolean) : extractAsinsFromLines(input);
  if (!asins.length) return [];
  const { products } = await callPaapi({ action: 'asins', asins, countryCode });
  return products;
}

export async function importAmazonUrl(url, countryCode = DEFAULT_COUNTRY) {
  const asin = extractAsin(url);
  if (!asin) throw new Error('Enter a valid Amazon product URL or ASIN.');
  const { products } = await callPaapi({ action: 'url', url, countryCode });
  return products;
}

export async function importWishlist(url, countryCode = DEFAULT_COUNTRY) {
  const wishlistId = extractWishlistId(url);
  if (!wishlistId) throw new Error('Enter a valid public Amazon wishlist URL. Example: https://www.amazon.in/hz/wishlist/ls/J23J5F6XHRWC');
  const { products } = await callPaapi({ action: 'wishlist', url, wishlistId, countryCode });
  return products;
}

export async function importWishlistFallback(input, countryCode = DEFAULT_COUNTRY) {
  const asins = extractAsinsFromLines(input);
  if (!asins.length) throw new Error('Paste Amazon product URLs or ASINs line-by-line for fallback import.');
  return importAsins(asins, countryCode);
}

export async function refreshProducts(products, countryCode = DEFAULT_COUNTRY, force = false) {
  const storage = safeLocalStorage();
  const lastRefresh = Number(storage?.getItem(REFRESH_KEY) || 0);
  if (!force && Date.now() - lastRefresh < ONE_DAY) return products.map(enrichProduct);

  const asins = products.map((product) => product.asin).filter(Boolean);
  if (!asins.length) return products.map(enrichProduct);

  const refreshed = await importAsins(asins, countryCode);
  const byAsin = new Map(refreshed.map((product) => [product.asin, product]));
  const merged = products.map((product) => enrichProduct({ ...product, ...byAsin.get(product.asin) }));
  storage?.setItem(REFRESH_KEY, String(Date.now()));
  return saveProducts(merged);
}

export function buildProductMeta(product, countryCode = DEFAULT_COUNTRY) {
  const affiliateUrl = withAffiliateTag(product.affiliateUrl, countryCode);
  const origin = typeof window === 'undefined' ? 'https://gadgetsmela.example' : window.location.origin;
  return {
    title: `${product.name} - live Amazon deal | Gadgets Mela`,
    description: `${product.name}: ${product.summary} Price, rating, discount and affiliate link updated automatically.`,
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
      offers: { '@type': 'Offer', url: affiliateUrl, priceCurrency: getCountryConfig(countryCode).currency || 'INR', availability: product.availability || 'https://schema.org/InStock' },
    },
  };
}
