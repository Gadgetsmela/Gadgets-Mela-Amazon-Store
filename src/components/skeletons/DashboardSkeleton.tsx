import CardSkeleton from './CardSkeleton';

export default function DashboardSkeleton() {
  return (
    <section className="dashboard-skeleton" role="status" aria-label="Loading admin dashboard">
      <div className="dashboard-skeleton-hero">
        <span className="skeleton-pill skeleton-shimmer" />
        <strong className="skeleton-line skeleton-line-lg skeleton-shimmer" />
        <span className="skeleton-line skeleton-shimmer" />
      </div>
      <div className="dashboard-skeleton-grid">
        {Array.from({ length: 6 }).map((_, index) => (
          <CardSkeleton key={index} className="is-compact" lines={2} />
        ))}
      </div>
    </section>
  );
}
