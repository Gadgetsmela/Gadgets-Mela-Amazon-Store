import { ExternalLink, Star, X } from 'lucide-react';
import { DEFAULT_COUNTRY } from '../data/countries.js';
import { getAffiliateUrl } from '../utils/affiliate.js';
import { formatCurrency, getProductPrices } from '../utils/format.js';
import { getOptimizedImageSources } from '../utils/productImages.js';
import { trackMarketingEvent } from '../services/dealMarketing.js';
import WhatsAppShareActions from './WhatsAppShareActions.jsx';

export default function ProductQuickView({ product, selectedCountry = DEFAULT_COUNTRY, onClose }) {
  if (!product) return null;

  const affiliateUrl = getAffiliateUrl(product, selectedCountry);
  const { price, originalPrice } = getProductPrices(product, selectedCountry);
  const imageSources = getOptimizedImageSources(product);
  const galleryImages = imageSources.galleryImages;
  const primaryImage = galleryImages[0] || imageSources.src;

  return (
    <div className="quick-view-backdrop" role="presentation" onClick={onClose}>
      <article className="quick-view" role="dialog" aria-modal="true" aria-labelledby="quick-view-title" onClick={(event) => event.stopPropagation()}>
        <button className="icon-button close-button" type="button" onClick={onClose} aria-label="Close quick view">
          <X size={20} />
        </button>
        <div className="quick-view-media">
          <img src={primaryImage} alt={product.name} loading="eager" decoding="async" />
          {product.bestDeal && <strong>Best Deal</strong>}
          {galleryImages.length > 1 && (
            <div className="gallery-strip" aria-label="Amazon gallery images">
              {galleryImages.slice(0, 5).map((image) => <img key={image} src={image} alt="" loading="lazy" />)}
            </div>
          )}
        </div>
        <div className="quick-view-copy">
          <p className="product-category">{product.brand ? `${product.brand} · ` : ''}{product.category}</p>
          <h2 id="quick-view-title">{product.name}</h2>
          <p>{product.summary}</p>
          <div className="rating" aria-label={`${product.rating || 'No'} out of 5 stars`}>
            <Star size={16} fill="currentColor" />
            <strong>{product.rating || '—'}</strong>
            <span>{product.reviewCount ? `${product.reviewCount.toLocaleString()} Amazon reviews` : 'Live Amazon reviews'}</span>
          </div>
          <div className="product-meta-row">
            <span>{product.availability}</span>
            {product.importStatus && <em>{product.importStatus}</em>}
          </div>
          <div className="price-row">
            <strong>{formatCurrency(price, selectedCountry)}</strong>
            {originalPrice > price && <span>{formatCurrency(originalPrice, selectedCountry)}</span>}
            <em>{product.discountPercent || 0}% off</em>
          </div>
          <div className="quick-actions">
            <a className="amazon-button" href={affiliateUrl} target="_blank" rel="noreferrer sponsored noopener" onClick={() => { trackMarketingEvent('affiliateClick', { productId: product.id }); trackMarketingEvent('productClick', { productId: product.id }); }}>
              Buy on Amazon <ExternalLink size={16} />
            </a>
          </div>
          <WhatsAppShareActions product={product} selectedCountry={selectedCountry} source="quick-view" />
        </div>
      </article>
    </div>
  );
}
