import { DEFAULT_COUNTRY, getCountryConfig } from '../data/countries.js';

export function withAffiliateTag(url, countryCode = DEFAULT_COUNTRY) {
  const country = getCountryConfig(countryCode || DEFAULT_COUNTRY);
  const parsedUrl = new globalThis.URL(url || `https://${country.amazonHost}`);

  parsedUrl.hostname = country.amazonHost;
  if (countryCode === 'US') {
    parsedUrl.searchParams.set('tag', country.affiliateTag);
  } else if (!parsedUrl.searchParams.get('tag')) {
    parsedUrl.searchParams.set('tag', country.affiliateTag);
  }

  return parsedUrl.toString();
}
