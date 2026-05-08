import { AlertTriangle, CheckCircle2, ClipboardList, Database, Link, RefreshCw, Search, UploadCloud, Wifi, WifiOff } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  extractAsinsFromLines,
  extractWishlistId,
  getAmazonApiStatus,
  importAmazonUrl,
  importAsins,
  importWishlist,
  importWishlistFallback,
  refreshProducts,
  searchAmazonProducts,
} from '../services/productAutomation.js';

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
  const [status, setStatus] = useState('Automation ready. Configure Vercel PA API env vars for live Amazon India sync.');
  const [importStatus, setImportStatus] = useState('pending');
  const [apiStatus, setApiStatus] = useState({ badge: 'ERROR', connected: false, missing: [] });
  const [lastImportSummary, setLastImportSummary] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCheckingApi, setIsCheckingApi] = useState(true);

  const wishlistId = useMemo(() => extractWishlistId(wishlistUrl), [wishlistUrl]);
  const fallbackAsins = useMemo(() => extractAsinsFromLines(fallbackInput), [fallbackInput]);

  useEffect(() => {
    let active = true;
    getAmazonApiStatus(selectedCountry)
      .then((nextStatus) => {
        if (!active) return;
        setApiStatus(nextStatus || { badge: 'ERROR', connected: false, missing: [] });
        setStatus(nextStatus?.connected
          ? `Amazon PA API connection ready for ${nextStatus.marketplace}. Imports use server-side routes only.`
          : `Amazon PA API error: missing ${nextStatus?.missing?.join(', ') || 'connection details'} in Vercel environment variables.`);
      })
      .catch((error) => {
        if (!active) return;
        setApiStatus({ badge: 'ERROR', connected: false, missing: ['API route unavailable'] });
        setStatus(error.message);
      })
      .finally(() => {
        if (active) setIsCheckingApi(false);
      });

    return () => { active = false; };
  }, [selectedCountry]);

  function mergeProducts(incoming) {
    const productsByKey = new Map(products.map((product) => [(product.asin || product.id).toUpperCase?.() || product.id, product]));
    const importedProducts = [];
    const duplicateAsins = [];

    incoming.forEach((product) => {
      const key = (product.asin || product.id).toUpperCase?.() || product.id;
      if (productsByKey.has(key)) {
        productsByKey.set(key, { ...productsByKey.get(key), ...product, importStatus: 'imported' });
        duplicateAsins.push(product.asin || product.id);
        return;
      }

      const importedProduct = { ...product, importStatus: 'imported' };
      productsByKey.set(key, importedProduct);
      importedProducts.push(importedProduct);
    });

    onProductsChange([...productsByKey.values()]);
    const duplicateCopy = duplicateAsins.length ? ` Updated ${duplicateAsins.length} existing ASIN${duplicateAsins.length === 1 ? '' : 's'}: ${duplicateAsins.join(', ')}.` : '';
    setLastImportSummary({ imported: importedProducts.length, duplicates: duplicateAsins.length });
    setImportStatus(incoming.length ? 'imported' : 'failed');
    setStatus(`${importedProducts.length} new live Amazon product${importedProducts.length === 1 ? '' : 's'} imported and stored in the server product database.${duplicateCopy}`);
  }

  async function runImport(task, fetchingMessage = 'Contacting Amazon Product Advertising API...') {
    setIsSyncing(true);
    setImportStatus('fetching');
    setStatus(fetchingMessage);
    try {
      const imported = await task();
      mergeProducts(imported);
      setApiStatus((current) => ({ ...current, badge: 'CONNECTED', connected: true, missing: [] }));
    } catch (error) {
      setImportStatus('failed');
      setApiStatus((current) => ({ ...current, badge: 'ERROR', connected: false }));
      setStatus(error.message);
    } finally {
      setIsSyncing(false);
    }
  }

  const wishlistPanel = (
    <form className="wishlist-import-card" onSubmit={(event) => { event.preventDefault(); runImport(() => importWishlist(wishlistUrl, selectedCountry), 'Fetching public Amazon wishlist safely on the server...'); }}>
      <h3><ClipboardList size={18} /> Amazon wishlist import</h3>
      <p className="admin-help">Paste a public Amazon wishlist URL. Gadgets Mela extracts ASINs server-side, enriches them through the live PA API, stores them, and returns affiliate links without exposing secret keys.</p>
      <input value={wishlistUrl} onChange={(event) => setWishlistUrl(event.target.value)} placeholder="https://www.amazon.in/hz/wishlist/ls/J23J5F6XHRWC/ref=nav_wishlist_lists_1" />
      <div className="wishlist-id-preview">
        <span>Wishlist ID</span>
        <strong>{wishlistId || 'Waiting for URL'}</strong>
      </div>
      <button type="submit" disabled={isSyncing || !wishlistId}>{isSyncing ? 'Importing...' : 'Import wishlist'}</button>
      <div className="fallback-panel" aria-label="Wishlist import fallback">
        <h4><AlertTriangle size={16} /> Blocked or private wishlist fallback</h4>
        <p>When Amazon blocks direct wishlist access or the list is private, paste product URLs or ASINs line-by-line below.</p>
        <textarea value={fallbackInput} onChange={(event) => setFallbackInput(event.target.value)} placeholder={`https://www.amazon.in/dp/B09B8V1LZ3\nB0B7B9V7H8`} />
        <small>{fallbackAsins.length} ASIN{fallbackAsins.length === 1 ? '' : 's'} detected</small>
        <button type="button" disabled={isSyncing || !fallbackAsins.length} onClick={() => runImport(() => importWishlistFallback(fallbackInput, selectedCountry), 'Fetching fallback ASIN details through Amazon PA API...')}>{isSyncing ? 'Importing...' : 'Import fallback products'}</button>
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
        <span>{products.length} live products stored in database</span>
        <span className={`api-status ${apiStatus.connected ? 'connected' : 'error'}`}>
          {apiStatus.connected ? <Wifi size={14} /> : <WifiOff size={14} />}
          {isCheckingApi ? 'CHECKING' : apiStatus.badge}
        </span>
        <span className={`import-status ${importStatus}`}><CheckCircle2 size={14} /> {importStatusCopy[importStatus]}</span>
        <strong>{status}</strong>
        {lastImportSummary && <em>{lastImportSummary.imported} new · {lastImportSummary.duplicates} refreshed</em>}
      </div>
      <div className="admin-grid">
        {wishlistPanel}

        {!wishlistOnly && (
          <>
            <form onSubmit={(event) => { event.preventDefault(); runImport(() => searchAmazonProducts(keywords, selectedCountry)); }}>
              <h3><Search size={18} /> Keyword search/import</h3>
              <input value={keywords} onChange={(event) => setKeywords(event.target.value)} placeholder="Search Amazon keywords" />
              <button type="submit" disabled={isSyncing || !keywords.trim()}>{isSyncing ? 'Fetching...' : 'Fetch live products'}</button>
            </form>

            <form onSubmit={(event) => { event.preventDefault(); runImport(() => importAsins(asinInput, selectedCountry)); }}>
              <h3><UploadCloud size={18} /> ASIN bulk import</h3>
              <textarea value={asinInput} onChange={(event) => setAsinInput(event.target.value)} placeholder={`B09B8V1LZ3\nB0B7B9V7H8`} />
              <button type="submit" disabled={isSyncing || !extractAsinsFromLines(asinInput).length}>{isSyncing ? 'Importing...' : 'Import ASINs'}</button>
            </form>

            <form onSubmit={(event) => { event.preventDefault(); runImport(() => importAmazonUrl(amazonUrl, selectedCountry)); }}>
              <h3><Link size={18} /> Add by Amazon URL</h3>
              <input value={amazonUrl} onChange={(event) => setAmazonUrl(event.target.value)} placeholder="https://www.amazon.in/dp/ASIN" />
              <button type="submit" disabled={isSyncing || !amazonUrl.trim()}>{isSyncing ? 'Generating...' : 'Generate affiliate deal'}</button>
            </form>

            <div className="automation-card">
              <h3><RefreshCw size={18} /> Daily auto-refresh</h3>
              <p>Prices, MRP, discounts, ratings, reviews, availability, brands, categories, gallery images, affiliate URLs, and Product schema refresh through server-side PA API routes.</p>
              <button type="button" onClick={() => runImport(async () => refreshProducts(products, selectedCountry, true), 'Refreshing stored products with live Amazon data...')} disabled={isSyncing || !products.length}>{isSyncing ? 'Refreshing...' : 'Force refresh now'}</button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
