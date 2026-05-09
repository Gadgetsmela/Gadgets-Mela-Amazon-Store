import { Camera, ExternalLink, Eye, Image as ImageIcon, MessageCircle, Send, Star, TrendingUp } from 'lucide-react';
import { DEFAULT_COUNTRY } from '../data/countries.js';
import { getAffiliateUrl } from '../utils/affiliate.js';
import { formatCurrency, getProductPrices } from '../utils/format.js';

export default function ProductCard({ product, selectedCountry = DEFAULT_COUNTRY, onQuickView }) {
  const countryCode = selectedCountry || DEFAULT_COUNTRY;
  const affiliateUrl = getAffiliateUrl(product, countryCode);
  const { price, originalPrice } = getProductPrices(product, countryCode);
  const plainShareText = `Gadgets Mela deal: ${product.name} ${affiliateUrl}`;
  const shareText = encodeURIComponent(plainShareText);
  const shareUrl = encodeURIComponent(affiliateUrl);
  const primaryImage = product.image || product.galleryImages?.[0];

  return (
    <article className="product-card" id={`product-${product.id}`}>
      <div className="product-media">
        {String(primaryImage || '').startsWith('http') || String(primaryImage || '').startsWith('data:') ? (
          <img className="product-photo" src={primaryImage} alt={product.name} loading="lazy" />
        ) : (
          <span className="product-emoji" role="img" aria-label="Amazon gadget">🛒</span>
        )}
        <span className={`product-badge ${product.bestDeal ? 'best-deal' : ''}`}>{product.badge}</span>
        {product.featured && <span className="featured-badge">Featured</span>}
        {product.trendingScore >= 110 && <span className="trend-badge"><TrendingUp size={14} /> Trending</span>}
      </div>
      <div className="product-body">
        <p className="product-category">{product.brand ? `${product.brand} · ` : ''}{product.category}</p>
        <h3>{product.name}</h3>
        <p>{product.summary}</p>
        <div className="rating" aria-label={`${product.rating || 'No'} out of 5 stars`}>
          <Star size={16} fill="currentColor" />
          <strong>{product.rating || '—'}</strong>
          <span>{product.reviewCount ? `${product.reviewCount.toLocaleString()} reviews` : 'Amazon rating sync'}</span>
        </div>
        <div className="product-meta-row">
          <span>{product.availability || 'Check Amazon for availability'}</span>
          {product.importStatus && <em>{product.importStatus}</em>}
        </div>
        <div className="price-row">
          <strong>{formatCurrency(price, countryCode)}</strong>
          {originalPrice > price && <span>{formatCurrency(originalPrice, countryCode)}</span>}
          <em>{product.discountPercent || 0}% off</em>
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
          <a href={`https://t.me/share/url?url=${shareUrl}&text=${shareText}`} target="_blank" rel="noreferrer noopener"><Send size={15} /> Telegram</a>
          <a href={`https://www.pinterest.com/pin/create/button/?url=${shareUrl}&description=${shareText}`} target="_blank" rel="noreferrer noopener"><ImageIcon size={15} /> Pinterest</a>
          <a href={`https://www.instagram.com/?url=${shareUrl}`} target="_blank" rel="noreferrer noopener"><Camera size={15} /> Reels</a>
        </div>
        <small>Updated {new Date(product.updatedAt).toLocaleDateString()}</small>
      </div>
    </article>
  );
}
