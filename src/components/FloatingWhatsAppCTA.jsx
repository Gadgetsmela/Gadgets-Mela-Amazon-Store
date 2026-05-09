import { MessageCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { trackMarketingEvent } from '../services/dealMarketing.js';
import { buildFloatingWhatsAppUrl, getWhatsAppSettings } from '../utils/whatsapp.js';

export default function FloatingWhatsAppCTA({ selectedCountry }) {
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

  if (!settings.floatingCtaEnabled) return null;

  return (
    <a
      className="floating-whatsapp-cta"
      href={buildFloatingWhatsAppUrl(settings)}
      target="_blank"
      rel="noreferrer noopener"
      onClick={() => trackMarketingEvent('whatsappClick', { country: selectedCountry, source: 'floating CTA', action: 'get-deals' })}
    >
      <MessageCircle size={18} /> 🔥 Get Deals on WhatsApp
    </a>
  );
}
