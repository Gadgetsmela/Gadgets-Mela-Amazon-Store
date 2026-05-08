import { AlertTriangle, CheckCircle2, ClipboardList, Database, Link, RefreshCw, Search, UploadCloud } from 'lucide-react';
import { useMemo, useState } from 'react';
import { categories } from '../data/categories.js';
import { withAffiliateTag } from '../utils/affiliate.js';
import {
  extractAsinsFromLines,
  extractWishlistId,
  importAmazonUrl,
  importAsins,
  importWishlist,
  importWishlistFallback,
  refreshProducts,
  searchAmazonProducts,
} from '../services/productAutomation.js';

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

const importStatusCopy = {
  pending: 'Pending',
  fetching: 'Fetching',
  imported: 'Imported',
  failed: 'Failed',
};

export default function AdminDashboard({ products, selectedCountry, onProductsChange, wishlistOnly = false }) {
  const [asinInput, setAsinInput] = useState('');
  const [wishlistUrl, setWishlistUrl] = useState('');
  const [fallbackInput, setFallbackInput] = useState('');
  const [amazonUrl, setAmazonUrl] = useState('');
  const [keywords, setKeywords] = useState('');
  const [manualProduct, setManualProduct] = useState(emptyManualProduct);
  const [status, setStatus] = useState('Automation ready. Configure PA API env vars for live Amazon sync.');
  const [importStatus, setImportStatus] = useState('pending');
  const [lastImportSummary, setLastImportSummary] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const wishlistId = useMemo(() => extractWishlistId(wishlistUrl), [wishlistUrl]);
  const fallbackAsins = useMemo(() => extractAsinsFromLines(fallbackInput), [fallbackInput]);

  function mergeProducts(incoming) {
    const productsByKey = new Map(products.map((product) => [(product.asin || product.id).toUpperCase?.() || product.id, product]));
    const importedProducts = [];
    const duplicateAsins = [];

    incoming.forEach((product) => {
      const key = (product.asin || product.id).toUpperCase?.() || product.id;
      if (productsByKey.has(key)) {
        duplicateAsins.push(product.asin || product.id);
        return;
      }

      const importedProduct = { ...product, importStatus: 'imported' };
      productsByKey.set(key, importedProduct);
      importedProducts.push(importedProduct);
    });

    if (importedProducts.length) {
      onProductsChange([...productsByKey.values()]);
    }

    const duplicateCopy = duplicateAsins.length ? ` Skipped ${duplicateAsins.length} duplicate ASIN${duplicateAsins.length === 1 ? '' : 's'}: ${duplicateAsins.join(', ')}.` : '';
    setLastImportSummary({ imported: importedProducts.length, duplicates: duplicateAsins.length });
    setImportStatus(importedProducts.length ? 'imported' : 'failed');
    setStatus(`${importedProducts.length} new product${importedProducts.length === 1 ? '' : 's'} imported and stored in the local product database.${duplicateCopy}`);
  }

  async function runImport(task, fetchingMessage = 'Contacting Amazon Product Advertising API...') {
    setIsSyncing(true);
    setImportStatus('fetching');
    setStatus(fetchingMessage);
    try {
      const imported = await task();
      mergeProducts(imported);
    } catch (error) {
      setImportStatus('failed');
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
      availability: 'Manually added',
      importStatus: 'imported',
      tags: ['manual', manualProduct.category.toLowerCase()],
      affiliateUrl: withAffiliateTag(`https://www.amazon.in/dp/${asin}`, selectedCountry),
      updatedAt: new Date().toISOString(),
    };
    mergeProducts([product]);
    setManualProduct(emptyManualProduct);
  }

  const wishlistPanel = (
    <form className="wishlist-import-card" onSubmit={(event) => { event.preventDefault(); runImport(() => importWishlist(wishlistUrl, selectedCountry), 'Fetching public Amazon wishlist safely...'); }}>
      <h3><ClipboardList size={18} /> Amazon wishlist import</h3>
      <p className="admin-help">Paste a public Amazon wishlist URL. Gadgets Mela extracts the list ID, fetches ASINs server-side, enriches products through PA API, and generates affiliate links automatically.</p>
      <input value={wishlistUrl} onChange={(event) => setWishlistUrl(event.target.value)} placeholder="https://www.amazon.in/hz/wishlist/ls/J23J5F6XHRWC/ref=nav_wishlist_lists_1" />
      <div className="wishlist-id-preview">
        <span>Wishlist ID</span>
        <strong>{wishlistId || 'Waiting for URL'}</strong>
      </div>
      <button type="submit" disabled={isSyncing || !wishlistId}>Import wishlist</button>
      <div className="fallback-panel" aria-label="Wishlist import fallback">
        <h4><AlertTriangle size={16} /> Blocked or private wishlist fallback</h4>
        <p>When Amazon blocks direct wishlist access or the list is private, paste product URLs or ASINs line-by-line below.</p>
        <textarea value={fallbackInput} onChange={(event) => setFallbackInput(event.target.value)} placeholder={`https://www.amazon.in/dp/B09B8V1LZ3\nB0B7B9V7H8`} />
        <small>{fallbackAsins.length} ASIN{fallbackAsins.length === 1 ? '' : 's'} detected</small>
        <button type="button" disabled={isSyncing || !fallbackAsins.length} onClick={() => runImport(() => importWishlistFallback(fallbackInput, selectedCountry), 'Fetching fallback ASIN details through Amazon PA API...')}>Import fallback products</button>
      </div>
    </form>
  );

  return (
    <section className="admin-dashboard" id="admin" aria-labelledby="admin-title">
      <div className="section-heading">
        <p className="eyebrow">Affiliate automation command center</p>
        <h2 id="admin-title">{wishlistOnly ? 'Wishlist import admin' : 'Admin dashboard'}</h2>
      </div>
      <div className="admin-status">
        <Database size={18} />
        <span>{products.length} products stored in database</span>
        <span className={`import-status ${importStatus}`}><CheckCircle2 size={14} /> {importStatusCopy[importStatus]}</span>
        <strong>{status}</strong>
        {lastImportSummary && <em>{lastImportSummary.imported} new · {lastImportSummary.duplicates} duplicates skipped</em>}
      </div>
      <div className="admin-grid">
        {wishlistPanel}

        {!wishlistOnly && (
          <>
            <form onSubmit={(event) => { event.preventDefault(); runImport(() => searchAmazonProducts(keywords, selectedCountry)); }}>
              <h3><Search size={18} /> PA API search/import</h3>
              <input value={keywords} onChange={(event) => setKeywords(event.target.value)} placeholder="Search Amazon keywords" />
              <button type="submit" disabled={isSyncing}>Fetch live products</button>
            </form>

            <form onSubmit={(event) => { event.preventDefault(); runImport(() => importAsins(asinInput, selectedCountry)); }}>
              <h3><UploadCloud size={18} /> ASIN bulk import</h3>
              <textarea value={asinInput} onChange={(event) => setAsinInput(event.target.value)} placeholder={`B09B8V1LZ3\nB0B7B9V7H8`} />
              <button type="submit" disabled={isSyncing}>Import ASINs</button>
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
          </>
        )}
      </div>
    </section>
  );
}
