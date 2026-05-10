import { MessageCircle, Send } from 'lucide-react';
import { DEFAULT_COUNTRY } from '../data/countries.js';
import { trackMarketingEvent } from '../services/dealMarketing.js';
import { buildProductSharePayload, getWhatsAppSettings } from '../utils/whatsapp.js';

export default function WhatsAppShareActions({ product, selectedCountry = DEFAULT_COUNTRY, source = 'card', compact = false }) {
  const settings = getWhatsAppSettings();
  const payload = buildProductSharePayload(product, selectedCountry, settings);

  function getEffectiveSource() {
    if (typeof window !== 'undefined' && product?.id && window.location.hash === `#product-${product.id}`) {
      return 'product page';
    }
    return source;
  }

  function trackWhatsApp(action = 'share') {
    trackMarketingEvent('whatsappClick', {
      productId: product?.id,
      productName: product?.name,
      country: selectedCountry,
      source: getEffectiveSource(),
      action,
    });
  }

  return (
    <div className={`whatsapp-share-system ${compact ? 'compact' : ''}`} aria-label={`WhatsApp actions for ${product?.name || 'deal'}`}>
      <a className="whatsapp-buy-button" href={payload.whatsappUrl} target="_blank" rel="noreferrer noopener" onClick={() => trackWhatsApp('buy-via-whatsapp')}>
        <MessageCircle size={16} /> Buy via WhatsApp
      </a>
      <a className="whatsapp-send-button" href={payload.whatsappUrl} target="_blank" rel="noreferrer noopener" onClick={() => trackWhatsApp('send-deal')}>
        <Send size={16} /> Send Deal to WhatsApp
      </a>
    </div>
  );
}
