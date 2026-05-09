import { Clock3, Percent, Star, Truck } from 'lucide-react';

export default function DealStrip({ products = [] }) {
  const bestDiscount = Math.max(0, ...products.map((product) => product.discountPercent || 0));
  const averageRating = products.length
    ? (products.reduce((total, product) => total + Number(product.rating || 0), 0) / products.length).toFixed(1)
    : '—';
  const deals = [
    { icon: Percent, value: `${bestDiscount}%`, label: 'top local discount' },
    { icon: Clock3, value: '24h', label: 'local refresh cycle' },
    { icon: Star, value: averageRating, label: 'rating average' },
    { icon: Truck, value: 'Prime', label: 'shipping-friendly picks' },
  ];

  return (
    <section className="deal-strip" id="deals">
      {deals.map(({ icon: Icon, value, label }) => (
        <article key={label}>
          <Icon size={22} />
          <strong>{value}</strong>
          <span>{label}</span>
        </article>
      ))}
    </section>
  );
}
