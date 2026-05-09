import { DEFAULT_COUNTRY, getCountryConfig } from '../data/countries.js';

export function buildAmazonProductUrl(asin, countryCode = DEFAULT_COUNTRY) {
  const country = getCountryConfig(countryCode || DEFAULT_COUNTRY);
  return `https://${country.amazonHost}/dp/${String(asin || '').trim().toUpperCase()}`;
}

export function withAffiliateTag(url, countryCode = DEFAULT_COUNTRY) {
  const country = getCountryConfig(countryCode || DEFAULT_COUNTRY);
  const fallbackUrl = `https://${country.amazonHost}`;
  const parsedUrl = new globalThis.URL(url || fallbackUrl, fallbackUrl);

  parsedUrl.hostname = country.amazonHost;
  parsedUrl.searchParams.set('tag', country.affiliateTag);

  return parsedUrl.toString();
}

export function getAffiliateUrl(product, countryCode = DEFAULT_COUNTRY) {
  const country = getCountryConfig(countryCode || DEFAULT_COUNTRY);
  const localizedUrl = product?.countryLinks?.[country.code] || product?.affiliateUrl || (product?.asin ? buildAmazonProductUrl(product.asin, country.code) : `https://${country.amazonHost}`);

  return withAffiliateTag(localizedUrl, country.code);
}
