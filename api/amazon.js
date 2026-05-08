import crypto from 'node:crypto';

const MARKETPLACES = {
  IN: { host: 'webservices.amazon.in', region: 'eu-west-1', marketplace: 'www.amazon.in', tag: process.env.AMAZON_ASSOCIATE_TAG_IN },
  US: { host: 'webservices.amazon.com', region: 'us-east-1', marketplace: 'www.amazon.com', tag: process.env.AMAZON_ASSOCIATE_TAG_US },
  GB: { host: 'webservices.amazon.co.uk', region: 'eu-west-1', marketplace: 'www.amazon.co.uk', tag: process.env.AMAZON_ASSOCIATE_TAG_GB },
  CA: { host: 'webservices.amazon.ca', region: 'us-east-1', marketplace: 'www.amazon.ca', tag: process.env.AMAZON_ASSOCIATE_TAG_CA },
};

const RESOURCES = [
  'Images.Primary.Large',
  'ItemInfo.Title',
  'ItemInfo.Features',
  'ItemInfo.ByLineInfo',
  'Offers.Listings.Price',
  'Offers.Listings.SavingBasis',
  'Offers.Listings.Promotions',
  'Offers.Summaries.HighestPrice',
  'Offers.Summaries.LowestPrice',
  'CustomerReviews.Count',
  'CustomerReviews.StarRating',
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

function toAmazonProduct(item, countryCode, associateTag) {
  const listing = item.Offers?.Listings?.[0] || {};
  const price = listing.Price || item.Offers?.Summaries?.[0]?.LowestPrice || {};
  const savingBasis = listing.SavingBasis || item.Offers?.Summaries?.[0]?.HighestPrice || price;
  const amount = Number(price.Amount || 0);
  const original = Number(savingBasis.Amount || amount);
  const inrRate = { IN: 1, US: 83, GB: 104, CA: 61 }[countryCode] || 1;
  const title = item.ItemInfo?.Title?.DisplayValue || item.ASIN;
  const summary = item.ItemInfo?.Features?.DisplayValues?.slice(0, 2).join(' ') || 'Live Amazon product imported through Product Advertising API.';
  const host = MARKETPLACES[countryCode]?.marketplace || MARKETPLACES.IN.marketplace;

  return {
    id: `paapi-${item.ASIN}`,
    asin: item.ASIN,
    name: title,
    category: 'Accessories',
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
    summary,
    tags: ['amazon', item.ASIN.toLowerCase()],
    affiliateUrl: item.DetailPageURL || `https://${host}/dp/${item.ASIN}?tag=${associateTag}`,
    updatedAt: new Date().toISOString(),
  };
}


async function extractWishlistAsins(url) {
  if (!url) return [];
  const response = await fetch(url, { headers: { 'User-Agent': 'GadgetsMelaBot/1.0 (+https://gadgets-mela.example.com)' } });
  if (!response.ok) throw new Error(`Wishlist fetch ${response.status}`);
  const html = await response.text();
  return [...new Set([...html.matchAll(/(?:data-asin="|\/dp\/)([A-Z0-9]{10})/g)].map((match) => match[1]))].slice(0, 10);
}

async function signedPaapiRequest(operation, payload, countryCode) {
  const accessKey = process.env.AMAZON_PAAPI_ACCESS_KEY;
  const secretKey = process.env.AMAZON_PAAPI_SECRET_KEY;
  const partnerTag = MARKETPLACES[countryCode]?.tag || process.env.AMAZON_ASSOCIATE_TAG || 'technicalco0e-21';

  if (!accessKey || !secretKey) throw new Error('Missing Amazon PA API credentials.');

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

  if (!response.ok) throw new Error(`PA API ${response.status}`);
  const data = await response.json();
  const items = data.SearchResult?.Items || data.ItemsResult?.Items || [];
  return items.map((item) => toAmazonProduct(item, countryCode, partnerTag));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { action, keywords, asins = [], url, countryCode = 'IN' } = req.body || {};
  const normalizedCountry = MARKETPLACES[countryCode] ? countryCode : 'IN';

  try {
    if (action === 'search') {
      const products = await signedPaapiRequest('SearchItems', { Keywords: keywords, ItemCount: 10 }, normalizedCountry);
      res.status(200).json({ products });
      return;
    }

    if (action === 'asins') {
      const products = await signedPaapiRequest('GetItems', { ItemIds: asins.slice(0, 10) }, normalizedCountry);
      res.status(200).json({ products });
      return;
    }

    if (action === 'wishlist') {
      const wishlistAsins = await extractWishlistAsins(url);
      const products = await signedPaapiRequest('GetItems', { ItemIds: wishlistAsins }, normalizedCountry);
      res.status(200).json({ products });
      return;
    }

    res.status(400).json({ error: 'Unsupported Amazon action.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
