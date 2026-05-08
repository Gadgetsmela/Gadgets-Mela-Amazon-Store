import { ExternalLink, MessageCircle, Send, Star, X } from 'lucide-react';
import { DEFAULT_COUNTRY } from '../data/countries.js';
import { withAffiliateTag } from '../utils/affiliate.js';
import { formatCurrency, getProductPrices } from '../utils/format.js';

export default function ProductQuickView({ product, selectedCountry = DEFAULT_COUNTRY, onClose }) {
  if (!product) return null;

  const affiliateUrl = withAffiliateTag(product.affiliateUrl, selectedCountry);
  const { price, originalPrice } = getProductPrices(product, selectedCountry);
  const shareText = encodeURIComponent(`Check this Gadgets Mela Amazon deal: ${product.name} ${affiliateUrl}`);

  return (
    <div className="quick-view-backdrop" role="presentation" onClick={onClose}>
      <article className="quick-view" role="dialog" aria-modal="true" aria-labelledby="quick-view-title" onClick={(event) => event.stopPropagation()}>
        <button className="icon-button close-button" type="button" onClick={onClose} aria-label="Close quick view">
          <X size={20} />
        </button>
        <div className="quick-view-media">
          {String(product.image).startsWith('http') ? <img src={product.image} alt="" /> : <span>{product.image}</span>}
          {product.bestDeal && <strong>Best Deal</strong>}
        </div>
        <div className="quick-view-copy">
          <p className="product-category">{product.category}</p>
          <h2 id="quick-view-title">{product.name}</h2>
          <p>{product.summary}</p>
          <div className="rating" aria-label={`${product.rating} out of 5 stars`}>
            <Star size={16} fill="currentColor" />
            <strong>{product.rating}</strong>
            <span>{product.reviewCount || 'Live'} Amazon reviews</span>
          </div>
          <div className="price-row">
            <strong>{formatCurrency(price, selectedCountry)}</strong>
            <span>{formatCurrency(originalPrice, selectedCountry)}</span>
            <em>{product.discountPercent}% off</em>
          </div>
          <div className="quick-actions">
            <a className="amazon-button" href={affiliateUrl} target="_blank" rel="noreferrer sponsored noopener">
              Buy on Amazon <ExternalLink size={16} />
            </a>
            <a className="share-button" href={`https://wa.me/?text=${shareText}`} target="_blank" rel="noreferrer noopener">
              <MessageCircle size={16} /> WhatsApp
            </a>
            <a className="share-button" href={`https://t.me/share/url?url=${encodeURIComponent(affiliateUrl)}&text=${shareText}`} target="_blank" rel="noreferrer noopener">
              <Send size={16} /> Telegram
            </a>
          </div>
        </div>
      </article>
    </div>
  );
}
