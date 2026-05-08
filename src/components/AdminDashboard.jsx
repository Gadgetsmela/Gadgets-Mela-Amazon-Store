import { Database, Link, RefreshCw, Search, UploadCloud } from 'lucide-react';
import { useState } from 'react';
import { categories } from '../data/categories.js';
import { withAffiliateTag } from '../utils/affiliate.js';
import { importAmazonUrl, importAsins, importWishlist, refreshProducts, searchAmazonProducts } from '../services/productAutomation.js';

const emptyManualProduct = {
  name: '',
  asin: '',
  category: 'Mobile',
  priceINR: '',
  originalPriceINR: '',
  rating: '4.5',
  summary: '',
  image: '📦',
};

export default function AdminDashboard({ products, selectedCountry, onProductsChange }) {
  const [asinInput, setAsinInput] = useState('');
  const [wishlistUrl, setWishlistUrl] = useState('');
  const [amazonUrl, setAmazonUrl] = useState('');
  const [keywords, setKeywords] = useState('');
  const [manualProduct, setManualProduct] = useState(emptyManualProduct);
  const [status, setStatus] = useState('Automation ready. Configure PA API env vars for live Amazon sync.');
  const [isSyncing, setIsSyncing] = useState(false);

  function mergeProducts(incoming) {
    const byId = new Map(products.map((product) => [product.asin || product.id, product]));
    incoming.forEach((product) => byId.set(product.asin || product.id, product));
    onProductsChange([...byId.values()]);
    setStatus(`${incoming.length} product${incoming.length === 1 ? '' : 's'} imported and stored in the local product database.`);
  }

  async function runImport(task) {
    setIsSyncing(true);
    setStatus('Contacting Amazon Product Advertising API...');
    try {
      const imported = await task();
      mergeProducts(imported);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setIsSyncing(false);
    }
  }

  function addManualProduct(event) {
    event.preventDefault();
    const priceINR = Number(manualProduct.priceINR || 0);
    const originalPriceINR = Number(manualProduct.originalPriceINR || priceINR);
    const asin = manualProduct.asin.trim() || `MANUAL${Date.now().toString().slice(-4)}`;
    const product = {
      ...manualProduct,
      id: `manual-${asin}`,
      asin,
      priceINR,
      originalPriceINR,
      priceUSD: Math.round((priceINR / 83) * 100) / 100,
      originalPriceUSD: Math.round((originalPriceINR / 83) * 100) / 100,
      priceGBP: Math.round((priceINR / 104) * 100) / 100,
      originalPriceGBP: Math.round((originalPriceINR / 104) * 100) / 100,
      priceCAD: Math.round((priceINR / 61) * 100) / 100,
      originalPriceCAD: Math.round((originalPriceINR / 61) * 100) / 100,
      rating: Number(manualProduct.rating || 4.5),
      tags: ['manual', manualProduct.category.toLowerCase()],
      affiliateUrl: withAffiliateTag(`https://www.amazon.in/dp/${asin}`, selectedCountry),
      updatedAt: new Date().toISOString(),
    };
    mergeProducts([product]);
    setManualProduct(emptyManualProduct);
  }

  return (
    <section className="admin-dashboard" id="admin" aria-labelledby="admin-title">
      <div className="section-heading">
        <p className="eyebrow">Affiliate automation command center</p>
        <h2 id="admin-title">Admin dashboard</h2>
      </div>
      <div className="admin-status">
        <Database size={18} />
        <span>{products.length} products stored in database</span>
        <strong>{status}</strong>
      </div>
      <div className="admin-grid">
        <form onSubmit={(event) => { event.preventDefault(); runImport(() => searchAmazonProducts(keywords, selectedCountry)); }}>
          <h3><Search size={18} /> PA API search/import</h3>
          <input value={keywords} onChange={(event) => setKeywords(event.target.value)} placeholder="Search Amazon keywords" />
          <button type="submit" disabled={isSyncing}>Fetch live products</button>
        </form>

        <form onSubmit={(event) => { event.preventDefault(); runImport(() => importAsins(asinInput, selectedCountry)); }}>
          <h3><UploadCloud size={18} /> ASIN bulk import</h3>
          <input value={asinInput} onChange={(event) => setAsinInput(event.target.value)} placeholder="B09B8V1LZ3, B0B7B9V7H8" />
          <button type="submit" disabled={isSyncing}>Import ASINs</button>
        </form>

        <form onSubmit={(event) => { event.preventDefault(); runImport(() => importWishlist(wishlistUrl, selectedCountry)); }}>
          <h3><Link size={18} /> Wishlist import</h3>
          <input value={wishlistUrl} onChange={(event) => setWishlistUrl(event.target.value)} placeholder="Amazon wishlist URL" />
          <button type="submit" disabled={isSyncing}>Import wishlist</button>
        </form>

        <form onSubmit={(event) => { event.preventDefault(); runImport(() => importAmazonUrl(amazonUrl, selectedCountry)); }}>
          <h3><Link size={18} /> Add by Amazon URL</h3>
          <input value={amazonUrl} onChange={(event) => setAmazonUrl(event.target.value)} placeholder="https://amazon.in/dp/ASIN" />
          <button type="submit" disabled={isSyncing}>Generate affiliate deal</button>
        </form>

        <form className="manual-form" onSubmit={addManualProduct}>
          <h3><Database size={18} /> Manual product</h3>
          <input value={manualProduct.name} onChange={(event) => setManualProduct({ ...manualProduct, name: event.target.value })} placeholder="Product name" required />
          <input value={manualProduct.asin} onChange={(event) => setManualProduct({ ...manualProduct, asin: event.target.value })} placeholder="ASIN" />
          <select value={manualProduct.category} onChange={(event) => setManualProduct({ ...manualProduct, category: event.target.value })}>
            {categories.filter((category) => category !== 'All').map((category) => <option key={category}>{category}</option>)}
          </select>
          <input value={manualProduct.priceINR} onChange={(event) => setManualProduct({ ...manualProduct, priceINR: event.target.value })} placeholder="Live price INR" type="number" required />
          <input value={manualProduct.originalPriceINR} onChange={(event) => setManualProduct({ ...manualProduct, originalPriceINR: event.target.value })} placeholder="MRP INR" type="number" />
          <textarea value={manualProduct.summary} onChange={(event) => setManualProduct({ ...manualProduct, summary: event.target.value })} placeholder="Short SEO summary" required />
          <button type="submit">Save product</button>
        </form>

        <div className="automation-card">
          <h3><RefreshCw size={18} /> Daily auto-refresh</h3>
          <p>Prices, ratings, discounts, badges, affiliate URLs, and Product schema refresh on load once every 24 hours.</p>
          <button type="button" onClick={() => runImport(async () => refreshProducts(products, selectedCountry, true))} disabled={isSyncing}>Force refresh now</button>
        </div>
      </div>
    </section>
  );
}
