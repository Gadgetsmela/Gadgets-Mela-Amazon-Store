import ProductCard from './ProductCard.jsx';

export default function TrendingProducts({ products, selectedCountry, onQuickView }) {
  const trending = [...products]
    .sort((a, b) => (b.trendingScore || 0) - (a.trendingScore || 0))
    .slice(0, 4);

  return (
    <section className="trending-section" aria-labelledby="trending-title">
      <div className="section-heading">
        <p className="eyebrow">Auto-ranked every refresh</p>
        <h2 id="trending-title">Trending products</h2>
      </div>
      <div className="product-grid compact-grid">
        {trending.map((product) => (
          <ProductCard key={product.id} product={product} selectedCountry={selectedCountry} onQuickView={onQuickView} source="trending" />
        ))}
      </div>
    </section>
  );
}
