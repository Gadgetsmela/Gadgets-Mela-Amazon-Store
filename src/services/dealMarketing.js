import { getAffiliateUrl } from '../utils/affiliate.js';

export const SUBSCRIBER_STORAGE_KEY = 'gadgets-mela-subscribers-v1';
export const ANALYTICS_STORAGE_KEY = 'gadgets-mela-deal-analytics-v1';
export const CAMPAIGN_STORAGE_KEY = 'gadgets-mela-campaigns-v1';

export const SEGMENT_TAGS = [
  'Mobile gadgets',
  'Smart home',
  'Gaming',
  'Audio',
  'Kitchen gadgets',
];

const defaultAnalytics = {
  popupImpressions: 0,
  exitIntentImpressions: 0,
  subscriptions: 0,
  emailClicks: 0,
  affiliateClicks: 0,
  opens: 0,
  productClicks: {},
  whatsappClicks: 0,
  productShares: {},
  telegramClicks: 0,
  instagramSourceClicks: 0,
  recentViews: {},
  dailyHotProducts: {},
  categoryClicks: {},
  countryWhatsAppClicks: {},
  whatsappSourceClicks: {},
};

function readJson(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  if (typeof window === 'undefined') return value;
  window.localStorage.setItem(key, JSON.stringify(value));
  return value;
}

export function getSubscribers() {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(window.localStorage.getItem(SUBSCRIBER_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveSubscribers(subscribers) {
  return writeJson(SUBSCRIBER_STORAGE_KEY, subscribers);
}

export function getMarketingAnalytics() {
  return readJson(ANALYTICS_STORAGE_KEY, defaultAnalytics);
}

export function saveMarketingAnalytics(analytics) {
  return writeJson(ANALYTICS_STORAGE_KEY, { ...defaultAnalytics, ...analytics });
}

export function trackMarketingEvent(eventName, payload = {}) {
  const analytics = getMarketingAnalytics();
  const next = { ...analytics };

  if (eventName === 'productClick' && payload.productId) {
    next.productClicks = { ...next.productClicks, [payload.productId]: (next.productClicks?.[payload.productId] || 0) + 1 };
    if (payload.category) {
      next.categoryClicks = { ...next.categoryClicks, [payload.category]: (next.categoryClicks?.[payload.category] || 0) + 1 };
    }
    const today = new Date().toISOString().slice(0, 10);
    const todaysHotProducts = next.dailyHotProducts?.[today] || {};
    next.dailyHotProducts = { ...next.dailyHotProducts, [today]: { ...todaysHotProducts, [payload.productId]: (todaysHotProducts[payload.productId] || 0) + 1 } };
  }

  if (eventName === 'productView' && payload.productId) {
    next.recentViews = { ...next.recentViews, [payload.productId]: (next.recentViews?.[payload.productId] || 0) + 1 };
  }

  if (eventName === 'telegramClick') next.telegramClicks = (next.telegramClicks || 0) + 1;
  if (eventName === 'instagramClick') next.instagramSourceClicks = (next.instagramSourceClicks || 0) + 1;

  if (eventName === 'whatsappClick') {
    next.whatsappClicks = (next.whatsappClicks || 0) + 1;
    if (payload.productId) {
      next.productShares = { ...next.productShares, [payload.productId]: (next.productShares?.[payload.productId] || 0) + 1 };
    }
    if (payload.country) {
      next.countryWhatsAppClicks = { ...next.countryWhatsAppClicks, [payload.country]: (next.countryWhatsAppClicks?.[payload.country] || 0) + 1 };
    }
    if (payload.source) {
      next.whatsappSourceClicks = { ...next.whatsappSourceClicks, [payload.source]: (next.whatsappSourceClicks?.[payload.source] || 0) + 1 };
    }
  }

  const counterMap = {
    popupImpression: 'popupImpressions',
    exitIntentImpression: 'exitIntentImpressions',
    subscribe: 'subscriptions',
    emailClick: 'emailClicks',
    affiliateClick: 'affiliateClicks',
    emailOpen: 'opens',
  };

  if (counterMap[eventName]) next[counterMap[eventName]] = (next[counterMap[eventName]] || 0) + 1;
  saveMarketingAnalytics(next);
  window.dispatchEvent(new globalThis.CustomEvent('gadgets-mela-analytics', { detail: { eventName, payload, analytics: next } }));
  return next;
}

export async function subscribeToDeals({ name, email, tags = [], country = 'IN', consent = false }) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) throw new Error('Enter a valid email address.');
  if (!consent) throw new Error('Please accept the privacy consent to subscribe.');

  const subscriber = {
    id: `gm-sub-${Date.now()}`,
    name: String(name || '').trim() || 'Gadget Lover',
    email: normalizedEmail,
    tags,
    country,
    createdAt: new Date().toISOString(),
    unsubscribedAt: null,
    source: 'popup',
  };

  const response = await fetch('/api/subscribers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscriber),
  }).catch(() => null);

  if (response?.ok) {
    const saved = await response.json();
    trackMarketingEvent('subscribe', { email: normalizedEmail, provider: saved.provider || 'api' });
    return saved.subscriber || subscriber;
  }

  const subscribers = getSubscribers();
  const existingIndex = subscribers.findIndex((item) => item.email === normalizedEmail);
  const nextSubscribers = existingIndex >= 0
    ? subscribers.map((item, index) => (index === existingIndex ? { ...item, ...subscriber, id: item.id, createdAt: item.createdAt } : item))
    : [subscriber, ...subscribers];

  saveSubscribers(nextSubscribers);
  trackMarketingEvent('subscribe', { email: normalizedEmail, provider: 'localStorage' });
  return subscriber;
}

export async function unsubscribeFromDeals(email) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const subscribers = getSubscribers().map((subscriber) => (
    subscriber.email === normalizedEmail ? { ...subscriber, unsubscribedAt: new Date().toISOString() } : subscriber
  ));
  saveSubscribers(subscribers);
  await fetch(`/api/subscribers?email=${encodeURIComponent(normalizedEmail)}`, { method: 'DELETE' }).catch(() => null);
  return subscribers;
}

export function getEmailMarketingStats(products = []) {
  const subscribers = getSubscribers();
  const activeSubscribers = subscribers.filter((subscriber) => !subscriber.unsubscribedAt);
  const analytics = getMarketingAnalytics();
  const topClickedProducts = Object.entries(analytics.productClicks || {})
    .map(([productId, clicks]) => ({ product: products.find((item) => item.id === productId), productId, clicks }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 5);
  const topSharedProducts = Object.entries(analytics.productShares || {})
    .map(([productId, shares]) => ({ product: products.find((item) => item.id === productId), productId, shares }))
    .sort((a, b) => b.shares - a.shares)
    .slice(0, 5);

  return {
    totalSubscribers: activeSubscribers.length,
    openRate: activeSubscribers.length ? Math.min(72, Math.round((analytics.opens / activeSubscribers.length) * 100)) : 0,
    clickRate: activeSubscribers.length ? Math.min(48, Math.round(((analytics.emailClicks + analytics.affiliateClicks) / activeSubscribers.length) * 100)) : 0,
    conversionRate: analytics.popupImpressions ? Math.round((analytics.subscriptions / analytics.popupImpressions) * 100) : 0,
    analytics,
    subscribers,
    topClickedProducts,
    topSharedProducts,
  };
}

export function exportSubscribersCsv() {
  const header = ['name', 'email', 'tags', 'country', 'createdAt', 'unsubscribedAt'];
  const rows = getSubscribers().map((subscriber) => header.map((field) => `"${String(Array.isArray(subscriber[field]) ? subscriber[field].join('|') : subscriber[field] || '').replaceAll('"', '""')}"`).join(','));
  return [header.join(','), ...rows].join('\n');
}

export function createCampaignPlan(products = [], countryCode = 'IN') {
  const ranked = [...products].sort((a, b) => ((b.originalPriceINR || 0) - (b.priceINR || 0)) - ((a.originalPriceINR || 0) - (a.priceINR || 0)));
  return [
    { id: 'deal-of-the-day', cadence: 'Daily at 09:00', title: 'Deal of the Day', products: ranked.slice(0, 1), segment: 'All subscribers' },
    { id: 'daily-deals', cadence: 'Daily at 18:00', title: 'Trending gadgets + flash deals', products: ranked.slice(0, 4), segment: 'Deal hunters' },
    { id: 'weekly-digest', cadence: 'Sunday at 10:00', title: 'Weekly top gadgets digest', products: ranked.slice(0, 6), segment: 'All subscribers' },
    { id: 'festival-sale', cadence: 'Campaign triggered manually', title: 'Amazon festival sale campaign', products: ranked.filter((product) => product.featured).slice(0, 6), segment: 'Festival buyers' },
  ].map((campaign) => ({
    ...campaign,
    previewHtml: buildDealEmailTemplate({ title: campaign.title, products: campaign.products, countryCode }),
  }));
}

export function buildDealEmailTemplate({ title = 'Gadgets Mela Deal Alert', products = [], countryCode = 'IN', unsubscribeUrl = '{{unsubscribe_url}}' }) {
  const cards = products.map((product) => `
    <tr>
      <td style="padding:14px;border:1px solid rgba(251,146,60,.28);border-radius:18px;background:#111827;display:block;margin-bottom:14px">
        <h3 style="margin:0 0 8px;color:#fff;font-size:18px">${product.name}</h3>
        <p style="margin:0 0 14px;color:#cbd5e1;line-height:1.55">${product.summary}</p>
        <a href="${getAffiliateUrl(product, countryCode)}&utm_source=email&utm_campaign=gadgets_mela_deals" style="display:inline-block;background:#facc15;color:#111827;padding:12px 18px;border-radius:999px;font-weight:800;text-decoration:none">View Amazon Deal</a>
      </td>
    </tr>`).join('');

  return `<!doctype html><html><body style="margin:0;background:#020617;font-family:Inter,Arial,sans-serif;color:#f8fafc"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#020617;padding:24px"><tr><td align="center"><table role="presentation" width="100%" style="max-width:640px;background:#0f172a;border:1px solid rgba(251,146,60,.28);border-radius:26px;padding:24px"><tr><td><p style="color:#fb923c;font-weight:900;letter-spacing:.12em;text-transform:uppercase">GADGETS MELA</p><h1 style="margin:0 0 12px;color:#fff;font-size:30px">${title}</h1><p style="color:#cbd5e1;line-height:1.6">Trending Amazon gadgets, flash deals, price drops, viral tech finds, smart home deals, and festival picks curated for repeat deal hunters.</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0">${cards}</table><p style="color:#94a3b8;font-size:12px;line-height:1.5">You are receiving this because you subscribed to Gadgets Mela deal alerts. <a href="${unsubscribeUrl}" style="color:#fb923c">Unsubscribe</a>.</p></td></tr></table></td></tr></table></body></html>`;
}
