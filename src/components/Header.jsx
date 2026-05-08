import { Search, ShoppingBag } from 'lucide-react';

export default function Header({ query, onQueryChange }) {
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

      <a className="header-cta" href="#deals">
        <ShoppingBag size={18} />
        Shop deals
      </a>
    </header>
  );
}
