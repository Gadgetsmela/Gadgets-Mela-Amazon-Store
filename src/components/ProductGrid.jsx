import ProductCard from './ProductCard.jsx';
import ProductSkeleton from './ProductSkeleton.jsx';

export default function ProductGrid({ products, selectedCountry, isLoading = false, error = '', onQuickView }) {
  return (
    <section className="product-section" aria-live="polite">
      {error && (
        <div className="product-error" role="alert">
          <strong>Amazon sync error</strong>
          <span>{error}</span>
        </div>
      )}
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
          <h3>No live Amazon products stored yet</h3>
          <p>Use the admin dashboard to import ASINs, a product URL, a wishlist, or keyword search results through the server-side PA API route.</p>
        </div>
      )}
    </section>
  );
}
