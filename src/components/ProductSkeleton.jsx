export default function ProductSkeleton({ count = 8 }) {
  return (
    <div className="product-grid" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <article className="product-card skeleton-card" key={index}>
          <div className="skeleton-media skeleton-shimmer" />
          <div className="product-body">
            <div className="skeleton-line short skeleton-shimmer" />
            <div className="skeleton-line skeleton-shimmer" />
            <div className="skeleton-line skeleton-shimmer" />
            <div className="skeleton-line medium skeleton-shimmer" />
          </div>
        </article>
      ))}
    </div>
  );
}
