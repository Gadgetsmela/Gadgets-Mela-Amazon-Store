import { ExternalLink, Eye, MessageCircle, Send, Star, TrendingUp } from 'lucide-react';
import { DEFAULT_COUNTRY } from '../data/countries.js';
import { withAffiliateTag } from '../utils/affiliate.js';
import { formatCurrency, getProductPrices } from '../utils/format.js';

export default function ProductCard({ product, selectedCountry = DEFAULT_COUNTRY, onQuickView }) {
  const countryCode = selectedCountry || DEFAULT_COUNTRY;
  const affiliateUrl = withAffiliateTag(product.affiliateUrl, countryCode);
  const { price, originalPrice } = getProductPrices(product, countryCode);
  const shareText = encodeURIComponent(`Gadgets Mela deal: ${product.name} ${affiliateUrl}`);

  return (
    <article className="product-card" id={`product-${product.id}`}>
      <div className="product-media">
        {String(product.image).startsWith('http') ? (
          <img className="product-photo" src={product.image} alt="" loading="lazy" />
        ) : (
          <span className="product-emoji" role="img" aria-label="Gadget illustration">{product.image}</span>
        )}
        <span className={`product-badge ${product.bestDeal ? 'best-deal' : ''}`}>{product.badge}</span>
        {product.trendingScore >= 110 && <span className="trend-badge"><TrendingUp size={14} /> Trending</span>}
      </div>
      <div className="product-body">
        <p className="product-category">{product.category}</p>
        <h3>{product.name}</h3>
        <p>{product.summary}</p>
        <div className="rating" aria-label={`${product.rating} out of 5 stars`}>
          <Star size={16} fill="currentColor" />
          <strong>{product.rating}</strong>
          <span>Amazon rating sync</span>
        </div>
        <div className="price-row">
          <strong>{formatCurrency(price, countryCode)}</strong>
          <span>{formatCurrency(originalPrice, countryCode)}</span>
          <em>{product.discountPercent}% off</em>
        </div>
        <div className="card-actions">
          <a className="amazon-button" href={affiliateUrl} target="_blank" rel="noreferrer sponsored noopener">
            Amazon <ExternalLink size={16} />
          </a>
          <button className="quick-button" type="button" onClick={() => onQuickView?.(product)}>
            <Eye size={16} /> Quick view
          </button>
        </div>
        <div className="share-row" aria-label="Share this deal">
          <a href={`https://wa.me/?text=${shareText}`} target="_blank" rel="noreferrer noopener"><MessageCircle size={15} /> WhatsApp</a>
          <a href={`https://t.me/share/url?url=${encodeURIComponent(affiliateUrl)}&text=${shareText}`} target="_blank" rel="noreferrer noopener"><Send size={15} /> Telegram</a>
        </div>
        <small>Updated {new Date(product.updatedAt).toLocaleDateString()}</small>
      </div>
    </article>
  );
}
