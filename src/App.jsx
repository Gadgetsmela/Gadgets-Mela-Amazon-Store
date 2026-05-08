import { useMemo, useState } from 'react';
import Header from './components/Header.jsx';
import Hero from './components/Hero.jsx';
import CategoryTabs from './components/CategoryTabs.jsx';
import ProductGrid from './components/ProductGrid.jsx';
import DealStrip from './components/DealStrip.jsx';
import BuyingGuides from './components/BuyingGuides.jsx';
import Newsletter from './components/Newsletter.jsx';
import Footer from './components/Footer.jsx';
import AffiliateDisclosure from './components/AffiliateDisclosure.jsx';
import { products } from './data/products.js';
import { categories } from './data/categories.js';

export default function App() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [query, setQuery] = useState('');

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory = activeCategory === 'All' || product.category === activeCategory;
      const matchesQuery =
        !normalizedQuery ||
        product.name.toLowerCase().includes(normalizedQuery) ||
        product.summary.toLowerCase().includes(normalizedQuery) ||
        product.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery));

      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, query]);

  return (
    <div className="app-shell">
      <Header query={query} onQueryChange={setQuery} />
      <main>
        <Hero />
        <AffiliateDisclosure />
        <DealStrip />
        <CategoryTabs
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />
        <ProductGrid products={filteredProducts} />
        <BuyingGuides />
        <Newsletter />
      </main>
      <Footer />
    </div>
  );
}
