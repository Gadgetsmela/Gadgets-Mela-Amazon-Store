import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import ProductCard from '../ProductCard.jsx';

export default function SwipeDeals({ products = [], selectedCountry, onQuickView }) {
  const railRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const deals = useMemo(() => products.slice(0, 8), [products]);

  if (!deals.length) return null;

  function scrollByCard(direction) {
    const rail = railRef.current;
    if (!rail) return;
    const cardWidth = rail.querySelector('.swipe-deal-card')?.getBoundingClientRect().width || rail.clientWidth * 0.86;
    rail.scrollBy({ left: direction * (cardWidth + 14), behavior: 'smooth' });
  }

  function updateActiveCard() {
    const rail = railRef.current;
    if (!rail) return;
    const cardWidth = rail.querySelector('.swipe-deal-card')?.getBoundingClientRect().width || 1;
    setActiveIndex(Math.round(rail.scrollLeft / (cardWidth + 14)));
  }

  return (
    <section className="swipe-deals-section" id="deals" aria-labelledby="swipe-deals-title">
      <div className="swipe-deals-head">
        <div>
          <p className="eyebrow"><Sparkles size={14} /> Swipe picks</p>
          <h2 id="swipe-deals-title">Touch-first hot deals</h2>
        </div>
        <div className="swipe-controls" aria-label="Swipe deal controls">
          <button type="button" onClick={() => scrollByCard(-1)} aria-label="Previous deal"><ChevronLeft size={18} /></button>
          <button type="button" onClick={() => scrollByCard(1)} aria-label="Next deal"><ChevronRight size={18} /></button>
        </div>
      </div>
      <div className="swipe-deals-rail" ref={railRef} onScroll={updateActiveCard}>
        {deals.map((product, index) => (
          <div className="swipe-deal-card" key={product.id}>
            <ProductCard product={product} selectedCountry={selectedCountry} onQuickView={onQuickView} priority={index < 2} source="swipe-deals" />
          </div>
        ))}
      </div>
      <div className="swipe-indicators" aria-hidden="true">
        {deals.map((product, index) => <span key={product.id} className={activeIndex === index ? 'is-active' : ''} />)}
      </div>
    </section>
  );
}
