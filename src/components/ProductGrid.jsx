import ProductCard from './ProductCard.jsx';
import ProductSkeleton from './ProductSkeleton.jsx';

export default function ProductGrid({ products, selectedCountry, isLoading = false, error = '', onQuickView }) {
  return (
    <section className="product-section" aria-live="polite">
      {error && (
        <div className="product-error" role="alert">
          <strong>Product database notice</strong>
          <span>{error}</span>
        </div>
      )}
      {isLoading ? (
        <ProductSkeleton />
      ) : (
        <div className="product-grid">
          {products.map((product, index) => (
            <ProductCard key={product.id} product={product} selectedCountry={selectedCountry} onQuickView={onQuickView} priority={index < 4} />
          ))}
        </div>
      )}
      {!isLoading && products.length === 0 && (
        <div className="empty-state">
          <h3>No local affiliate products stored yet</h3>
          <p>Use the admin dashboard to add static product cards, import ASINs, parse Amazon URLs, or parse wishlist text without PA API approval.</p>
        </div>
      )}
    </section>
  );
}
