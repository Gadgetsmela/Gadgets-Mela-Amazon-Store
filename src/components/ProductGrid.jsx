import ProductCard from './ProductCard.jsx';

export default function ProductGrid({ products, selectedCountry }) {
  return (
    <section className="product-section" aria-live="polite">
      <div className="product-grid">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} selectedCountry={selectedCountry} />
        ))}
      </div>
      {products.length === 0 && (
        <div className="empty-state">
          <h3>No gadgets found</h3>
          <p>Try another search term or select a different category.</p>
        </div>
      )}
    </section>
  );
}
