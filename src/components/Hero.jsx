import { ArrowRight, Database, ShieldCheck, Star, Zap } from 'lucide-react';

const highlights = [
  { icon: Star, label: 'Live 4★+ Amazon gadgets' },
  { icon: Zap, label: 'PA API product automation' },
  { icon: Database, label: 'Database-backed imports' },
  { icon: ShieldCheck, label: 'Clear affiliate disclosure' },
];

export default function Hero() {
  return (
    <section className="hero" id="top">
      <div className="hero-copy">
        <p className="eyebrow">Automated Amazon affiliate platform</p>
        <h1>Discover live tech deals without endless scrolling.</h1>
        <p className="hero-text">
          Gadgets Mela now imports Amazon products by PA API search, ASIN, wishlist, or URL; syncs prices and ratings daily; and generates affiliate-ready deal pages for mobile-first shoppers.
        </p>
        <div className="hero-actions">
          <a className="primary-button" href="#deals">
            Explore top picks <ArrowRight size={18} />
          </a>
          <a className="secondary-button" href="#admin">Open admin automation</a>
        </div>
        <div className="hero-highlights" aria-label="Store highlights">
          {highlights.map(({ icon: Icon, label }) => (
            <span key={label}><Icon size={16} /> {label}</span>
          ))}
        </div>
      </div>
      <div className="hero-card" aria-label="Featured gadget bundle">
        <div className="floating-badge">Best Deal Engine</div>
        <div className="gadget-stack">
          <span>🎧</span>
          <span>📱</span>
          <span>🎮</span>
          <span>🏠</span>
        </div>
        <h2>Daily Auto Sync</h2>
        <p>Prices + ratings + discounts + badges</p>
        <strong>Save up to 35%</strong>
      </div>
    </section>
  );
}
