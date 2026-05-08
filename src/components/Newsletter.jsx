import { Mail } from 'lucide-react';

export default function Newsletter() {
  return (
    <section className="newsletter" id="newsletter" aria-labelledby="newsletter-title">
      <div>
        <p className="eyebrow">Never miss a useful deal</p>
        <h2 id="newsletter-title">Get weekly gadget picks in your inbox.</h2>
        <p>No spam, just practical tech finds, price-drop alerts, and setup ideas.</p>
      </div>
      <form onSubmit={(event) => event.preventDefault()}>
        <label htmlFor="email"><Mail size={18} /> Email address</label>
        <div className="newsletter-row">
          <input id="email" type="email" placeholder="you@example.com" />
          <button type="submit">Notify me</button>
        </div>
      </form>
    </section>
  );
}
