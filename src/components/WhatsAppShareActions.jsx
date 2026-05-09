import { Check, Copy, Link as LinkIcon, MessageCircle, Send, Users } from 'lucide-react';
import { useState } from 'react';
import { DEFAULT_COUNTRY } from '../data/countries.js';
import { trackMarketingEvent } from '../services/dealMarketing.js';
import { buildProductSharePayload, getWhatsAppSettings } from '../utils/whatsapp.js';

export default function WhatsAppShareActions({ product, selectedCountry = DEFAULT_COUNTRY, source = 'card', compact = false }) {
  const [copied, setCopied] = useState('');
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

  async function copyText(value, type) {
    await navigator.clipboard?.writeText(value);
    setCopied(type);
    trackWhatsApp(type);
    window.setTimeout(() => setCopied(''), 1600);
  }

  const copyLabel = copied === 'message' ? 'Message copied' : 'Copy WhatsApp message';
  const linkLabel = copied === 'link' ? 'Link copied' : 'Copy affiliate deal link';

  return (
    <div className={`whatsapp-share-system ${compact ? 'compact' : ''}`} aria-label={`WhatsApp share actions for ${product?.name || 'deal'}`}>
      <a className="whatsapp-buy-button" href={payload.whatsappUrl} target="_blank" rel="noreferrer noopener" onClick={() => trackWhatsApp('buy-via-whatsapp')}>
        <MessageCircle size={16} /> Buy via WhatsApp
      </a>
      <a className="whatsapp-send-button" href={payload.whatsappUrl} target="_blank" rel="noreferrer noopener" onClick={() => trackWhatsApp('send-deal')}>
        <Send size={16} /> Send Deal to WhatsApp
      </a>
      <div className="viral-share-grid">
        <a href={payload.whatsappUrl} target="_blank" rel="noreferrer noopener" onClick={() => trackWhatsApp('friends')}><Users size={15} /> Share with friends</a>
        <a href={payload.whatsappUrl} target="_blank" rel="noreferrer noopener" onClick={() => trackWhatsApp('family-group')}><MessageCircle size={15} /> Send to family group</a>
        <button type="button" onClick={() => copyText(payload.message, 'message')}>{copied === 'message' ? <Check size={15} /> : <Copy size={15} />} {copyLabel}</button>
        <button type="button" onClick={() => copyText(payload.affiliateLink, 'link')}>{copied === 'link' ? <Check size={15} /> : <LinkIcon size={15} />} {linkLabel}</button>
      </div>
    </div>
  );
}
