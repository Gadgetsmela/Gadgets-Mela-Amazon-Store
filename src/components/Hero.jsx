import { ArrowRight, ShieldCheck, Star, Zap } from 'lucide-react';

const highlights = [
  { icon: Star, label: 'Curated 4★+ gadgets' },
  { icon: Zap, label: 'Fast deal discovery' },
  { icon: ShieldCheck, label: 'Clear affiliate disclosure' },
];

export default function Hero() {
  return (
    <section className="hero" id="top">
      <div className="hero-copy">
        <p className="eyebrow">Daily gadget finds for smart shoppers</p>
        <h1>Discover Amazon tech deals without endless scrolling.</h1>
        <p className="hero-text">
          Gadgets Mela curates useful electronics, mobile accessories, smart home upgrades, and creator desk gear so you can buy with confidence.
        </p>
        <div className="hero-actions">
          <a className="primary-button" href="#deals">
            Explore top picks <ArrowRight size={18} />
          </a>
          <a className="secondary-button" href="#guides">Read buying guides</a>
        </div>
        <div className="hero-highlights" aria-label="Store highlights">
          {highlights.map(({ icon: Icon, label }) => (
            <span key={label}><Icon size={16} /> {label}</span>
          ))}
        </div>
      </div>
      <div className="hero-card" aria-label="Featured gadget bundle">
        <div className="floating-badge">Festival Tech Picks</div>
        <div className="gadget-stack">
          <span>🎧</span>
          <span>📱</span>
          <span>⌚</span>
          <span>🔋</span>
        </div>
        <h2>Starter Smart Kit</h2>
        <p>Speaker + charger + tracker + headphones</p>
        <strong>Save up to 35%</strong>
      </div>
    </section>
  );
}
