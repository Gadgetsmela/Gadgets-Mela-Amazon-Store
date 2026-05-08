import { Search, ShoppingBag, Sparkles } from 'lucide-react';

export default function Header({ query, onQueryChange }) {
  return (
    <header className="site-header">
      <a className="brand" href="#top" aria-label="Gadgets Mela home">
        <span className="brand-mark"><Sparkles size={22} /></span>
        <span>
          <strong>Gadgets Mela</strong>
          <small>Amazon Affiliate Store</small>
        </span>
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
