import { ArrowRight, Flame, Headphones, Smartphone, Tag, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

const slides = [
  {
    kicker: 'Hot Deals',
    title: 'Fresh Amazon gadget deals, curated for smart shoppers.',
    text: 'Find limited-time tech picks with bold discounts, clean pricing, and affiliate buy links that take you straight to Amazon.',
    icon: Flame,
    accent: 'orange',
    visual: '🔥',
  },
  {
    kicker: 'Smart Gadgets',
    title: 'Upgrade your desk, home, and everyday carry.',
    text: 'Discover premium smart-home devices, mini tech, speakers, wearables, and accessories in one mobile-first deals feed.',
    icon: Zap,
    accent: 'green',
    visual: '⚡',
  },
  {
    kicker: 'Mobile Accessories',
    title: 'Chargers, cables, cases, earbuds, and more.',
    text: 'Shop practical mobile essentials with quick view details and WhatsApp deal sharing built for fast decisions.',
    icon: Smartphone,
    accent: 'orange',
    visual: '📱',
  },
  {
    kicker: 'Amazon Offers',
    title: 'Tap into affiliate offers without the clutter.',
    text: 'A clean Gadgets Mela storefront focused on hot badges, product cards, and direct shopping CTAs—nothing else.',
    icon: Tag,
    accent: 'green',
    visual: '🛒',
  },
  {
    kicker: 'Audio Picks',
    title: 'Headphones and speakers that bring the vibe.',
    text: 'Browse trending audio deals in a luxury dark theme with neon WhatsApp sharing and orange Amazon CTAs.',
    icon: Headphones,
    accent: 'orange',
    visual: '🎧',
  },
];

export default function Hero() {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, 5200);

    return () => window.clearInterval(timer);
  }, []);

  const slide = slides[activeSlide];
  const Icon = slide.icon;

  return (
    <section className="hero hero-slider" id="top" aria-label="Gadgets Mela featured deal slider">
      <div className="hero-copy">
        <p className="eyebrow"><Icon size={16} /> {slide.kicker}</p>
        <h1>{slide.title}</h1>
        <p className="hero-text">{slide.text}</p>
        <div className="hero-actions">
          <a className="primary-button" href="#deals">
            Shop Deals <ArrowRight size={18} />
          </a>
        </div>
        <div className="hero-dots" role="tablist" aria-label="Featured deal slides">
          {slides.map((item, index) => (
            <button
              key={item.kicker}
              type="button"
              className={index === activeSlide ? 'is-active' : ''}
              onClick={() => setActiveSlide(index)}
              aria-label={`Show ${item.kicker} slide`}
              aria-selected={index === activeSlide}
            />
          ))}
        </div>
      </div>
      <div className={`hero-card hero-slide-card accent-${slide.accent}`} aria-live="polite">
        <div className="floating-badge">{slide.kicker}</div>
        <div className="hero-visual" aria-hidden="true">{slide.visual}</div>
        <h2>Gadgets Mela Deals</h2>
        <p>Black • Neon Orange • WhatsApp Green</p>
        <strong>Shop curated Amazon offers</strong>
      </div>
    </section>
  );
}
