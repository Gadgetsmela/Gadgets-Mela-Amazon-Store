export const DEFAULT_COUNTRY = 'IN';

export const countries = [
  {
    code: 'IN',
    name: 'India',
    priceKey: 'priceINR',
    currency: 'INR',
    originalPriceKey: 'originalPriceINR',
    affiliateTag: 'technicalco0e-21',
    amazonHost: 'www.amazon.in',
  },
  {
    code: 'US',
    name: 'USA',
    priceKey: 'priceUSD',
    currency: 'USD',
    originalPriceKey: 'originalPriceUSD',
    affiliateTag: 'gadgetsmela0e-20',
    amazonHost: 'www.amazon.com',
  },
  {
    code: 'GB',
    name: 'UK',
    priceKey: 'priceGBP',
    currency: 'GBP',
    originalPriceKey: 'originalPriceGBP',
    affiliateTag: 'technicalco0e-21',
    amazonHost: 'www.amazon.co.uk',
  },
  {
    code: 'CA',
    name: 'Canada',
    priceKey: 'priceCAD',
    currency: 'CAD',
    originalPriceKey: 'originalPriceCAD',
    affiliateTag: 'technicalco0e-21',
    amazonHost: 'www.amazon.ca',
  },
];

export function getCountryConfig(countryCode) {
  return countries.find((country) => country.code === countryCode) || countries[0];
}
