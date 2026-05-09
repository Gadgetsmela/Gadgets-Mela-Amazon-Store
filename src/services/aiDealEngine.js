import { getAffiliateUrl } from '../utils/affiliate.js';
import { formatCurrency, getProductPrices } from '../utils/format.js';

export const TELEGRAM_SETTINGS_KEY = 'gadgets-mela-telegram-settings-v1';
export const CONTENT_POSTS_KEY = 'gadgets-mela-content-posts-v1';

const categoryDemand = {
  'Smart Home': 24,
  Mobiles: 23,
  Audio: 22,
  Gaming: 21,
  'Kitchen Gadgets': 20,
  Accessories: 18,
  Wearables: 18,
  Gadgets: 16,
};

const defaultCampaigns = [
  'Amazon Great Indian Festival',
  'Weekend Deals',
  'Tech Under ₹999',
  'Kitchen Finds',
  'Smart Home Week',
  'Gaming Setup Deals',
];

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function readJson(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || 'null');
    return parsed ? { ...fallback, ...parsed } : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  if (typeof window === 'undefined') return value;
  window.localStorage.setItem(key, JSON.stringify(value));
  return value;
}

export function getTelegramSettings() {
  return readJson(TELEGRAM_SETTINGS_KEY, {
    channelId: '',
    autoPostEnabled: false,
    tokenConfigured: false,
    lastPostStatus: 'Not configured',
  });
}

export function saveTelegramSettings(settings = {}) {
  return writeJson(TELEGRAM_SETTINGS_KEY, {
    channelId: settings.channelId || '',
    autoPostEnabled: Boolean(settings.autoPostEnabled),
    tokenConfigured: Boolean(settings.botToken || settings.tokenConfigured),
    lastPostStatus: settings.lastPostStatus || 'Ready',
  });
}

export function getContentPostStatus() {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(window.localStorage.getItem(CONTENT_POSTS_KEY) || '{}');
  } catch {
    return {};
  }
}

export function saveContentPostStatus(status) {
  if (typeof window !== 'undefined') window.localStorage.setItem(CONTENT_POSTS_KEY, JSON.stringify(status));
  return status;
}

export function calculateDealScore(product, analytics = {}) {
  const discount = Number(product.discountPercent || 0);
  const { price, originalPrice } = getProductPrices(product, 'IN');
  const priceDrop = Math.max(0, Number(originalPrice || 0) - Number(price || 0));
  const clicks = Number(analytics.productClicks?.[product.id] || product.clickCount || 0);
  const shares = Number(analytics.productShares?.[product.id] || product.whatsAppShares || 0);
  const recentViews = Number(analytics.recentViews?.[product.id] || product.recentViews || 0);
  const adminBoost = product.adminBoost || product.featured ? 1 : 0;
  const reviewCount = Number(product.reviewCount || 0);
  const rating = Number(product.rating || 0);

  const components = {
    discount: clamp(discount * 0.9, 0, 32),
    priceDrop: clamp(priceDrop / 75, 0, 16),
    rating: clamp((rating - 3.6) * 13, 0, 13),
    reviews: clamp(Math.log10(reviewCount + 1) * 4, 0, 14),
    demand: categoryDemand[product.category] || 14,
    clicks: clamp(clicks * 3.6, 0, 18),
    shares: clamp(shares * 4.2, 0, 18),
    views: clamp(recentViews * 1.7, 0, 12),
    boost: adminBoost ? 18 : 0,
  };

  return Math.round(Object.values(components).reduce((total, value) => total + value, 0));
}

export function assignDealLabel(product, analytics = {}) {
  const discount = Number(product.discountPercent || 0);
  const rating = Number(product.rating || 0);
  const score = calculateDealScore(product, analytics);
  const clicks = Number(analytics.productClicks?.[product.id] || product.clickCount || 0);
  const shares = Number(analytics.productShares?.[product.id] || product.whatsAppShares || 0);
  const { price } = getProductPrices(product, 'IN');

  if ((discount >= 30 && rating >= 4.2 && (clicks > 0 || product.adminBoost || product.featured)) || product.adminBoost) return 'HOT DEAL';
  if (score >= 95 || clicks + shares >= 6) return 'TRENDING';
  if (discount >= 22 && rating >= 4.1) return 'BEST VALUE';
  if (product.featured) return 'CREATOR PICK';
  if (price && price <= 999) return 'BUDGET PICK';
  return discount >= 18 ? 'LIMITED TIME' : 'CREATOR PICK';
}

export function generateProductContent(product, countryCode = 'IN') {
  const { price, originalPrice } = getProductPrices(product, countryCode);
  const priceCopy = formatCurrency(price, countryCode);
  const dropCopy = originalPrice > price ? `${product.discountPercent || 0}% OFF` : 'deal price live';
  const link = getAffiliateUrl(product, countryCode);
  const hashtags = `#GadgetsMela #AmazonDeals #TechDeals #${String(product.category || 'Gadgets').replace(/\s+/g, '')}`;
  const shortTitle = product.name.length > 72 ? `${product.name.slice(0, 69)}...` : product.name;

  return {
    instagramReelCaption: `🔥 ${shortTitle}\n${priceCopy} mein solid gadget find! ${dropCopy} — jaldi check karo before price change.\nLink bio/story mein. ${hashtags}`,
    instagramStoryText: `Aaj ka gadget steal ⚡\n${shortTitle}\n${priceCopy} • ${dropCopy}\nSwipe/DM “DEAL” now!`,
    youtubeShortsHook: `₹${price || 'deal'} wala ye gadget Amazon pe viral kyu ho raha hai? Dekho before stock khatam!`,
    whatsAppShareMessage: `🔥 Gadgets Mela HOT find: ${shortTitle}\nPrice: ${priceCopy}\nDeal: ${dropCopy}\nAmazon link: ${link}`,
    telegramPostCaption: `🔥 *${shortTitle}*\n\n💰 Price: ${priceCopy}\n🏷️ Discount: ${dropCopy}\n⭐ Rating: ${product.rating || 'Amazon'}\n\n👉 Buy now: ${link}\n\n${hashtags}`,
    pinterestPinTitle: `${shortTitle} - ${priceCopy} Amazon Gadget Deal`,
    seoMetaDescription: `${shortTitle} at ${priceCopy} on Amazon. ${dropCopy}, rating ${product.rating || 'synced'}, curated by Gadgets Mela with India and OneLink affiliate redirects.`,
    hashtags,
    affiliateLink: link,
  };
}

export function runAiDealEngine(products = [], analytics = {}, countryCode = 'IN') {
  const refreshedAt = new Date().toISOString();
  const ranked = products.map((product) => {
    const dealScore = calculateDealScore(product, analytics);
    const autoBadge = assignDealLabel(product, analytics);
    return {
      ...product,
      dealScore,
      trendingScore: dealScore,
      badge: product.badge && product.badge !== 'Best Deal' ? product.badge : autoBadge,
      autoBadge,
      bestDeal: autoBadge === 'HOT DEAL' || dealScore >= 105,
      generatedContent: generateProductContent({ ...product, dealScore, autoBadge }, countryCode),
      updatedAt: refreshedAt,
    };
  }).sort((a, b) => (b.dealScore || 0) - (a.dealScore || 0));

  return {
    products: ranked,
    sections: buildHomepageSections(ranked, analytics),
    campaigns: buildDealCampaigns(ranked, countryCode),
    refreshedAt,
  };
}

export function buildHomepageSections(products = [], analytics = {}) {
  const byScore = [...products].sort((a, b) => (b.dealScore || b.trendingScore || 0) - (a.dealScore || a.trendingScore || 0));
  const byShares = [...products].sort((a, b) => (analytics.productShares?.[b.id] || 0) - (analytics.productShares?.[a.id] || 0));
  const byAdded = [...products].sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
  const under = (amount) => byScore.filter((product) => Number(product.priceINR || 0) > 0 && Number(product.priceINR || 0) <= amount).slice(0, 6);

  return [
    { id: 'top-trending', title: 'Top 6 trending products', eyebrow: 'AI ranked', products: byScore.slice(0, 6) },
    { id: 'under-499', title: 'Best under ₹499', eyebrow: 'Budget picks', products: under(499) },
    { id: 'under-999', title: 'Best under ₹999', eyebrow: 'Viral value', products: under(999) },
    { id: 'under-1999', title: 'Best under ₹1999', eyebrow: 'Upgrade zone', products: under(1999) },
    { id: 'hot-deals', title: 'Today’s hot deals', eyebrow: 'Badge engine', products: byScore.filter((product) => product.autoBadge === 'HOT DEAL' || product.bestDeal).slice(0, 6) },
    { id: 'most-shared', title: 'Most shared products', eyebrow: 'WhatsApp demand', products: byShares.slice(0, 6) },
    { id: 'recently-added', title: 'Recently added products', eyebrow: 'Fresh cards', products: byAdded.slice(0, 6) },
  ].filter((section) => section.products.length);
}

export function buildDealCampaigns(products = [], countryCode = 'IN') {
  return defaultCampaigns.map((name) => {
    const normalized = name.toLowerCase();
    const selected = products.filter((product) => {
      const text = [product.name, product.category, product.summary, ...(product.tags || [])].join(' ').toLowerCase();
      if (normalized.includes('999')) return Number(product.priceINR || 0) <= 999;
      if (normalized.includes('kitchen')) return text.includes('kitchen');
      if (normalized.includes('smart')) return text.includes('smart');
      if (normalized.includes('gaming')) return text.includes('gaming');
      if (normalized.includes('weekend')) return product.discountPercent >= 20;
      return product.bestDeal || product.featured;
    }).slice(0, 6);

    return {
      id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name,
      products: selected.length ? selected : products.slice(0, 4),
      badge: normalized.includes('999') ? 'BUDGET PICK' : normalized.includes('festival') ? 'HOT DEAL' : 'TRENDING',
      homepageSectionTitle: name,
      captions: (selected.length ? selected : products.slice(0, 4)).map((product) => generateProductContent(product, countryCode)),
    };
  });
}

export function buildTelegramPost(product, countryCode = 'IN') {
  const content = product.generatedContent || generateProductContent(product, countryCode);
  return {
    image: product.image || product.thumbnail,
    title: product.name,
    caption: content.telegramPostCaption,
    affiliateLink: content.affiliateLink,
    hashtags: content.hashtags,
  };
}
