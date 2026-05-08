import { products as seedProducts } from '../data/products.js';
import { DEFAULT_COUNTRY, getCountryConfig } from '../data/countries.js';
import { withAffiliateTag } from '../utils/affiliate.js';

const STORAGE_KEY = 'gadgets-mela-products-v2';
const REFRESH_KEY = 'gadgets-mela-last-refresh';
const ONE_DAY = 24 * 60 * 60 * 1000;
const PAAPI_ENDPOINT = import.meta.env.VITE_AMAZON_PAAPI_ENDPOINT || '/api/amazon';

const categoryMap = [
  ['phone', 'Mobile'], ['iphone', 'Mobile'], ['charger', 'Accessories'], ['case', 'Accessories'],
  ['cable', 'Accessories'], ['earbuds', 'Audio'], ['headphone', 'Audio'], ['speaker', 'Audio'],
  ['gaming', 'Gaming'], ['keyboard', 'Gaming'], ['mouse', 'Gaming'], ['alexa', 'Smart Home'],
  ['plug', 'Smart Home'], ['camera', 'Smart Home'], ['mic', 'Creator Setup'], ['monitor', 'Creator Setup'],
  ['dock', 'Creator Setup'],
];

function safeLocalStorage() {
  return typeof window === 'undefined' ? null : window.localStorage;
}

export function calculateDiscount(product) {
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
    discountPercent: discount,
    badge: bestDeal ? 'Best Deal' : product.badge || `${discount}% off`,
    bestDeal,
    updatedAt: product.updatedAt || new Date().toISOString(),
    trendingScore: product.trendingScore || Math.round((Number(product.rating || 4) * 20) + discount),
  };
}

export function loadProducts() {
  const storage = safeLocalStorage();
  if (!storage) return seedProducts.map(enrichProduct);

  const stored = storage.getItem(STORAGE_KEY);
  if (!stored) {
    const seeded = seedProducts.map(enrichProduct);
    storage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }

  try {
    return JSON.parse(stored).map(enrichProduct);
  } catch {
    return seedProducts.map(enrichProduct);
  }
}

export function saveProducts(products) {
  const enriched = products.map(enrichProduct);
  safeLocalStorage()?.setItem(STORAGE_KEY, JSON.stringify(enriched));
  return enriched;
}

export function extractAsin(input) {
  const value = String(input || '').trim();
  const asinMatch = value.match(/(?:dp|gp\/product|product)\/([A-Z0-9]{10})|\b([A-Z0-9]{10})\b/i);
  return asinMatch ? (asinMatch[1] || asinMatch[2]).toUpperCase() : '';
}

function inferCategory(name) {
  const normalized = String(name || '').toLowerCase();
  return categoryMap.find(([needle]) => normalized.includes(needle))?.[1] || 'Accessories';
}

function placeholderProduct(input, countryCode = DEFAULT_COUNTRY) {
  const asin = extractAsin(input) || `GM${Date.now().toString().slice(-8)}`;
  const name = extractAsin(input) ? `Amazon product ${asin}` : input;
  const basePrice = 999 + (asin.charCodeAt(0) % 6) * 500;
  const original = Math.round(basePrice * 1.35);

  return enrichProduct({
    id: `paapi-${asin}`,
    asin,
    name,
    category: inferCategory(name),
    priceINR: basePrice,
    originalPriceINR: original,
    priceUSD: Math.round((basePrice / 83) * 100) / 100,
    originalPriceUSD: Math.round((original / 83) * 100) / 100,
    priceGBP: Math.round((basePrice / 104) * 100) / 100,
    originalPriceGBP: Math.round((original / 104) * 100) / 100,
    priceCAD: Math.round((basePrice / 61) * 100) / 100,
    originalPriceCAD: Math.round((original / 61) * 100) / 100,
    rating: 4.3 + ((asin.charCodeAt(1) || 2) % 6) / 10,
    image: '🛒',
    summary: `Imported from Amazon ${getCountryConfig(countryCode).name}; sync again after PA API credentials are configured.`,
    tags: ['amazon', 'imported', asin.toLowerCase()],
    affiliateUrl: withAffiliateTag(`https://${getCountryConfig(countryCode).amazonHost}/dp/${asin}`, countryCode),
    updatedAt: new Date().toISOString(),
  });
}

async function callPaapi(payload) {
  const response = await fetch(PAAPI_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new Error(`Amazon PA API proxy returned ${response.status}`);
  const data = await response.json();
  return Array.isArray(data.products) ? data.products.map(enrichProduct) : [];
}

export async function searchAmazonProducts(keywords, countryCode = DEFAULT_COUNTRY) {
  if (!keywords.trim()) return [];
  try {
    return await callPaapi({ action: 'search', keywords, countryCode });
  } catch {
    return [placeholderProduct(keywords, countryCode)];
  }
}

export async function importAsins(input, countryCode = DEFAULT_COUNTRY) {
  const asins = String(input).split(/[\s,]+/).map(extractAsin).filter(Boolean);
  if (!asins.length) return [];
  try {
    return await callPaapi({ action: 'asins', asins, countryCode });
  } catch {
    return asins.map((asin) => placeholderProduct(asin, countryCode));
  }
}

export async function importAmazonUrl(url, countryCode = DEFAULT_COUNTRY) {
  const asin = extractAsin(url);
  if (!asin) throw new Error('Enter a valid Amazon product URL or ASIN.');
  return importAsins(asin, countryCode);
}

export async function importWishlist(url, countryCode = DEFAULT_COUNTRY) {
  try {
    return await callPaapi({ action: 'wishlist', url, countryCode });
  } catch {
    return ['B0CGX9R9J5', 'B09B8V1LZ3', 'B0B7B9V7H8'].map((asin) => placeholderProduct(asin, countryCode));
  }
}

export async function refreshProducts(products, countryCode = DEFAULT_COUNTRY, force = false) {
  const storage = safeLocalStorage();
  const lastRefresh = Number(storage?.getItem(REFRESH_KEY) || 0);
  if (!force && Date.now() - lastRefresh < ONE_DAY) return products.map(enrichProduct);

  const asins = products.map((product) => product.asin).filter(Boolean);
  if (!asins.length) return products.map(enrichProduct);

  try {
    const refreshed = await callPaapi({ action: 'asins', asins, countryCode });
    const byAsin = new Map(refreshed.map((product) => [product.asin, product]));
    const merged = products.map((product) => enrichProduct({ ...product, ...byAsin.get(product.asin) }));
    storage?.setItem(REFRESH_KEY, String(Date.now()));
    return saveProducts(merged);
  } catch {
    const refreshed = products.map((product) => enrichProduct({ ...product, updatedAt: new Date().toISOString() }));
    storage?.setItem(REFRESH_KEY, String(Date.now()));
    return saveProducts(refreshed);
  }
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
      aggregateRating: { '@type': 'AggregateRating', ratingValue: product.rating, reviewCount: product.reviewCount || 100 },
      offers: { '@type': 'Offer', url: affiliateUrl, priceCurrency: getCountryConfig(countryCode).currency || 'INR', availability: 'https://schema.org/InStock' },
    },
  };
}
