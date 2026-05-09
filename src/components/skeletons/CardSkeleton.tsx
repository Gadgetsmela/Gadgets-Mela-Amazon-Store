export default function CardSkeleton({ className = '', lines = 3 }) {
  return (
    <article className={`luxury-skeleton-card ${className}`} aria-hidden="true">
      <div className="skeleton-media skeleton-shimmer" />
      <div className="skeleton-copy">
        <span className="skeleton-pill skeleton-shimmer" />
        <strong className="skeleton-line skeleton-line-lg skeleton-shimmer" />
        {Array.from({ length: lines }).map((_, index) => (
          <span key={index} className={`skeleton-line skeleton-shimmer ${index === lines - 1 ? 'is-short' : ''}`} />
        ))}
        <div className="skeleton-actions">
          <span className="skeleton-button skeleton-shimmer" />
          <span className="skeleton-button skeleton-shimmer is-muted" />
        </div>
      </div>
    </article>
  );
}
