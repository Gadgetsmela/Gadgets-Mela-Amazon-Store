import { Flame, Grid3X3, Home, Mail, Menu, MessageCircle, Sparkles, TrendingUp, X } from 'lucide-react';
import { useEffect, useState } from 'react';

const MENU_ITEMS = [
  { id: 'home', label: 'Home', href: '#home', Icon: Home },
  { id: 'categories', label: 'Categories', href: '#categories', Icon: Grid3X3 },
  { id: 'deals', label: 'Hot Deals', href: '#deals', Icon: Flame },
  { id: 'trending', label: 'Trending', href: '#trending', Icon: TrendingUp },
  { id: 'finds', label: 'Amazon Finds', href: '#finds', Icon: Sparkles },
  { id: 'whatsapp-deals', label: 'WhatsApp Deals', href: '#whatsapp-deals', Icon: MessageCircle },
  { id: 'contact', label: 'Contact', href: '#contact', Icon: Mail },
];

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeItem, setActiveItem] = useState('home');

  useEffect(() => {
    if (typeof window === 'undefined' || !window.IntersectionObserver) return undefined;

    const sections = MENU_ITEMS.map((item) => document.getElementById(item.id)).filter(Boolean);
    if (!sections.length) return undefined;

    const observer = new window.IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) setActiveItem(visible.target.id);
      },
      { rootMargin: '-28% 0px -58% 0px', threshold: [0.08, 0.2, 0.45] },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    document.body.classList.toggle('mobile-menu-open', isOpen);
    return () => document.body.classList.remove('mobile-menu-open');
  }, [isOpen]);

  function handleMenuClick(event, item) {
    event.preventDefault();
    setActiveItem(item.id);
    setIsOpen(false);
    document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <>
      <button
        className="mobile-menu-fab"
        type="button"
        aria-label={isOpen ? 'Close mobile menu' : 'Open mobile menu'}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        {isOpen ? <X size={22} /> : <Menu size={22} />}
      </button>
      <div className={`mobile-menu-backdrop ${isOpen ? 'is-open' : ''}`} onClick={() => setIsOpen(false)} aria-hidden="true" />
      <aside className={`mobile-menu-drawer ${isOpen ? 'is-open' : ''}`} aria-label="Public shopping menu">
        <div className="mobile-menu-head">
          <img src="/brand/gm-icon.svg" alt="" width="46" height="46" aria-hidden="true" />
          <div>
            <strong>GADGETS MELA</strong>
            <span>Premium Amazon finds</span>
          </div>
        </div>
        <nav className="mobile-menu-list" aria-label="Homepage sections">
          {MENU_ITEMS.map((item) => {
            const Icon = item.Icon;
            const isActive = activeItem === item.id;
            return (
              <a
                key={item.id}
                className={isActive ? 'is-active' : ''}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                onClick={(event) => handleMenuClick(event, item)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>
        <div className="mobile-menu-note">
          <span>⚡</span>
          <p>Swipe categories, quick-view products, and send deals directly to WhatsApp.</p>
        </div>
      </aside>
    </>
  );
}
