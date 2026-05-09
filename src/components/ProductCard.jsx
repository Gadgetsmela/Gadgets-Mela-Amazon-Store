import { ExternalLink, Eye, Star, TrendingUp } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { DEFAULT_COUNTRY } from '../data/countries.js';
import { getAffiliateUrl } from '../utils/affiliate.js';
import { formatCurrency, getProductPrices } from '../utils/format.js';
import { getOptimizedImageSources, getProductImageCandidates, repairAmazonImageUrl } from '../utils/productImages.js';
import { trackMarketingEvent } from '../services/dealMarketing.js';
import WhatsAppShareActions from './WhatsAppShareActions.jsx';

export default function ProductCard({ product, selectedCountry = DEFAULT_COUNTRY, onQuickView, priority = false, source = 'card' }) {
  const countryCode = selectedCountry || DEFAULT_COUNTRY;
  const affiliateUrl = getAffiliateUrl(product, countryCode);
  const { price, originalPrice } = getProductPrices(product, countryCode);
  const imageSources = useMemo(() => getOptimizedImageSources(product), [product]);
  const imageCandidates = useMemo(() => getProductImageCandidates(product), [product]);
  const [imageIndex, setImageIndex] = useState(0);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const activeImage = repairAmazonImageUrl(imageCandidates[imageIndex] || imageSources.src || imageSources.placeholder, product.asin);
  const badgeClass = String(product.autoBadge || product.badge || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');

  useEffect(() => {
    trackMarketingEvent('productView', { productId: product.id, category: product.category });
  }, [product.id, product.category]);

  function handleImageError() {
    setIsImageLoaded(false);
    setImageIndex((currentIndex) => Math.min(currentIndex + 1, imageCandidates.length - 1));
  }

  function handleImageLoad() {
    setIsImageLoaded(true);
  }

  return (
    <article className="product-card" id={`product-${product.id}`}>
      <div className={`product-media ratio-${imageSources.ratio || 'square'} ${isImageLoaded ? 'is-loaded' : 'is-loading'}`}>
        <img className="product-blur" src={imageSources.thumbnail || imageSources.placeholder} alt="" aria-hidden="true" loading="eager" />
        <picture>
          {imageSources.thumbnailWebp && <source srcSet={imageSources.thumbnailWebp} type="image/webp" media="(max-width: 640px)" />}
          {imageSources.webp && <source srcSet={imageSources.webp} type="image/webp" />}
          <img
            className="product-photo"
            src={activeImage}
            alt={product.name}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={priority ? 'high' : 'auto'}
            width="640"
            height={imageSources.ratio === 'vertical' ? '960' : '640'}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        </picture>
        <span className={`product-badge badge-${badgeClass} ${product.bestDeal ? 'best-deal' : ''}`}>{product.autoBadge || product.badge}</span>
        {product.featured && <span className="featured-badge">Featured</span>}
        {product.trendingScore >= 90 && <span className="trend-badge"><TrendingUp size={14} /> {product.dealScore || product.trendingScore}</span>}
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
          <a className="amazon-button" href={affiliateUrl} target="_blank" rel="noreferrer sponsored noopener" onClick={() => { trackMarketingEvent('affiliateClick', { productId: product.id }); trackMarketingEvent('productClick', { productId: product.id, category: product.category }); }}>
            Amazon <ExternalLink size={16} />
          </a>
          <button className="quick-button" type="button" onClick={() => onQuickView?.(product)}>
            <Eye size={16} /> Quick view
          </button>
        </div>
        <WhatsAppShareActions product={product} selectedCountry={countryCode} source={source} />
        <small>Updated {new Date(product.updatedAt).toLocaleDateString()}</small>
      </div>
    </article>
  );
}
