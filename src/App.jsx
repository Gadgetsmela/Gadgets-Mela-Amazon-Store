import { useEffect, useMemo, useRef, useState } from 'react';
import Header from './components/Header.jsx';
import Hero from './components/Hero.jsx';
import CategoryTabs from './components/CategoryTabs.jsx';
import ProductGrid from './components/ProductGrid.jsx';
import DealStrip from './components/DealStrip.jsx';
import BuyingGuides from './components/BuyingGuides.jsx';
import Newsletter from './components/Newsletter.jsx';
import Footer from './components/Footer.jsx';
import AffiliateDisclosure from './components/AffiliateDisclosure.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';
import ProductQuickView from './components/ProductQuickView.jsx';
import TrendingProducts from './components/TrendingProducts.jsx';
import { categories } from './data/categories.js';
import { DEFAULT_COUNTRY } from './data/countries.js';
import { buildProductMeta, loadProducts, refreshProducts, saveProducts } from './services/productAutomation.js';

function upsertMeta(selector, createElement) {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = createElement();
    document.head.appendChild(element);
  }
  return element;
}

export default function App() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(DEFAULT_COUNTRY);
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState(() => loadProducts());
  const productsRef = useRef(products);
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  useEffect(() => {
    const loadingTimer = window.setTimeout(() => {
      setIsLoading(false);
    }, 850);

    return () => window.clearTimeout(loadingTimer);
  }, []);

  useEffect(() => {
    productsRef.current = products;
  }, [products]);

  useEffect(() => {
    refreshProducts(productsRef.current, selectedCountry).then((refreshedProducts) => {
      setProducts(refreshedProducts);
    });
  }, [selectedCountry]);

  useEffect(() => {
    const featuredProduct = products[0];
    if (!featuredProduct) return;

    const meta = buildProductMeta(featuredProduct, selectedCountry);
    document.title = meta.title;
    upsertMeta('meta[name="description"]', () => Object.assign(document.createElement('meta'), { name: 'description' })).content = meta.description;
    upsertMeta('meta[property="og:title"]', () => {
      const element = document.createElement('meta');
      element.setAttribute('property', 'og:title');
      return element;
    }).content = meta.title;
    upsertMeta('meta[property="og:description"]', () => {
      const element = document.createElement('meta');
      element.setAttribute('property', 'og:description');
      return element;
    }).content = meta.description;
    upsertMeta('link[rel="canonical"]', () => Object.assign(document.createElement('link'), { rel: 'canonical' })).href = meta.canonical;

    const schema = upsertMeta('script[data-product-schema="true"]', () => {
      const element = document.createElement('script');
      element.type = 'application/ld+json';
      element.dataset.productSchema = 'true';
      return element;
    });
    schema.textContent = JSON.stringify(meta.jsonLd);
  }, [products, selectedCountry]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory = activeCategory === 'All' || product.category === activeCategory;
      const matchesQuery =
        !normalizedQuery ||
        product.name.toLowerCase().includes(normalizedQuery) ||
        product.summary.toLowerCase().includes(normalizedQuery) ||
        product.asin?.toLowerCase().includes(normalizedQuery) ||
        product.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery));

      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, products, query]);

  function handleProductsChange(nextProducts) {
    setProducts(saveProducts(nextProducts));
  }

  return (
    <div className="app-shell">
      {isLoading && (
        <div className="brand-loader" role="status" aria-label="Loading Gadgets Mela store">
          <div className="brand-loader-ring">
            <img src="/brand/gm-icon.svg" alt="" width="88" height="88" aria-hidden="true" />
          </div>
          <strong>GADGETS MELA</strong>
          <span>Powering up premium automated Amazon deals...</span>
        </div>
      )}
      <Header
        query={query}
        onQueryChange={setQuery}
        selectedCountry={selectedCountry}
        onCountryChange={setSelectedCountry}
      />
      <main>
        <Hero />
        <AffiliateDisclosure />
        <DealStrip products={products} />
        <TrendingProducts products={products} selectedCountry={selectedCountry} onQuickView={setQuickViewProduct} />
        <CategoryTabs
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />
        <ProductGrid products={filteredProducts} selectedCountry={selectedCountry} isLoading={isLoading} onQuickView={setQuickViewProduct} />
        <AdminDashboard products={products} selectedCountry={selectedCountry} onProductsChange={handleProductsChange} />
        <BuyingGuides />
        <Newsletter />
      </main>
      <Footer />
      <ProductQuickView product={quickViewProduct} selectedCountry={selectedCountry} onClose={() => setQuickViewProduct(null)} />
    </div>
  );
}
