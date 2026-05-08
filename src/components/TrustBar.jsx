const trustItems = ['Hand-picked deals', 'Transparent affiliate links', 'Beginner-friendly guides'];

export default function TrustBar() {
  return (
    <div className="trust-bar">
      {trustItems.map((item) => <span key={item}>{item}</span>)}
    </div>
  );
}
