export default function CategoryTabs({ categories, activeCategory, onCategoryChange }) {
  return (
    <section className="category-section" aria-labelledby="category-title">
      <div className="section-heading">
        <p className="eyebrow">Shop by need</p>
        <h2 id="category-title">Featured categories</h2>
      </div>
      <div className="category-tabs" role="tablist" aria-label="Product categories">
        {categories.map((category) => (
          <button
            key={category}
            className={category === activeCategory ? 'active' : ''}
            onClick={() => onCategoryChange(category)}
            type="button"
            role="tab"
            aria-selected={category === activeCategory}
          >
            {category}
          </button>
        ))}
      </div>
    </section>
  );
}
