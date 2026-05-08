import { Search, ShoppingBag } from 'lucide-react';
import { countries } from '../data/countries.js';

export default function Header({ query, onQueryChange, selectedCountry, onCountryChange }) {
  return (
    <header className="site-header">
      <a className="brand" href="#top" aria-label="Gadgets Mela home">
        <img
          className="brand-logo brand-logo-full"
          src="/brand/gadgets-mela-logo.svg"
          alt="GADGETS MELA"
          width="260"
          height="64"
        />
        <img
          className="brand-logo brand-logo-mobile"
          src="/brand/gm-icon.svg"
          alt="GADGETS MELA"
          width="52"
          height="52"
        />
      </a>

      <label className="search-box" htmlFor="product-search">
        <Search size={18} aria-hidden="true" />
        <input
          id="product-search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search chargers, headphones, smart home..."
        />
      </label>

      <div className="header-actions">
        <label className="country-selector" htmlFor="country-selector">
          <span>Country</span>
          <select
            id="country-selector"
            value={selectedCountry}
            onChange={(event) => onCountryChange(event.target.value)}
            aria-label="Select shopping country and currency"
          >
            {countries.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
        </label>

        <a className="header-cta" href="#deals">
          <ShoppingBag size={18} />
          Shop deals
        </a>
        <a className="header-cta ghost-cta" href="#admin">
          Admin
        </a>
      </div>
    </header>
  );
}
