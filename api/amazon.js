import crypto from 'node:crypto';

const DEFAULT_ASSOCIATE_TAGS = {
  IN: 'technicalco0e-21',
  US: 'gadgetsmela0e-20',
};

const MARKETPLACES = {
  IN: { host: 'webservices.amazon.in', region: 'eu-west-1', marketplace: 'www.amazon.in', tagEnv: 'AMAZON_ASSOCIATE_TAG_IN' },
  US: { host: 'webservices.amazon.com', region: 'us-east-1', marketplace: 'www.amazon.com', tagEnv: 'AMAZON_ASSOCIATE_TAG_US' },
  GB: { host: 'webservices.amazon.co.uk', region: 'eu-west-1', marketplace: 'www.amazon.co.uk', tagEnv: 'AMAZON_ASSOCIATE_TAG_GB' },
  CA: { host: 'webservices.amazon.ca', region: 'us-east-1', marketplace: 'www.amazon.ca', tagEnv: 'AMAZON_ASSOCIATE_TAG_CA' },
};

const RESOURCES = [
  'BrowseNodeInfo.BrowseNodes',
  'Images.Primary.Large',
  'ItemInfo.Title',
  'ItemInfo.Features',
  'ItemInfo.ByLineInfo',
  'Offers.Listings.Availability.Message',
  'Offers.Listings.Price',
  'Offers.Listings.SavingBasis',
  'Offers.Listings.Promotions',
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
  ['dock', 'Creator Setup'],
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

function getAssociateTag(countryCode) {
  const market = MARKETPLACES[countryCode] || MARKETPLACES.IN;
  return process.env[market.tagEnv] || DEFAULT_ASSOCIATE_TAGS[countryCode] || process.env.AMAZON_ASSOCIATE_TAG || DEFAULT_ASSOCIATE_TAGS.IN;
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
    .slice(0, 10);
}

function extractWishlistId(input) {
  const value = String(input || '').trim();
  const wishlistMatch = value.match(/(?:wishlist\/ls|\/hz\/wishlist\/ls)\/([A-Z0-9]{10,})|[?&](?:list|wishlistId)=([A-Z0-9]{10,})|\b([A-Z0-9]{10,})\b/i);
  return wishlistMatch ? (wishlistMatch[1] || wishlistMatch[2] || wishlistMatch[3]).toUpperCase() : '';
}

function assertAmazonUrl(url) {
  const parsedUrl = new globalThis.URL(url);
  if (!/(^|\.)amazon\./i.test(parsedUrl.hostname)) {
    throw new Error('Only Amazon wishlist URLs can be imported.');
  }
}

function toAmazonProduct(item, countryCode, associateTag) {
  const listing = item.Offers?.Listings?.[0] || {};
  const price = listing.Price || item.Offers?.Summaries?.[0]?.LowestPrice || {};
  const savingBasis = listing.SavingBasis || item.Offers?.Summaries?.[0]?.HighestPrice || price;
  const amount = Number(price.Amount || 0);
  const original = Number(savingBasis.Amount || amount);
  const inrRate = { IN: 1, US: 83, GB: 104, CA: 61 }[countryCode] || 1;
  const title = item.ItemInfo?.Title?.DisplayValue || item.ASIN;
  const features = item.ItemInfo?.Features?.DisplayValues || [];
  const summary = features.slice(0, 2).join(' ') || 'Live Amazon product imported through Product Advertising API.';
  const browseNode = item.BrowseNodeInfo?.BrowseNodes?.[0]?.DisplayName;
  const host = MARKETPLACES[countryCode]?.marketplace || MARKETPLACES.IN.marketplace;
  const detailUrl = item.DetailPageURL || `https://${host}/dp/${item.ASIN}`;

  return {
    id: `paapi-${item.ASIN}`,
    asin: item.ASIN,
    name: title,
    category: inferCategory(title, browseNode, features.join(' ')),
    priceINR: Math.round(amount * inrRate),
    originalPriceINR: Math.round(original * inrRate),
    priceUSD: countryCode === 'US' ? amount : Math.round((amount * inrRate / 83) * 100) / 100,
    originalPriceUSD: countryCode === 'US' ? original : Math.round((original * inrRate / 83) * 100) / 100,
    priceGBP: countryCode === 'GB' ? amount : Math.round((amount * inrRate / 104) * 100) / 100,
    originalPriceGBP: countryCode === 'GB' ? original : Math.round((original * inrRate / 104) * 100) / 100,
    priceCAD: countryCode === 'CA' ? amount : Math.round((amount * inrRate / 61) * 100) / 100,
    originalPriceCAD: countryCode === 'CA' ? original : Math.round((original * inrRate / 61) * 100) / 100,
    rating: Number(item.CustomerReviews?.StarRating?.Value || 4.5),
    reviewCount: Number(item.CustomerReviews?.Count || 100),
    image: item.Images?.Primary?.Large?.URL || '🛒',
    availability: listing.Availability?.Message || 'Check Amazon for current availability',
    importStatus: 'imported',
    summary,
    tags: ['amazon', item.ASIN.toLowerCase(), browseNode?.toLowerCase()].filter(Boolean),
    affiliateUrl: withTag(detailUrl, associateTag),
    updatedAt: new Date().toISOString(),
  };
}

async function extractWishlistAsins(url, wishlistId) {
  if (!url || !wishlistId) throw new Error('Enter a valid public Amazon wishlist URL.');
  assertAmazonUrl(url);

  const response = await fetch(url, {
    headers: {
      Accept: 'text/html,application/xhtml+xml',
      'Accept-Language': 'en-IN,en;q=0.9',
      'User-Agent': 'Mozilla/5.0 (compatible; GadgetsMelaWishlistImporter/1.0)',
    },
  });

  if ([401, 403, 404].includes(response.status)) {
    throw new Error('Amazon blocked this wishlist or it is private. Use the fallback box to paste product URLs or ASINs line-by-line.');
  }
  if (!response.ok) throw new Error(`Wishlist fetch failed with status ${response.status}. Use the fallback box if Amazon blocks access.`);

  const html = await response.text();
  const asins = [...new Set([...html.matchAll(/(?:data-asin="|\/dp\/|\/gp\/product\/)([A-Z0-9]{10})/g)].map((match) => match[1]))].slice(0, 10);
  if (!asins.length) {
    throw new Error(`Wishlist ${wishlistId} did not expose product ASINs. It may be private, empty, or blocked by Amazon. Use the fallback box to paste product URLs or ASINs line-by-line.`);
  }
  return asins;
}

async function signedPaapiRequest(operation, payload, countryCode) {
  const accessKey = process.env.AMAZON_PAAPI_ACCESS_KEY;
  const secretKey = process.env.AMAZON_PAAPI_SECRET_KEY;
  const partnerTag = getAssociateTag(countryCode);

  if (!accessKey || !secretKey) throw new Error('Missing Amazon PA API credentials. Add server-side AMAZON_PAAPI_ACCESS_KEY and AMAZON_PAAPI_SECRET_KEY environment variables.');

  const market = MARKETPLACES[countryCode] || MARKETPLACES.IN;
  const service = 'ProductAdvertisingAPI';
  const target = `com.amazon.paapi5.v1.ProductAdvertisingAPIv1.${operation}`;
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const path = operation === 'SearchItems' ? '/paapi5/searchitems' : '/paapi5/getitems';
  const requestPayload = JSON.stringify({
    PartnerTag: partnerTag,
    PartnerType: 'Associates',
    Marketplace: market.marketplace,
    Resources: RESOURCES,
    ...payload,
  });

  const canonicalHeaders = `content-encoding:amz-1.0\nhost:${market.host}\nx-amz-date:${amzDate}\nx-amz-target:${target}\n`;
  const signedHeaders = 'content-encoding;host;x-amz-date;x-amz-target';
  const canonicalRequest = ['POST', path, '', canonicalHeaders, signedHeaders, sha256(requestPayload)].join('\n');
  const credentialScope = `${dateStamp}/${market.region}/${service}/aws4_request`;
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, credentialScope, sha256(canonicalRequest)].join('\n');
  const signingKey = getSignatureKey(secretKey, dateStamp, market.region, service);
  const signature = hmac(signingKey, stringToSign, 'hex');
  const authorization = `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const response = await fetch(`https://${market.host}${path}`, {
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

  if (!response.ok) throw new Error(`PA API ${response.status}. Verify server-side Amazon PA API credentials, Associate tag, and marketplace access.`);
  const data = await response.json();
  const items = data.SearchResult?.Items || data.ItemsResult?.Items || [];
  return items.map((item) => toAmazonProduct(item, countryCode, partnerTag));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { action, keywords, asins = [], url, wishlistId, countryCode = 'IN' } = req.body || {};
  const normalizedCountry = MARKETPLACES[countryCode] ? countryCode : 'IN';

  try {
    if (action === 'search') {
      const products = await signedPaapiRequest('SearchItems', { Keywords: keywords, ItemCount: 10 }, normalizedCountry);
      res.status(200).json({ products });
      return;
    }

    if (action === 'asins') {
      const itemIds = normalizeAsins(asins);
      if (!itemIds.length) throw new Error('No valid ASINs were provided.');
      const products = await signedPaapiRequest('GetItems', { ItemIds: itemIds }, normalizedCountry);
      res.status(200).json({ products });
      return;
    }

    if (action === 'wishlist') {
      const listId = extractWishlistId(wishlistId || url);
      const wishlistAsins = await extractWishlistAsins(url, listId);
      const products = await signedPaapiRequest('GetItems', { ItemIds: wishlistAsins }, normalizedCountry);
      res.status(200).json({ products, wishlistId: listId });
      return;
    }

    res.status(400).json({ error: 'Unsupported Amazon action.' });
  } catch (error) {
    const isWishlistBlock = /blocked|private|wishlist/i.test(error.message);
    res.status(isWishlistBlock ? 422 : 500).json({ error: error.message });
  }
}
