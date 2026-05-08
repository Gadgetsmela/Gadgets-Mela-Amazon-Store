import crypto from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_MARKETPLACE = 'IN';
const SERVER_DB_PATH = process.env.GADGETS_MELA_DB_PATH || path.join(process.cwd(), '.data', 'products.json');
const PRODUCTS_LIMIT = 10;
const DEFAULT_ASSOCIATE_TAGS = {
  IN: 'technicalco0e-21',
  US: 'gadgetsmela0e-20',
};

const MARKETPLACES = {
  IN: { host: 'webservices.amazon.in', region: 'eu-west-1', marketplace: 'www.amazon.in', domain: 'www.amazon.in' },
  US: { host: 'webservices.amazon.com', region: 'us-east-1', marketplace: 'www.amazon.com', domain: 'www.amazon.com' },
  GB: { host: 'webservices.amazon.co.uk', region: 'eu-west-1', marketplace: 'www.amazon.co.uk', domain: 'www.amazon.co.uk' },
  CA: { host: 'webservices.amazon.ca', region: 'us-east-1', marketplace: 'www.amazon.ca', domain: 'www.amazon.ca' },
};

const RESOURCES = [
  'BrowseNodeInfo.BrowseNodes',
  'Images.Primary.Large',
  'Images.Variants.Large',
  'ItemInfo.Title',
  'ItemInfo.Features',
  'ItemInfo.ByLineInfo',
  'ItemInfo.Classifications',
  'Offers.Listings.Availability.Message',
  'Offers.Listings.Price',
  'Offers.Listings.SavingBasis',
  'Offers.Summaries.HighestPrice',
  'Offers.Summaries.LowestPrice',
  'CustomerReviews.Count',
  'CustomerReviews.StarRating',
];

const categoryMap = [
  ['phone', 'Mobile'], ['iphone', 'Mobile'], ['charger', 'Accessories'], ['case', 'Accessories'],
  ['cable', 'Accessories'], ['earbuds', 'Audio'], ['headphone', 'Audio'], ['speaker', 'Audio'],
  ['gaming', 'Gaming'], ['keyboard', 'Gaming'], ['mouse', 'Gaming'], ['alexa', 'Smart Home'],
  ['plug', 'Smart Home'], ['camera', 'Smart Home'], ['mic', 'Creator Setup'], ['monitor', 'Creator Setup'],
  ['dock', 'Creator Setup'], ['laptop', 'Creator Setup'], ['ssd', 'Creator Setup'], ['watch', 'Accessories'],
];

function hmac(key, value, encoding) {
  return crypto.createHmac('sha256', key).update(value, 'utf8').digest(encoding);
}

function sha256(value) {
  return crypto.createHash('sha256').update(value, 'utf8').digest('hex');
}

function getSignatureKey(secretKey, dateStamp, regionName, serviceName) {
  const kDate = hmac(`AWS4${secretKey}`, dateStamp);
  const kRegion = hmac(kDate, regionName);
  const kService = hmac(kRegion, serviceName);
  return hmac(kService, 'aws4_request');
}

function getConfiguredMarketplace(countryCode = DEFAULT_MARKETPLACE) {
  const requestedMarket = MARKETPLACES[countryCode] || MARKETPLACES[DEFAULT_MARKETPLACE];
  return {
    ...requestedMarket,
    host: process.env.AMAZON_HOST || requestedMarket.host,
    region: process.env.AMAZON_REGION || requestedMarket.region,
    marketplace: process.env.AMAZON_MARKETPLACE || requestedMarket.marketplace,
  };
}

function getPartnerTag(countryCode = DEFAULT_MARKETPLACE) {
  if (countryCode === 'US') return process.env.AMAZON_PARTNER_TAG_US || process.env.AMAZON_PARTNER_TAG || DEFAULT_ASSOCIATE_TAGS.US;
  return process.env.AMAZON_PARTNER_TAG;
}

function getCredentials(countryCode = DEFAULT_MARKETPLACE) {
  const market = getConfiguredMarketplace(countryCode);
  return {
    accessKey: process.env.AMAZON_ACCESS_KEY,
    secretKey: process.env.AMAZON_SECRET_KEY,
    partnerTag: getPartnerTag(countryCode),
    market,
  };
}

function getApiStatus(countryCode = DEFAULT_MARKETPLACE) {
  const { accessKey, secretKey, partnerTag, market } = getCredentials(countryCode);
  const missing = [
    ['AMAZON_ACCESS_KEY', accessKey],
    ['AMAZON_SECRET_KEY', secretKey],
    ['AMAZON_PARTNER_TAG', partnerTag],
    ['AMAZON_MARKETPLACE', market.marketplace],
    ['AMAZON_REGION', market.region],
    ['AMAZON_HOST', market.host],
  ].filter(([, value]) => !value).map(([name]) => name);

  return {
    connected: missing.length === 0,
    badge: missing.length === 0 ? 'CONNECTED' : 'ERROR',
    missing,
    marketplace: market.marketplace,
    host: market.host,
    region: market.region,
    defaultMarketplace: 'Amazon India',
    oneLinkUSPartnerTag: DEFAULT_ASSOCIATE_TAGS.US,
  };
}

function withTag(url, tag) {
  const parsedUrl = new globalThis.URL(url);
  parsedUrl.searchParams.set('tag', tag);
  return parsedUrl.toString();
}

function inferCategory(...values) {
  const normalized = values.filter(Boolean).join(' ').toLowerCase();
  return categoryMap.find(([needle]) => normalized.includes(needle))?.[1] || 'Accessories';
}

function extractAsin(input) {
  const value = String(input || '').trim();
  const asinMatch = value.match(/(?:dp|gp\/product|product|ASIN)\/([A-Z0-9]{10})|[?&]asin=([A-Z0-9]{10})|\b([A-Z0-9]{10})\b/i);
  return asinMatch ? (asinMatch[1] || asinMatch[2] || asinMatch[3]).toUpperCase() : '';
}

function normalizeAsins(input) {
  return [...new Set([].concat(input || [])
    .flatMap((value) => String(value).split(/[\n,\s]+/))
    .map(extractAsin)
    .filter(Boolean))]
    .slice(0, PRODUCTS_LIMIT);
}

function extractWishlistId(input) {
  const value = String(input || '').trim();
  const wishlistMatch = value.match(/(?:wishlist\/ls|\/hz\/wishlist\/ls)\/([A-Z0-9]{10,})|[?&](?:list|wishlistId)=([A-Z0-9]{10,})|\b([A-Z0-9]{10,})\b/i);
  return wishlistMatch ? (wishlistMatch[1] || wishlistMatch[2] || wishlistMatch[3]).toUpperCase() : '';
}

function assertAmazonUrl(url, message = 'Only Amazon URLs can be imported.') {
  const parsedUrl = new globalThis.URL(url);
  if (!/(^|\.)amazon\./i.test(parsedUrl.hostname)) {
    throw new Error(message);
  }
  return parsedUrl;
}

function toMoney(amount) {
  return Math.round(Number(amount || 0) * 100) / 100;
}

function getConvertedPrices(amount, original, countryCode) {
  const ratesToInr = { IN: 1, US: 83, GB: 104, CA: 61 };
  const inrRate = ratesToInr[countryCode] || 1;
  const priceINR = countryCode === 'IN' ? amount : amount * inrRate;
  const originalPriceINR = countryCode === 'IN' ? original : original * inrRate;

  return {
    priceINR: Math.round(priceINR),
    originalPriceINR: Math.round(originalPriceINR),
    priceUSD: countryCode === 'US' ? amount : toMoney(priceINR / ratesToInr.US),
    originalPriceUSD: countryCode === 'US' ? original : toMoney(originalPriceINR / ratesToInr.US),
    priceGBP: countryCode === 'GB' ? amount : toMoney(priceINR / ratesToInr.GB),
    originalPriceGBP: countryCode === 'GB' ? original : toMoney(originalPriceINR / ratesToInr.GB),
    priceCAD: countryCode === 'CA' ? amount : toMoney(priceINR / ratesToInr.CA),
    originalPriceCAD: countryCode === 'CA' ? original : toMoney(originalPriceINR / ratesToInr.CA),
  };
}

function getImageGallery(item) {
  const primary = item.Images?.Primary?.Large?.URL;
  const variants = item.Images?.Variants?.map((image) => image.Large?.URL).filter(Boolean) || [];
  return [...new Set([primary, ...variants].filter(Boolean))];
}

function toAmazonProduct(item, countryCode, partnerTag) {
  const listing = item.Offers?.Listings?.[0] || {};
  const price = listing.Price || item.Offers?.Summaries?.[0]?.LowestPrice || {};
  const savingBasis = listing.SavingBasis || item.Offers?.Summaries?.[0]?.HighestPrice || price;
  const amount = toMoney(price.Amount);
  const original = toMoney(savingBasis.Amount || amount);
  const title = item.ItemInfo?.Title?.DisplayValue || item.ASIN;
  const features = item.ItemInfo?.Features?.DisplayValues || [];
  const brand = item.ItemInfo?.ByLineInfo?.Brand?.DisplayValue || item.ItemInfo?.ByLineInfo?.Manufacturer?.DisplayValue || '';
  const category = item.ItemInfo?.Classifications?.ProductGroup?.DisplayValue || item.BrowseNodeInfo?.BrowseNodes?.[0]?.DisplayName || '';
  const summary = features.slice(0, 2).join(' ') || `${brand ? `${brand} ` : ''}Amazon product imported from the live Product Advertising API.`;
  const host = MARKETPLACES[countryCode]?.domain || MARKETPLACES.IN.domain;
  const detailUrl = item.DetailPageURL || `https://${host}/dp/${item.ASIN}`;
  const galleryImages = getImageGallery(item);
  const reviewCount = Number(item.CustomerReviews?.Count || 0);
  const rating = Number(item.CustomerReviews?.StarRating?.Value || 0);
  const discountPercent = original > amount && amount > 0 ? Math.round(((original - amount) / original) * 100) : 0;

  return {
    id: `paapi-${item.ASIN}`,
    asin: item.ASIN,
    name: title,
    title,
    brand,
    category: inferCategory(title, category, brand, features.join(' ')),
    amazonCategory: category,
    ...getConvertedPrices(amount, original, countryCode),
    livePrice: amount,
    mrp: original,
    discountPercent,
    rating,
    reviewCount,
    image: galleryImages[0] || '',
    galleryImages,
    availability: listing.Availability?.Message || 'Check Amazon for current availability',
    importStatus: 'imported',
    source: 'amazon-paapi',
    summary,
    tags: ['amazon', item.ASIN.toLowerCase(), brand.toLowerCase(), category.toLowerCase()].filter(Boolean),
    affiliateUrl: withTag(detailUrl, partnerTag),
    updatedAt: new Date().toISOString(),
  };
}

async function extractWishlistAsins(url, wishlistId) {
  if (!url || !wishlistId) throw new Error('Enter a valid public Amazon wishlist URL.');
  assertAmazonUrl(url, 'Only Amazon wishlist URLs can be imported.');

  const response = await fetch(url, {
    headers: {
      Accept: 'text/html,application/xhtml+xml',
      'Accept-Language': 'en-IN,en;q=0.9',
      'User-Agent': 'Mozilla/5.0 (compatible; GadgetsMelaWishlistImporter/1.0)',
    },
  });

  if ([401, 403, 404].includes(response.status)) {
    throw new Error('Amazon blocked this wishlist or it is private. Paste product URLs or ASINs in the fallback importer.');
  }
  if (!response.ok) throw new Error(`Wishlist fetch failed with status ${response.status}. Use fallback ASIN import if Amazon blocks access.`);

  const html = await response.text();
  const asins = [...new Set([...html.matchAll(/(?:data-asin="|\/dp\/|\/gp\/product\/)([A-Z0-9]{10})/g)].map((match) => match[1]))].slice(0, PRODUCTS_LIMIT);
  if (!asins.length) {
    throw new Error(`Wishlist ${wishlistId} did not expose product ASINs. It may be private, empty, or blocked by Amazon.`);
  }
  return asins;
}

async function signedPaapiRequest(operation, payload, countryCode) {
  const { accessKey, secretKey, partnerTag, market } = getCredentials(countryCode);
  const status = getApiStatus(countryCode);

  if (!status.connected) {
    throw new Error(`Missing Amazon PA API environment variables: ${status.missing.join(', ')}.`);
  }

  const service = 'ProductAdvertisingAPI';
  const target = `com.amazon.paapi5.v1.ProductAdvertisingAPIv1.${operation}`;
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const pathName = operation === 'SearchItems' ? '/paapi5/searchitems' : '/paapi5/getitems';
  const requestPayload = JSON.stringify({
    PartnerTag: partnerTag,
    PartnerType: 'Associates',
    Marketplace: market.marketplace,
    Resources: RESOURCES,
    ...payload,
  });

  const canonicalHeaders = `content-encoding:amz-1.0\nhost:${market.host}\nx-amz-date:${amzDate}\nx-amz-target:${target}\n`;
  const signedHeaders = 'content-encoding;host;x-amz-date;x-amz-target';
  const canonicalRequest = ['POST', pathName, '', canonicalHeaders, signedHeaders, sha256(requestPayload)].join('\n');
  const credentialScope = `${dateStamp}/${market.region}/${service}/aws4_request`;
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, credentialScope, sha256(canonicalRequest)].join('\n');
  const signingKey = getSignatureKey(secretKey, dateStamp, market.region, service);
  const signature = hmac(signingKey, stringToSign, 'hex');
  const authorization = `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const response = await fetch(`https://${market.host}${pathName}`, {
    method: 'POST',
    headers: {
      Authorization: authorization,
      'Content-Encoding': 'amz-1.0',
      'Content-Type': 'application/json; charset=utf-8',
      Host: market.host,
      'X-Amz-Date': amzDate,
      'X-Amz-Target': target,
    },
    body: requestPayload,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data.Errors?.[0]?.Message || data.message || `PA API ${response.status}`;
    throw new Error(`${message}. Verify Amazon PA API keys, Associate tag, marketplace, region, and host in Vercel environment variables.`);
  }

  const items = data.SearchResult?.Items || data.ItemsResult?.Items || [];
  return items.map((item) => toAmazonProduct(item, countryCode, partnerTag));
}

function getStore() {
  globalThis.__GADGETS_MELA_PRODUCTS__ ||= new Map();
  return globalThis.__GADGETS_MELA_PRODUCTS__;
}

async function hydrateStore() {
  const store = getStore();
  if (store.size) return store;

  try {
    const saved = JSON.parse(await readFile(SERVER_DB_PATH, 'utf8'));
    if (Array.isArray(saved)) saved.forEach((product) => store.set(product.asin || product.id, product));
  } catch {
    // The on-disk development cache is optional; production still uses the server memory store.
  }
  return store;
}

async function persistStore(store) {
  const products = [...store.values()];
  try {
    await mkdir(path.dirname(SERVER_DB_PATH), { recursive: true });
    await writeFile(SERVER_DB_PATH, JSON.stringify(products, null, 2));
  } catch {
    // Vercel serverless filesystems may be read-only outside /tmp; the in-memory store remains available.
  }
  return products;
}

async function listProducts() {
  const store = await hydrateStore();
  return [...store.values()].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

async function storeProducts(products = []) {
  const store = await hydrateStore();
  products.forEach((product) => {
    const key = product.asin || product.id;
    if (key) store.set(key, { ...product, updatedAt: product.updatedAt || new Date().toISOString() });
  });
  return persistStore(store);
}

function sendStatus(res, countryCode) {
  res.status(200).json(getApiStatus(countryCode));
}

export default async function handler(req, res) {
  const body = req.body || {};
  const countryCode = MARKETPLACES[body.countryCode] ? body.countryCode : DEFAULT_MARKETPLACE;

  if (req.method === 'GET') {
    if (req.query?.action === 'status') {
      sendStatus(res, req.query?.countryCode || countryCode);
      return;
    }
    res.status(200).json({ products: await listProducts(), status: getApiStatus(countryCode) });
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { action, keywords, asins = [], url, wishlistId, products = [] } = body;

  try {
    if (action === 'status') {
      sendStatus(res, countryCode);
      return;
    }

    if (action === 'list') {
      res.status(200).json({ products: await listProducts(), status: getApiStatus(countryCode) });
      return;
    }

    if (action === 'store') {
      const savedProducts = await storeProducts(products);
      res.status(200).json({ products: savedProducts, saved: products.length });
      return;
    }

    if (action === 'search') {
      if (!String(keywords || '').trim()) throw new Error('Enter keywords to search Amazon.');
      const imported = await signedPaapiRequest('SearchItems', { Keywords: keywords, ItemCount: PRODUCTS_LIMIT }, countryCode);
      const savedProducts = await storeProducts(imported);
      res.status(200).json({ products: imported, storedProducts: savedProducts, status: getApiStatus(countryCode) });
      return;
    }

    if (action === 'asins' || action === 'url') {
      const itemIds = normalizeAsins(action === 'url' ? [url] : asins);
      if (!itemIds.length) throw new Error('No valid Amazon ASINs were provided.');
      const imported = await signedPaapiRequest('GetItems', { ItemIds: itemIds }, countryCode);
      const savedProducts = await storeProducts(imported);
      res.status(200).json({ products: imported, storedProducts: savedProducts, status: getApiStatus(countryCode) });
      return;
    }

    if (action === 'wishlist') {
      const listId = extractWishlistId(wishlistId || url);
      const wishlistAsins = await extractWishlistAsins(url, listId);
      const imported = await signedPaapiRequest('GetItems', { ItemIds: wishlistAsins }, countryCode);
      const savedProducts = await storeProducts(imported);
      res.status(200).json({ products: imported, storedProducts: savedProducts, wishlistId: listId, status: getApiStatus(countryCode) });
      return;
    }

    res.status(400).json({ error: 'Unsupported Amazon action.' });
  } catch (error) {
    const isWishlistBlock = /blocked|private|wishlist/i.test(error.message);
    res.status(isWishlistBlock ? 422 : 500).json({ error: error.message, status: getApiStatus(countryCode) });
  }
}
