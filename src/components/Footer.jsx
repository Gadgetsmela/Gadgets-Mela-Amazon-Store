import { Mail, ShieldCheck, ShoppingBag, Sparkles } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="site-footer" id="contact">
      <div className="footer-brand-panel">
        <a className="footer-brand" href="#top" aria-label="Gadgets Mela home">
          <img
            src="/brand/gadgets-mela-logo.svg"
            alt="GADGETS MELA"
            width="260"
            height="64"
          />
        </a>
        <p>Premium Amazon affiliate gadget deals, smart accessories, and quick buying guides curated for everyday tech upgrades.</p>
        <div className="footer-trust-pills" aria-label="Store highlights">
          <span><ShieldCheck size={16} /> Affiliate transparent</span>
          <span><Sparkles size={16} /> Hand-picked tech</span>
          <span><ShoppingBag size={16} /> Amazon deals</span>
        </div>
      </div>

      <div className="footer-links-panel">
        <div>
          <strong>Explore</strong>
          <nav aria-label="Footer navigation">
            <a href="#top">Home</a>
            <a href="#categories">Categories</a>
            <a href="#deals">Hot Deals</a>
            <a href="#whatsapp-deals">WhatsApp Deals</a>
          </nav>
        </div>
        <a className="footer-contact" href="mailto:hello@gadgetsmela.example">
          <Mail size={18} /> hello@gadgetsmela.example
        </a>
      </div>
    </footer>
  );
}
