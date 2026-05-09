import { MessageCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { trackMarketingEvent } from '../services/dealMarketing.js';
import { getWhatsAppSettings } from '../utils/whatsapp.js';

export default function WhatsAppChannelCTA({ selectedCountry }) {
  const [settings, setSettings] = useState(() => getWhatsAppSettings());

  useEffect(() => {
    const refreshSettings = () => setSettings(getWhatsAppSettings());
    window.addEventListener('gadgets-mela-whatsapp-settings', refreshSettings);
    window.addEventListener('storage', refreshSettings);
    return () => {
      window.removeEventListener('gadgets-mela-whatsapp-settings', refreshSettings);
      window.removeEventListener('storage', refreshSettings);
    };
  }, []);

  const joinLink = useMemo(() => {
    if (settings.whatsappChannelLink?.startsWith('http')) return settings.whatsappChannelLink;
    if (settings.whatsappGroupLink?.startsWith('http')) return settings.whatsappGroupLink;
    return '';
  }, [settings.whatsappChannelLink, settings.whatsappGroupLink]);

  if (!joinLink) return null;

  return (
    <section className="whatsapp-channel-section" aria-labelledby="whatsapp-channel-title">
      <div>
        <p className="eyebrow">WhatsApp viral deals</p>
        <h2 id="whatsapp-channel-title">Join our WhatsApp Deals Channel</h2>
        <p>Get mobile-first Amazon gadget deal alerts, family-group share messages, and quick affiliate links curated by GADGETS MELA.</p>
      </div>
      <a href={joinLink} target="_blank" rel="noreferrer noopener" onClick={() => trackMarketingEvent('whatsappClick', { country: selectedCountry, source: 'channel CTA', action: 'join-now' })}>
        <MessageCircle size={18} /> Join Now
      </a>
    </section>
  );
}
