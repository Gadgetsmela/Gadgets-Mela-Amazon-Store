import CardSkeleton from './CardSkeleton';

export default function ProductSkeleton({ count = 8 }) {
  return (
    <div className="product-grid skeleton-product-grid" role="status" aria-label="Loading premium gadget deals">
      {Array.from({ length: count }).map((_, index) => (
        <CardSkeleton key={index} />
      ))}
    </div>
  );
}
