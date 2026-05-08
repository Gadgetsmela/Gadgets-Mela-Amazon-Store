import { DEFAULT_COUNTRY, getCountryConfig } from '../data/countries.js';

export function withAffiliateTag(url, countryCode = DEFAULT_COUNTRY) {
  const country = getCountryConfig(countryCode || DEFAULT_COUNTRY);
  const parsedUrl = new globalThis.URL(url);

  parsedUrl.hostname = country.amazonHost;
  parsedUrl.searchParams.set('tag', country.affiliateTag);

  return parsedUrl.toString();
}
