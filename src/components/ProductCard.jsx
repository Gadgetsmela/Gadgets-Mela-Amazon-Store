import { ExternalLink, Star } from 'lucide-react';
import { DEFAULT_COUNTRY } from '../data/countries.js';
import { withAffiliateTag } from '../utils/affiliate.js';
import { formatCurrency, getProductPrices } from '../utils/format.js';

export default function ProductCard({ product, selectedCountry = DEFAULT_COUNTRY }) {
  const countryCode = selectedCountry || DEFAULT_COUNTRY;
  const affiliateUrl = withAffiliateTag(product.affiliateUrl, countryCode);
  const { price, originalPrice } = getProductPrices(product, countryCode);

  return (
    <article className="product-card">
      <div className="product-media">
        <span className="product-emoji" role="img" aria-label="Gadget illustration">{product.image}</span>
        <span className="product-badge">{product.badge}</span>
      </div>
      <div className="product-body">
        <p className="product-category">{product.category}</p>
        <h3>{product.name}</h3>
        <p>{product.summary}</p>
        <div className="rating" aria-label={`${product.rating} out of 5 stars`}>
          <Star size={16} fill="currentColor" />
          <strong>{product.rating}</strong>
          <span>Amazon rating</span>
        </div>
        <div className="price-row">
          <strong>{formatCurrency(price, countryCode)}</strong>
          <span>{formatCurrency(originalPrice, countryCode)}</span>
        </div>
        <a className="amazon-button" href={affiliateUrl} target="_blank" rel="noreferrer sponsored noopener">
          View on Amazon <ExternalLink size={16} />
        </a>
      </div>
    </article>
  );
}
