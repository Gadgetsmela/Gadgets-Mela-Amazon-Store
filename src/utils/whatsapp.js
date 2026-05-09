import { DEFAULT_COUNTRY } from '../data/countries.js';
import { getAffiliateUrl } from './affiliate.js';
import { formatCurrency, getProductPrices } from './format.js';

export const WHATSAPP_SETTINGS_KEY = 'gadgets-mela-whatsapp-settings-v1';

export const defaultWhatsAppSettings = {
  whatsappNumber: '',
  whatsappGroupLink: '',
  whatsappChannelLink: '',
  defaultShareTemplate: `🔥 Deal Alert from GADGETS MELA!\nProduct: {{title}}\nPrice: {{price}}\nDiscount: {{discount}}\nBuy here: {{affiliateLink}}\nStore: {{storeLink}}\n\nGrab it before the deal changes!`,
  floatingCtaEnabled: true,
};

export function getStoreLink() {
  if (typeof window === 'undefined') return 'https://gadgetsmela.example';
  return `${window.location.origin}${window.location.pathname}`;
}

export function getWhatsAppSettings() {
  if (typeof window === 'undefined') return defaultWhatsAppSettings;
  try {
    const saved = JSON.parse(window.localStorage.getItem(WHATSAPP_SETTINGS_KEY) || '{}');
    return { ...defaultWhatsAppSettings, ...saved };
  } catch {
    return defaultWhatsAppSettings;
  }
}

export function saveWhatsAppSettings(settings) {
  const nextSettings = { ...defaultWhatsAppSettings, ...settings };
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(WHATSAPP_SETTINGS_KEY, JSON.stringify(nextSettings));
    window.dispatchEvent(new globalThis.CustomEvent('gadgets-mela-whatsapp-settings', { detail: nextSettings }));
  }
  return nextSettings;
}

export function getDiscountLabel(product) {
  const discount = Number(product?.discountPercent || 0);
  return discount > 0 ? `${discount}% OFF` : 'Limited-time Amazon deal';
}

export function buildWhatsAppDealMessage(product, countryCode = DEFAULT_COUNTRY, template = defaultWhatsAppSettings.defaultShareTemplate) {
  const { price } = getProductPrices(product, countryCode);
  const affiliateLink = getAffiliateUrl(product, countryCode);
  const storeLink = getStoreLink();
  const values = {
    title: product?.name || 'Gadgets Mela Amazon deal',
    price: formatCurrency(price, countryCode),
    discount: getDiscountLabel(product),
    affiliateLink,
    storeLink,
  };

  return String(template || defaultWhatsAppSettings.defaultShareTemplate)
    .replaceAll('{{title}}', values.title)
    .replaceAll('{{price}}', values.price)
    .replaceAll('{{discount}}', values.discount)
    .replaceAll('{{affiliateLink}}', values.affiliateLink)
    .replaceAll('{{storeLink}}', values.storeLink);
}

export function buildWhatsAppUrl(message, whatsappNumber = '') {
  const number = String(whatsappNumber || '').replace(/[^\d]/g, '');
  const baseUrl = number ? `https://wa.me/${number}` : 'https://wa.me/';
  return `${baseUrl}?text=${encodeURIComponent(message)}`;
}

export function buildFloatingWhatsAppUrl(settings = getWhatsAppSettings()) {
  return buildWhatsAppUrl('Hi Gadgets Mela, send me today’s best Amazon deals.', settings.whatsappNumber);
}

export function buildProductSharePayload(product, countryCode = DEFAULT_COUNTRY, settings = getWhatsAppSettings()) {
  const affiliateLink = getAffiliateUrl(product, countryCode);
  const message = buildWhatsAppDealMessage(product, countryCode, settings.defaultShareTemplate);

  return {
    affiliateLink,
    message,
    whatsappUrl: buildWhatsAppUrl(message, settings.whatsappNumber),
  };
}
