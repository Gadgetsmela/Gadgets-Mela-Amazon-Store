import { Mail, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { SEGMENT_TAGS, subscribeToDeals } from '../services/dealMarketing.js';

export default function Newsletter() {
  const [form, setForm] = useState({ name: '', email: '', tags: ['Mobile gadgets', 'Audio'], consent: false });
  const [status, setStatus] = useState('idle');

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus('loading');
    try {
      await subscribeToDeals(form);
      setStatus('success');
      setForm({ name: '', email: '', tags: form.tags, consent: true });
    } catch {
      setStatus('error');
    }
  }

  function toggleTag(tag) {
    setForm((current) => ({
      ...current,
      tags: current.tags.includes(tag) ? current.tags.filter((item) => item !== tag) : [...current.tags, tag],
    }));
  }

  return (
    <section className="newsletter" id="newsletter" aria-labelledby="newsletter-title">
      <div>
        <p className="eyebrow">Never miss a useful deal</p>
        <h2 id="newsletter-title">Get daily Amazon deals and weekly gadget digests.</h2>
        <p>No spam, just trending gadgets, price-drop alerts, flash sale products, and Amazon festival picks with one-click unsubscribe.</p>
      </div>
      <form onSubmit={handleSubmit}>
        <label htmlFor="subscriber-name">Name</label>
        <input id="subscriber-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Your name" />
        <label htmlFor="email"><Mail size={18} /> Email address</label>
        <div className="newsletter-row">
          <input id="email" type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" />
          <button type="submit" disabled={status === 'loading'}>{status === 'loading' ? 'Saving...' : 'Notify me'}</button>
        </div>
        <div className="segment-chips newsletter-tags">
          {SEGMENT_TAGS.map((tag) => <button key={tag} type="button" className={form.tags.includes(tag) ? 'active' : ''} onClick={() => toggleTag(tag)}>{tag}</button>)}
        </div>
        <label className="consent-row"><input type="checkbox" checked={form.consent} onChange={(event) => setForm({ ...form, consent: event.target.checked })} /> <ShieldCheck size={16} /> I agree to receive Gadgets Mela deal alerts and can unsubscribe anytime.</label>
        {status === 'success' && <p className="deal-form-message success">Deal alerts activated.</p>}
        {status === 'error' && <p className="deal-form-message error">Please enter a valid email and consent.</p>}
      </form>
    </section>
  );
}
