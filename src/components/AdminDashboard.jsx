import { AlertTriangle, BarChart3, CheckCircle2, ClipboardList, Database, Download, Edit3, ImagePlus, Link, MailCheck, RefreshCw, Search, UploadCloud, WifiOff } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { categories } from '../data/categories.js';
import {
  canCreateFallbackDeal,
  enrichProduct,
  extractAsinsFromLines,
  extractWishlistId,
  getAmazonApiStatus,
  importAmazonUrl,
  importAsins,
  isShortAmazonUrl,
  importWishlist,
  importWishlistFallback,
  refreshProducts,
  searchAmazonProducts,
} from '../services/productAutomation.js';
import { createCampaignPlan, exportSubscribersCsv, getEmailMarketingStats } from '../services/dealMarketing.js';

const importStatusCopy = {
  pending: 'Pending',
  fetching: 'Working',
  imported: 'Saved',
  failed: 'Needs input',
};

const blankProduct = {
  name: '',
  asin: '',
  brand: '',
  category: 'Gadgets',
  summary: '',
  badge: '',
  image: '',
  galleryImages: '',
  thumbnail: '',
  imageRatio: 'square',
  priceINR: '',
  originalPriceINR: '',
  priceUSD: '',
  originalPriceUSD: '',
  priceGBP: '',
  originalPriceGBP: '',
  priceCAD: '',
  originalPriceCAD: '',
  rating: '4.4',
  reviewCount: '',
  featured: true,
  availability: 'Check Amazon for current availability',
  tags: '',
};

function normalizeEditableProduct(form) {
  const tags = String(form.tags || '').split(',').map((tag) => tag.trim()).filter(Boolean);
  const galleryImages = String(form.galleryImages || '')
    .split(/[\n,]+/)
    .map((image) => image.trim())
    .filter(Boolean);

  return enrichProduct({
    ...form,
    id: form.id || (form.asin ? `asin-${form.asin.toUpperCase()}` : undefined),
    asin: form.asin.toUpperCase(),
    priceINR: Number(form.priceINR || 0),
    originalPriceINR: Number(form.originalPriceINR || 0),
    priceUSD: Number(form.priceUSD || 0),
    originalPriceUSD: Number(form.originalPriceUSD || 0),
    priceGBP: Number(form.priceGBP || 0),
    originalPriceGBP: Number(form.originalPriceGBP || 0),
    priceCAD: Number(form.priceCAD || 0),
    originalPriceCAD: Number(form.originalPriceCAD || 0),
    rating: Number(form.rating || 0),
    reviewCount: Number(form.reviewCount || 0),
    tags,
    galleryImages: [form.image, ...galleryImages].filter(Boolean),
    thumbnail: form.thumbnail || form.image,
    imageRatio: form.imageRatio || 'square',
    importStatus: 'edited',
    updatedAt: new Date().toISOString(),
  });
}

export default function AdminDashboard({ products, selectedCountry, onProductsChange, wishlistOnly = false }) {
  const [asinInput, setAsinInput] = useState('');
  const [wishlistUrl, setWishlistUrl] = useState('');
  const [fallbackInput, setFallbackInput] = useState('');
  const [amazonUrl, setAmazonUrl] = useState('');
  const [keywords, setKeywords] = useState('');
  const [editor, setEditor] = useState(blankProduct);
  const [status, setStatus] = useState('Local fallback database ready. Products render, prices display, and affiliate links redirect without PA API approval.');
  const [importStatus, setImportStatus] = useState('pending');
  const [apiStatus, setApiStatus] = useState({ badge: 'LOCAL FALLBACK', connected: false, missing: [] });
  const [lastImportSummary, setLastImportSummary] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCheckingApi, setIsCheckingApi] = useState(true);
  const [marketingStats, setMarketingStats] = useState(() => getEmailMarketingStats(products));

  const wishlistId = useMemo(() => extractWishlistId(wishlistUrl), [wishlistUrl]);
  const fallbackAsins = useMemo(() => extractAsinsFromLines(fallbackInput), [fallbackInput]);
  const asinInputAsins = useMemo(() => extractAsinsFromLines(asinInput), [asinInput]);
  const amazonUrlAsins = useMemo(() => extractAsinsFromLines(amazonUrl), [amazonUrl]);
  const canUseFallbackInput = useMemo(() => canCreateFallbackDeal(fallbackInput), [fallbackInput]);
  const canUseAmazonUrl = useMemo(() => canCreateFallbackDeal(amazonUrl), [amazonUrl]);
  const fallbackHelpText = isShortAmazonUrl(fallbackInput)
    ? 'Short link detected. Product can be saved manually.'
    : `${fallbackAsins.length} ASIN${fallbackAsins.length === 1 ? '' : 's'} detected`;
  const amazonUrlHelpText = isShortAmazonUrl(amazonUrl)
    ? 'Short link detected. Product can be saved manually.'
    : `${amazonUrlAsins.length} ASIN${amazonUrlAsins.length === 1 ? '' : 's'} detected`;
  const campaignPlans = useMemo(() => createCampaignPlan(products, selectedCountry), [products, selectedCountry]);


  useEffect(() => {
    const refreshStats = () => setMarketingStats(getEmailMarketingStats(products));
    refreshStats();
    window.addEventListener('gadgets-mela-analytics', refreshStats);
    window.addEventListener('storage', refreshStats);
    return () => {
      window.removeEventListener('gadgets-mela-analytics', refreshStats);
      window.removeEventListener('storage', refreshStats);
    };
  }, [products]);

  function downloadSubscriberCsv() {
    const blob = new globalThis.Blob([exportSubscribersCsv()], { type: 'text/csv;charset=utf-8' });
    const url = globalThis.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gadgets-mela-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    globalThis.URL.revokeObjectURL(url);
  }

  useEffect(() => {
    let active = true;
    getAmazonApiStatus(selectedCountry)
      .then((nextStatus) => {
        if (!active) return;
        setApiStatus(nextStatus || { badge: 'LOCAL FALLBACK', connected: false, missing: [] });
        setStatus(nextStatus?.connected
          ? `Optional PA API route is connected for ${nextStatus.marketplace}. Local cards remain editable.`
          : 'PA API is unavailable or disabled, so Gadgets Mela is using the production-safe local affiliate product database.');
      })
      .finally(() => {
        if (active) setIsCheckingApi(false);
      });

    return () => { active = false; };
  }, [selectedCountry]);

  function mergeProducts(incoming, successMessage = '') {
    const productsByKey = new Map(products.map((product) => [(product.asin || product.id).toUpperCase?.() || product.id, product]));
    const importedProducts = [];
    const duplicateAsins = [];

    incoming.forEach((product) => {
      const enriched = enrichProduct(product);
      const key = (enriched.asin || enriched.id).toUpperCase?.() || enriched.id;
      if (productsByKey.has(key)) {
        productsByKey.set(key, { ...productsByKey.get(key), ...enriched });
        duplicateAsins.push(enriched.asin || enriched.id);
        return;
      }

      productsByKey.set(key, enriched);
      importedProducts.push(enriched);
    });

    onProductsChange([...productsByKey.values()]);
    const duplicateCopy = duplicateAsins.length ? ` Updated ${duplicateAsins.length} existing product${duplicateAsins.length === 1 ? '' : 's'}.` : '';
    setLastImportSummary({ imported: importedProducts.length, duplicates: duplicateAsins.length });
    setImportStatus(incoming.length ? 'imported' : 'failed');
    setStatus(successMessage || `${importedProducts.length} local affiliate product${importedProducts.length === 1 ? '' : 's'} saved.${duplicateCopy}`);
  }

  async function runImport(task, fetchingMessage = 'Generating local affiliate product cards...', successMessage = '') {
    setIsSyncing(true);
    setImportStatus('fetching');
    setStatus(fetchingMessage);
    try {
      const imported = await task();
      const importedProducts = Array.isArray(imported) ? imported : [];
      const shortUrlImported = importedProducts.some((product) => product.importStatus === 'short-url');
      mergeProducts(importedProducts, shortUrlImported ? 'Short URL saved as manual affiliate deal' : successMessage);
    } catch (error) {
      setImportStatus('failed');
      setStatus(error.message);
    } finally {
      setIsSyncing(false);
    }
  }

  function saveEditorProduct(event) {
    event.preventDefault();
    if (!editor.name.trim()) {
      setImportStatus('failed');
      setStatus('Add a product title before saving the static product card.');
      return;
    }
    mergeProducts([normalizeEditableProduct(editor)], 'Product added successfully');
    setEditor(blankProduct);
  }

  function editExistingProduct(product) {
    setEditor({
      ...blankProduct,
      ...product,
      tags: (product.tags || []).join(', '),
      galleryImages: (product.galleryImages || []).join('\n'),
    });
    document.getElementById('manual-product-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function resizeImage(file, maxWidth, mimeType = 'image/webp', quality = 0.78) {
    return new Promise((resolve) => {
      const reader = new globalThis.FileReader();
      reader.addEventListener('load', () => {
        const image = new globalThis.Image();
        image.addEventListener('load', () => {
          const scale = Math.min(1, maxWidth / image.width);
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(image.width * scale);
          canvas.height = Math.round(image.height * scale);
          canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL(mimeType, quality));
        });
        image.src = reader.result;
      });
      reader.readAsDataURL(file);
    });
  }

  async function handleImageUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const [image, thumbnail] = await Promise.all([
      resizeImage(file, 960, 'image/webp', 0.82),
      resizeImage(file, 280, 'image/webp', 0.7),
    ]);
    setEditor((current) => ({
      ...current,
      image,
      thumbnail,
      galleryImages: [image, current.galleryImages].filter(Boolean).join('\n'),
    }));
  }

  const wishlistPanel = (
    <form className="wishlist-import-card" onSubmit={(event) => { event.preventDefault(); runImport(() => importWishlist(wishlistUrl, selectedCountry), 'Parsing wishlist URL, copied wishlist text, or embedded Amazon product links...'); }}>
      <h3><ClipboardList size={18} /> Wishlist parser</h3>
      <p className="admin-help">Paste a public wishlist URL, copied wishlist text, wishlist HTML, product URLs, or ASINs. The fallback parser extracts ASINs locally and creates editable affiliate cards.</p>
      <textarea value={wishlistUrl} onChange={(event) => setWishlistUrl(event.target.value)} placeholder="https://www.amazon.in/hz/wishlist/ls/J23J5F6XHRWC or pasted wishlist text with /dp/ASIN links" />
      <div className="wishlist-id-preview">
        <span>Wishlist ID</span>
        <strong>{wishlistId || 'Optional when text contains ASINs'}</strong>
      </div>
      <button type="submit" disabled={isSyncing || !wishlistUrl.trim()}>{isSyncing ? 'Parsing...' : 'Parse wishlist'}</button>
      <div className="fallback-panel" aria-label="Wishlist import fallback">
        <h4><AlertTriangle size={16} /> Manual ASIN fallback</h4>
        <p>If Amazon blocks direct wishlist access, paste one product URL or ASIN per line.</p>
        <textarea value={fallbackInput} onChange={(event) => setFallbackInput(event.target.value)} placeholder={`https://www.amazon.in/dp/B09B8V1LZ3\nB0B7B9V7H8`} />
        <small>{fallbackHelpText}</small>
        <button type="button" disabled={isSyncing || !canUseFallbackInput} onClick={() => runImport(() => importWishlistFallback(fallbackInput, selectedCountry), 'Generating local affiliate product cards...', 'Product added successfully')}>{isSyncing ? 'Importing...' : 'Create fallback products'}</button>
      </div>
    </form>
  );

  return (
    <section className="admin-dashboard" id="admin" aria-labelledby="admin-title">
      <div className="section-heading">
        <p className="eyebrow">No-PA-API affiliate command center</p>
        <h2 id="admin-title">{wishlistOnly ? 'Wishlist import admin' : 'Admin product editor'}</h2>
      </div>
      <div className="admin-status">
        <Database size={18} />
        <span>{products.length} products in local database</span>
        <span className={`api-status ${apiStatus.connected ? 'connected' : 'error'}`}>
          <WifiOff size={14} />
          {isCheckingApi ? 'CHECKING' : apiStatus.badge}
        </span>
        <span className={`import-status ${importStatus}`}><CheckCircle2 size={14} /> {importStatusCopy[importStatus]}</span>
        <strong>{status}</strong>
        {lastImportSummary && <em>{lastImportSummary.imported} new · {lastImportSummary.duplicates} updated</em>}
      </div>
      <div className="admin-grid">
        {wishlistPanel}

        {!wishlistOnly && (
          <>
            <form onSubmit={(event) => { event.preventDefault(); runImport(() => searchAmazonProducts(keywords), 'Searching local product database...'); }}>
              <h3><Search size={18} /> Local search/import</h3>
              <input value={keywords} onChange={(event) => setKeywords(event.target.value)} placeholder="Search stored products" />
              <button type="submit" disabled={isSyncing || !keywords.trim()}>{isSyncing ? 'Searching...' : 'Find local products'}</button>
            </form>

            <form onSubmit={(event) => { event.preventDefault(); runImport(() => importAsins(asinInput, selectedCountry), 'Generating local affiliate product cards...', 'Product added successfully'); }}>
              <h3><UploadCloud size={18} /> Manual ASIN import</h3>
              <textarea value={asinInput} onChange={(event) => setAsinInput(event.target.value)} placeholder={`B09B8V1LZ3\nB0B7B9V7H8`} />
              <small>{asinInputAsins.length} ASIN{asinInputAsins.length === 1 ? '' : 's'} detected</small>
              <button type="submit" disabled={isSyncing || !asinInputAsins.length}>{isSyncing ? 'Importing...' : 'Create ASIN cards'}</button>
            </form>

            <form onSubmit={(event) => { event.preventDefault(); runImport(() => importAmazonUrl(amazonUrl, selectedCountry), 'Parsing Amazon product URL locally...', 'Product added successfully'); }}>
              <h3><Link size={18} /> Add by Amazon URL</h3>
              <input value={amazonUrl} onChange={(event) => setAmazonUrl(event.target.value)} placeholder="https://www.amazon.in/dp/ASIN or https://amzn.to/deal" />
              <small>{amazonUrlHelpText}</small>
              <button type="submit" disabled={isSyncing || !canUseAmazonUrl}>{isSyncing ? 'Generating...' : 'Generate affiliate link'}</button>
            </form>

            <form id="manual-product-editor" className="manual-form" onSubmit={saveEditorProduct}>
              <h3><Edit3 size={18} /> Static product card editor</h3>
              <p className="admin-help">Create or edit production-ready cards with custom image, deal badge, MRP, live price, rating, and auto-featured status.</p>
              <div className="editor-grid">
                <input value={editor.name} onChange={(event) => setEditor({ ...editor, name: event.target.value })} placeholder="Product title" />
                <input value={editor.asin} onChange={(event) => setEditor({ ...editor, asin: event.target.value })} placeholder="ASIN (optional)" />
                <input value={editor.brand} onChange={(event) => setEditor({ ...editor, brand: event.target.value })} placeholder="Brand" />
                <select value={editor.category} onChange={(event) => setEditor({ ...editor, category: event.target.value })}>
                  {categories.filter((category) => category !== 'All').map((category) => <option key={category}>{category}</option>)}
                  <option>Gadgets</option>
                </select>
                <input value={editor.badge} onChange={(event) => setEditor({ ...editor, badge: event.target.value })} placeholder="Custom deal badge" />
                <input value={editor.tags} onChange={(event) => setEditor({ ...editor, tags: event.target.value })} placeholder="Tags, comma separated" />
                <select value={editor.imageRatio} onChange={(event) => setEditor({ ...editor, imageRatio: event.target.value })} aria-label="Image ratio">
                  <option value="square">Square product image</option>
                  <option value="vertical">Pinterest vertical 2:3</option>
                </select>
              </div>
              <textarea value={editor.summary} onChange={(event) => setEditor({ ...editor, summary: event.target.value })} placeholder="Short product summary" />
              <div className="price-editor-grid">
                <input value={editor.priceINR} onChange={(event) => setEditor({ ...editor, priceINR: event.target.value })} placeholder="India live ₹" />
                <input value={editor.originalPriceINR} onChange={(event) => setEditor({ ...editor, originalPriceINR: event.target.value })} placeholder="India MRP ₹" />
                <input value={editor.priceUSD} onChange={(event) => setEditor({ ...editor, priceUSD: event.target.value })} placeholder="USA live $" />
                <input value={editor.originalPriceUSD} onChange={(event) => setEditor({ ...editor, originalPriceUSD: event.target.value })} placeholder="USA MRP $" />
                <input value={editor.priceGBP} onChange={(event) => setEditor({ ...editor, priceGBP: event.target.value })} placeholder="UK live £" />
                <input value={editor.originalPriceGBP} onChange={(event) => setEditor({ ...editor, originalPriceGBP: event.target.value })} placeholder="UK MRP £" />
                <input value={editor.priceCAD} onChange={(event) => setEditor({ ...editor, priceCAD: event.target.value })} placeholder="Canada live C$" />
                <input value={editor.originalPriceCAD} onChange={(event) => setEditor({ ...editor, originalPriceCAD: event.target.value })} placeholder="Canada MRP C$" />
              </div>
              <div className="editor-grid">
                <input value={editor.rating} onChange={(event) => setEditor({ ...editor, rating: event.target.value })} placeholder="Rating" />
                <input value={editor.reviewCount} onChange={(event) => setEditor({ ...editor, reviewCount: event.target.value })} placeholder="Review count" />
                <input value={editor.availability} onChange={(event) => setEditor({ ...editor, availability: event.target.value })} placeholder="Availability copy" />
                <label className="checkbox-row"><input type="checkbox" checked={editor.featured} onChange={(event) => setEditor({ ...editor, featured: event.target.checked })} /> Auto feature</label>
              </div>
              <div className="editor-grid">
                <input value={editor.image} onChange={(event) => setEditor({ ...editor, image: event.target.value })} placeholder="Primary image URL or uploaded data URL" />
                <input value={editor.thumbnail} onChange={(event) => setEditor({ ...editor, thumbnail: event.target.value })} placeholder="Compressed thumbnail URL (auto-filled on upload)" />
              </div>
              <textarea value={editor.galleryImages} onChange={(event) => setEditor({ ...editor, galleryImages: event.target.value })} placeholder="Gallery image URLs, one per line" />
              <label className="image-upload"><ImagePlus size={18} /> Upload optimized WebP product image<input type="file" accept="image/*" onChange={handleImageUpload} /></label>
              {editor.image && <img className={`editor-preview ${editor.imageRatio === 'vertical' ? 'vertical' : ''}`} src={editor.image} alt="Product upload preview" />}
              <button type="submit">Save static product card</button>
            </form>


            <div className="automation-card email-command-center">
              <h3><MailCheck size={18} /> Deal alert automation</h3>
              <p>Subscriber model stores name, email, tags, country, and createdAt locally or through /api/subscribers, then syncs to Resend, Brevo, or Mailchimp when environment keys are configured.</p>
              <div className="email-metrics-grid">
                <span><strong>{marketingStats.totalSubscribers}</strong>Total subscribers</span>
                <span><strong>{marketingStats.openRate}%</strong>Open rate</span>
                <span><strong>{marketingStats.clickRate}%</strong>Click rate</span>
                <span><strong>{marketingStats.conversionRate}%</strong>Popup conversion</span>
              </div>
              <button type="button" onClick={downloadSubscriberCsv}><Download size={16} /> Export CSV</button>
            </div>

            <div className="automation-card email-command-center">
              <h3><BarChart3 size={18} /> Email + affiliate analytics</h3>
              <p>Tracks popup impressions, subscribe conversion rate, email clicks, affiliate clicks, and the top clicked product cards without blocking Core Web Vitals.</p>
              <div className="analytics-list">
                <span>Popup impressions <strong>{marketingStats.analytics.popupImpressions}</strong></span>
                <span>Exit intent impressions <strong>{marketingStats.analytics.exitIntentImpressions}</strong></span>
                <span>Email clicks <strong>{marketingStats.analytics.emailClicks}</strong></span>
                <span>Affiliate clicks <strong>{marketingStats.analytics.affiliateClicks}</strong></span>
              </div>
              <h4>Top clicked products</h4>
              {marketingStats.topClickedProducts.length ? marketingStats.topClickedProducts.map(({ product, productId, clicks }) => <span className="clicked-product" key={productId}>{product?.name || productId}<strong>{clicks}</strong></span>) : <p className="admin-help">Clicks will appear after shoppers use Amazon CTA buttons.</p>}
            </div>

            <div className="automation-card campaign-system">
              <h3><MailCheck size={18} /> Campaign system</h3>
              <p>Prepared automations for Deal of the Day, daily deal emails, weekly top gadgets digest, and Amazon festival sale blasts with dark responsive product-card templates.</p>
              {campaignPlans.map((campaign) => (
                <details key={campaign.id}>
                  <summary>{campaign.title} <span>{campaign.cadence}</span></summary>
                  <p>{campaign.segment} · {campaign.products.length} product cards ready</p>
                </details>
              ))}
            </div>

            <div className="automation-card">
              <h3><RefreshCw size={18} /> Local refresh</h3>
              <p>Refresh keeps locally edited products current without PA API calls. Affiliate buttons still redirect to India, USA, UK, or Canada Amazon with the correct tracking tag.</p>
              <button type="button" onClick={() => runImport(async () => refreshProducts(products, selectedCountry, true), 'Refreshing local product timestamps and schema data...')} disabled={isSyncing || !products.length}>{isSyncing ? 'Refreshing...' : 'Refresh local database'}</button>
            </div>

            <div className="automation-card product-editor-list">
              <h3><Edit3 size={18} /> Edit existing cards</h3>
              <p>Select any stored product to update its image, badge, prices, or copy.</p>
              {products.slice(0, 8).map((product) => <button key={product.id} type="button" onClick={() => editExistingProduct(product)}>{product.name}</button>)}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
