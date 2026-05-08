import { Info } from 'lucide-react';

export default function AffiliateDisclosure() {
  return (
    <section className="affiliate-disclosure" aria-label="Affiliate disclosure">
      <Info size={20} />
      <p>
        <strong>Affiliate disclosure:</strong> Gadgets Mela participates in the Amazon Associates Program. We may earn a commission from qualifying purchases at no extra cost to you.
      </p>
    </section>
  );
}
