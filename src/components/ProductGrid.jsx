import ProductCard from './ProductCard.jsx';
import ProductSkeleton from './skeletons/ProductSkeleton.tsx';

export default function ProductGrid({ products, selectedCountry, isLoading = false, error = '', onQuickView }) {
  return (
    <section className="product-section" aria-live="polite">
      {error && (
        <div className="product-error" role="alert">
          <strong>Deal feed notice</strong>
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
          <h3>No matching deals found</h3>
          <p>Try another search term or category to discover more Gadgets Mela Amazon offers.</p>
        </div>
      )}
    </section>
  );
}
