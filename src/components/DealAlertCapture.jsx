import { Bell, CheckCircle2, Mail, ShieldCheck, Sparkles, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { SEGMENT_TAGS, subscribeToDeals, trackMarketingEvent } from '../services/dealMarketing.js';

const benefits = ['Trending Amazon gadgets', 'Flash deals', 'Price drops', 'Viral tech finds', 'Smart home deals'];

export default function DealAlertCapture({ selectedCountry }) {
  const [isOpen, setIsOpen] = useState(false);
  const [variant, setVariant] = useState('timed');
  const [form, setForm] = useState({ name: '', email: '', tags: ['Smart home'], consent: false, honeypot: '' });
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [confetti, setConfetti] = useState(false);

  const countdown = useMemo(() => {
    const deadline = new Date();
    deadline.setHours(deadline.getHours() + 2, 59, 0, 0);
    return deadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, []);

  useEffect(() => {
    let hasShown = window.sessionStorage.getItem('gadgets-mela-popup-shown') === 'true';
    const openPopup = (nextVariant) => {
      if (hasShown) return;
      hasShown = true;
      window.sessionStorage.setItem('gadgets-mela-popup-shown', 'true');
      setVariant(nextVariant);
      setIsOpen(true);
      trackMarketingEvent(nextVariant === 'exit' ? 'exitIntentImpression' : 'popupImpression');
    };

    const timer = window.setTimeout(() => openPopup('timed'), 8000);
    const onScroll = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable > 0 && window.scrollY / scrollable >= 0.4) openPopup('scroll');
    };
    const onMouseLeave = (event) => {
      if (event.clientY <= 0) openPopup('exit');
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('mouseleave', onMouseLeave);
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    if (form.honeypot) return;
    setStatus('loading');
    try {
      await subscribeToDeals({ ...form, country: selectedCountry });
      setStatus('success');
      setMessage('You are in! Daily Amazon deal alerts are now enabled.');
      setConfetti(true);
      if ('Notification' in window && window.Notification.permission !== 'denied') {
        const permission = window.Notification.permission === 'granted' ? 'granted' : await window.Notification.requestPermission();
        if (permission === 'granted') new window.Notification('⚡ New Amazon deal added!', { body: 'Gadgets Mela will alert you when premium deal drops go live.' });
      }
      window.setTimeout(() => setConfetti(false), 2200);
    } catch (error) {
      setStatus('error');
      setMessage(error.message);
    }
  }

  function toggleTag(tag) {
    setForm((current) => ({
      ...current,
      tags: current.tags.includes(tag) ? current.tags.filter((item) => item !== tag) : [...current.tags, tag],
    }));
  }

  return (
    <>
      <button className="mobile-deal-bar" type="button" onClick={() => { setVariant('sticky'); setIsOpen(true); trackMarketingEvent('popupImpression', { source: 'mobile-bar' }); }}>
        <Bell size={18} /> Get Daily Deals
      </button>

      {isOpen && (
        <div className="deal-modal-backdrop" role="presentation">
          {confetti && <div className="confetti-burst" aria-hidden="true"><span /><span /><span /><span /><span /><span /></div>}
          <section className="deal-modal" role="dialog" aria-modal="true" aria-labelledby="deal-modal-title">
            <button className="deal-modal-close" type="button" aria-label="Close deal alert popup" onClick={() => setIsOpen(false)}><X size={20} /></button>
            <div className="deal-modal-copy">
              <p className="eyebrow"><Sparkles size={15} /> Premium deal alerts</p>
              <h2 id="deal-modal-title">{variant === 'exit' ? 'Wait! Get today’s top Amazon deals before you go.' : '🔥 Get Amazon Deals Daily'}</h2>
              <p>Join Gadgets Mela and receive:</p>
              <ul>
                {benefits.map((benefit) => <li key={benefit}>✅ {benefit}</li>)}
              </ul>
              <div className="deal-urgency-grid">
                <span>⏳ Today’s flash list closes at <strong>{countdown}</strong></span>
                <span>🔥 <strong>1,284</strong> gadget lovers already subscribed</span>
              </div>
            </div>
            <form className="deal-modal-form" onSubmit={handleSubmit}>
              <input value={form.honeypot} onChange={(event) => setForm({ ...form, honeypot: event.target.value })} className="hidden-field" tabIndex="-1" autoComplete="off" aria-hidden="true" />
              <label>Name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Your name" /></label>
              <label><Mail size={16} /> Email<input type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" /></label>
              <div className="segment-chips" aria-label="Deal interests">
                {SEGMENT_TAGS.map((tag) => <button key={tag} type="button" className={form.tags.includes(tag) ? 'active' : ''} onClick={() => toggleTag(tag)}>{tag}</button>)}
              </div>
              <label className="consent-row"><input type="checkbox" checked={form.consent} onChange={(event) => setForm({ ...form, consent: event.target.checked })} /> <ShieldCheck size={16} /> I consent to receive Gadgets Mela deal emails and can unsubscribe anytime.</label>
              <button type="submit" disabled={status === 'loading'}>{status === 'loading' ? 'Subscribing...' : 'Subscribe Now'}</button>
              {message && <p className={`deal-form-message ${status}`}><CheckCircle2 size={16} /> {message}</p>}
            </form>
          </section>
        </div>
      )}
    </>
  );
}
