import { Home, Flame, Grid3X3, MessageCircle, TrendingUp } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const NAV_ITEMS = [
  { id: 'home', label: 'Home', href: '#home', Icon: Home },
  { id: 'categories', label: 'Categories', href: '#categories', Icon: Grid3X3 },
  { id: 'trending', label: 'Trending', href: '#trending', Icon: TrendingUp },
  { id: 'deals', label: 'Hot Deals', href: '#deals', Icon: Flame },
  { id: 'whatsapp-deals', label: 'WhatsApp', href: '#whatsapp-deals', Icon: MessageCircle },
];

export default function BottomNav() {
  const [activeTab, setActiveTab] = useState('home');
  const [isHidden, setIsHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const items = useMemo(() => NAV_ITEMS, []);

  useEffect(() => {
    const sections = items
      .map((item) => document.getElementById(item.id))
      .filter(Boolean) as HTMLElement[];

    if (!sections.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) setActiveTab(visible.target.id);
      },
      { rootMargin: '-35% 0px -50% 0px', threshold: [0.08, 0.24, 0.5] },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [items]);

  useEffect(() => {
    let ticking = false;

    function updateNavVisibility() {
      const currentScrollY = window.scrollY;
      const scrollingDown = currentScrollY > lastScrollY && currentScrollY > 120;
      setIsHidden(scrollingDown);
      setLastScrollY(currentScrollY);
      ticking = false;
    }

    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(updateNavVisibility);
        ticking = true;
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [lastScrollY]);

  function handleNavClick(event, item) {
    event.preventDefault();
    setActiveTab(item.id);
    document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <nav className={`bottom-nav ${isHidden ? 'is-hidden' : ''}`} aria-label="Mobile app navigation">
      <div className="bottom-nav-dock">
        {items.map(({ id, label, href, Icon }) => {
          const isActive = activeTab === id;
          return (
            <a
              key={id}
              className={`bottom-nav-item ${isActive ? 'is-active' : ''}`}
              href={href}
              aria-current={isActive ? 'page' : undefined}
              onClick={(event) => handleNavClick(event, { id, href })}
            >
              <span className="bottom-nav-icon"><Icon size={20} strokeWidth={2.4} /></span>
              <span className="bottom-nav-label">{label}</span>
              {isActive && <span className="bottom-nav-active-dot" aria-hidden="true" />}
            </a>
          );
        })}
      </div>
    </nav>
  );
}
