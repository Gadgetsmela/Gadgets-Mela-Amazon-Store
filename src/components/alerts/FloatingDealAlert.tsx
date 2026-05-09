import { Flame, ShoppingBag, TrendingUp, X, Zap } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const ALERTS = [
  { label: '🔥 Hot Deal', icon: Flame, tone: 'hot' },
  { label: '⚡ Price Dropped', icon: Zap, tone: 'drop' },
  { label: '🛒 Trending Now', icon: TrendingUp, tone: 'trend' },
];

export default function FloatingDealAlert({ products = [], onOpenProduct }) {
  const [activeIndex, setActiveIndex] = useState(-1);
  const alertProducts = useMemo(() => products.filter(Boolean).slice(0, 6), [products]);

  useEffect(() => {
    if (!alertProducts.length) return undefined;
    const firstTimer = window.setTimeout(() => setActiveIndex(0), 2600);
    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % Math.min(alertProducts.length, ALERTS.length));
    }, 9000);
    return () => {
      window.clearTimeout(firstTimer);
      window.clearInterval(interval);
    };
  }, [alertProducts.length]);

  useEffect(() => {
    if (activeIndex < 0) return undefined;
    const hideTimer = window.setTimeout(() => setActiveIndex(-1), 6200);
    return () => window.clearTimeout(hideTimer);
  }, [activeIndex]);

  if (activeIndex < 0 || !alertProducts.length) return null;

  const product = alertProducts[activeIndex % alertProducts.length];
  const alert = ALERTS[activeIndex % ALERTS.length];
  const Icon = alert.icon;

  return (
    <aside className={`floating-deal-alert tone-${alert.tone}`} role="button" tabIndex={0} onClick={() => onOpenProduct?.(product)} onKeyDown={(event) => event.key === 'Enter' && onOpenProduct?.(product)} aria-label={`Open ${product.name}`}>
      <button type="button" className="floating-deal-close" aria-label="Dismiss deal alert" onClick={(event) => { event.stopPropagation(); setActiveIndex(-1); }}>
        <X size={14} />
      </button>
      <span className="floating-deal-icon"><Icon size={18} /></span>
      <span className="floating-deal-copy">
        <strong>{alert.label}</strong>
        <em>{product.name}</em>
      </span>
      <span className="floating-deal-action"><ShoppingBag size={16} /></span>
    </aside>
  );
}
