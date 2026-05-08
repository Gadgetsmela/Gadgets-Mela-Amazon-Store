import { ExternalLink, Star } from 'lucide-react';

export default function ProductCard({ product }) {
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
          <strong>{product.price}</strong>
          <span>{product.previousPrice}</span>
        </div>
        <a className="amazon-button" href={product.affiliateUrl} target="_blank" rel="noreferrer sponsored noopener">
          View on Amazon <ExternalLink size={16} />
        </a>
      </div>
    </article>
  );
}
