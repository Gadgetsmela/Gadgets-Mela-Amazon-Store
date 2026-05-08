import { Clock3, Percent, Truck } from 'lucide-react';

const deals = [
  { icon: Percent, value: '35%', label: 'featured savings' },
  { icon: Clock3, value: '24h', label: 'deal refresh cycle' },
  { icon: Truck, value: 'Prime', label: 'shipping-friendly picks' },
];

export default function DealStrip() {
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
