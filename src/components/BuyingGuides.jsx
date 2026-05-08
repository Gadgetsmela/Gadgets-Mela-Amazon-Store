import { BookOpen } from 'lucide-react';
import { guides } from '../data/guides.js';

export default function BuyingGuides() {
  return (
    <section className="guides-section" id="guides" aria-labelledby="guides-title">
      <div className="section-heading centered">
        <p className="eyebrow">Make better buying decisions</p>
        <h2 id="guides-title">Gadget buying guides</h2>
      </div>
      <div className="guide-grid">
        {guides.map((guide) => (
          <article className="guide-card" key={guide.title}>
            <BookOpen size={22} />
            <h3>{guide.title}</h3>
            <p>{guide.excerpt}</p>
            <span>{guide.readTime}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
