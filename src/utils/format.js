import { DEFAULT_COUNTRY, getCountryConfig } from '../data/countries.js';

const currencyFormatters = {
  IN: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }),
  US: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
  GB: new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }),
  CA: new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }),
};

export function formatProductCount(count) {
  return `${count} ${count === 1 ? 'pick' : 'picks'}`;
}

export function formatCurrency(amount, countryCode = DEFAULT_COUNTRY) {
  const selectedCountry = countryCode || DEFAULT_COUNTRY;
  const formatter = currencyFormatters[selectedCountry] || currencyFormatters[DEFAULT_COUNTRY];

  const formattedAmount = formatter.format(amount);

  return selectedCountry === 'CA' ? formattedAmount.replace(/^\$/, 'C$') : formattedAmount;
}

export function getProductPrices(product, countryCode = DEFAULT_COUNTRY) {
  const country = getCountryConfig(countryCode || DEFAULT_COUNTRY);

  return {
    price: product[country.priceKey],
    originalPrice: product[country.originalPriceKey],
  };
}
