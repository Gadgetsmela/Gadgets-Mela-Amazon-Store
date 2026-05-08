import ProductCard from './ProductCard.jsx';
import ProductSkeleton from './ProductSkeleton.jsx';

export default function ProductGrid({ products, selectedCountry, isLoading = false, onQuickView }) {
  return (
    <section className="product-section" aria-live="polite">
      {isLoading ? (
        <ProductSkeleton />
      ) : (
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} selectedCountry={selectedCountry} onQuickView={onQuickView} />
          ))}
        </div>
      )}
      {!isLoading && products.length === 0 && (
        <div className="empty-state">
          <h3>No gadgets found</h3>
          <p>Try another search term or select a different category.</p>
        </div>
      )}
    </section>
  );
}
