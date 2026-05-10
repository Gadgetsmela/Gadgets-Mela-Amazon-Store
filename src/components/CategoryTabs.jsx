import { Car, Gamepad2, Headphones, Home, Laptop, Microwave, Monitor, Smartphone, Watch, Camera } from 'lucide-react';

const categoryCards = [
  { label: 'Mobiles', filter: 'Mobile', Icon: Smartphone, hint: 'Phones & cases' },
  { label: 'Laptops', filter: 'Workspace', Icon: Laptop, hint: 'Work setups' },
  { label: 'Audio', filter: 'Audio', Icon: Headphones, hint: 'ANC & speakers' },
  { label: 'Smart Home', filter: 'Smart Home', Icon: Home, hint: 'Alexa devices' },
  { label: 'Gaming', filter: 'Gaming', Icon: Gamepad2, hint: 'Console gear' },
  { label: 'Kitchen', filter: 'Gadgets', Icon: Microwave, hint: 'Smart kitchen' },
  { label: 'Car Accessories', filter: 'Accessories', Icon: Car, hint: 'Travel tech' },
  { label: 'Smart Watches', filter: 'Accessories', Icon: Watch, hint: 'Wearables' },
  { label: 'Cameras', filter: 'Creator Setup', Icon: Camera, hint: 'Creator tools' },
  { label: 'TVs', filter: 'Entertainment', Icon: Monitor, hint: '4K streaming' },
];

function getEffectiveCategory(filter, categories) {
  if (categories.includes(filter)) return filter;
  if (['Mobile', 'Gaming', 'Gadgets', 'Creator Setup'].includes(filter)) return 'Accessories';
  return categories.includes('All') ? 'All' : categories[0];
}

export default function CategoryTabs({ categories, activeCategory, onCategoryChange }) {
  return (
    <section className="category-section premium-category-section" aria-labelledby="category-title">
      <div className="section-heading category-heading-row">
        <div>
          <p className="eyebrow">Swipe the mela</p>
          <h2 id="category-title">Product categories</h2>
        </div>
        <button className={activeCategory === 'All' ? 'category-reset active' : 'category-reset'} type="button" onClick={() => onCategoryChange('All')}>
          All deals
        </button>
      </div>
      <div className="category-rail" role="tablist" aria-label="Product categories">
        {categoryCards.map(({ label, filter, Icon, hint }) => {
          const effectiveCategory = getEffectiveCategory(filter, categories);
          const isActive = activeCategory === effectiveCategory && filter === effectiveCategory;
          return (
            <button
              key={label}
              className={isActive ? 'category-card active' : 'category-card'}
              onClick={() => onCategoryChange(effectiveCategory)}
              type="button"
              role="tab"
              aria-selected={isActive}
            >
              <span className="category-icon"><Icon size={24} /></span>
              <strong>{label}</strong>
              <small>{hint}</small>
            </button>
          );
        })}
      </div>
    </section>
  );
}
