import { ArrowRight, Flame, Gamepad2, Gift, Headphones, Smartphone, Zap } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const slides = [
  {
    kicker: 'Hot Amazon Deals',
    title: 'Luxury gadget deals with Amazon-speed shopping.',
    text: 'A premium affiliate storefront for limited-time tech offers, clean pricing, quick view, and one-tap Amazon checkout.',
    icon: Flame,
    accent: 'orange',
    visual: '🔥',
  },
  {
    kicker: 'Smart Gadgets Sale',
    title: 'Upgrade home, desk, and everyday carry in style.',
    text: 'Discover smart speakers, desk tech, storage, travel chargers, and mini gadgets in a modern mobile shopping feed.',
    icon: Zap,
    accent: 'green',
    visual: '⚡',
  },
  {
    kicker: 'Gaming Accessories',
    title: 'Console, RGB, audio, and creator gear that feels premium.',
    text: 'Swipe through gaming-ready accessories with neon CTAs, deal badges, and WhatsApp sharing for fast recommendations.',
    icon: Gamepad2,
    accent: 'orange',
    visual: '🎮',
  },
  {
    kicker: 'Mobile Accessories',
    title: 'Chargers, power banks, cases, earbuds, and more.',
    text: 'Shop practical mobile essentials with responsive cards, lazy-loaded images, and direct affiliate links to Amazon.',
    icon: Smartphone,
    accent: 'green',
    visual: '📱',
  },
  {
    kicker: 'Festival Deals',
    title: 'Festive tech finds curated for every gift list.',
    text: 'Browse celebration-ready Amazon finds for family, creators, gamers, and smart-home lovers—without public admin clutter.',
    icon: Gift,
    accent: 'orange',
    visual: '🎁',
  },
];

export default function Hero() {
  const [activeSlide, setActiveSlide] = useState(0);
  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, 4800);

    return () => window.clearInterval(timer);
  }, []);

  function showSlide(index) {
    setActiveSlide((index + slides.length) % slides.length);
  }

  function handleTouchStart(event) {
    touchStartX.current = event.touches[0].clientX;
    touchDeltaX.current = 0;
  }

  function handleTouchMove(event) {
    touchDeltaX.current = event.touches[0].clientX - touchStartX.current;
  }

  function handleTouchEnd() {
    if (Math.abs(touchDeltaX.current) < 42) return;
    showSlide(activeSlide + (touchDeltaX.current < 0 ? 1 : -1));
  }

  const slide = slides[activeSlide];
  const Icon = slide.icon;

  return (
    <section
      className="hero hero-slider"
      id="top"
      aria-label="Gadgets Mela featured deal slider"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="hero-copy" key={slide.kicker}>
        <p className="eyebrow"><Icon size={16} /> {slide.kicker}</p>
        <h1>{slide.title}</h1>
        <p className="hero-text">{slide.text}</p>
        <div className="hero-actions">
          <a className="primary-button neon-cta" href="#deals">
            Shop Hot Deals <ArrowRight size={18} />
          </a>
          <a className="secondary-button" href="#whatsapp-deals">
            <Headphones size={18} /> WhatsApp Deals
          </a>
        </div>
        <div className="hero-dots" role="tablist" aria-label="Featured deal slides">
          {slides.map((item, index) => (
            <button
              key={item.kicker}
              type="button"
              className={index === activeSlide ? 'is-active' : ''}
              onClick={() => showSlide(index)}
              aria-label={`Show ${item.kicker} slide`}
              aria-selected={index === activeSlide}
            />
          ))}
        </div>
      </div>
      <div className={`hero-card hero-slide-card accent-${slide.accent}`} key={`${slide.kicker}-card`} aria-live="polite">
        <div className="floating-badge">{slide.kicker}</div>
        <div className="hero-visual" aria-hidden="true">{slide.visual}</div>
        <h2>Amazon + Croma energy</h2>
        <p>Matte black • Neon orange • WhatsApp green</p>
        <strong>Curated affiliate offers, no public admin tools</strong>
      </div>
    </section>
  );
}
