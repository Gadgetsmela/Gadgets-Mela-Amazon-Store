import ProductCard from './ProductCard.jsx';

export default function DealEngineSections({ sections = [], selectedCountry, onQuickView }) {
  return (
    <section className="deal-engine-sections" aria-labelledby="deal-engine-title">
      <div className="section-heading">
        <p className="eyebrow">AI Auto Deal Engine</p>
        <h2 id="deal-engine-title">Affiliate automation command center</h2>
      </div>
      <div className="deal-section-stack">
        {sections.map((section) => (
          <article className="deal-engine-section" key={section.id}>
            <div className="deal-section-head">
              <div>
                <p className="eyebrow">{section.eyebrow}</p>
                <h3>{section.title}</h3>
              </div>
              <span>{section.products.length} picks</span>
            </div>
            <div className="product-grid compact-grid">
              {section.products.map((product, index) => (
                <ProductCard
                  key={`${section.id}-${product.id}`}
                  product={product}
                  selectedCountry={selectedCountry}
                  onQuickView={onQuickView}
                  priority={index < 2}
                  source={section.id}
                />
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
