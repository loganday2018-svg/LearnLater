export default function SkeletonCard({ count = 5 }) {
  return (
    <div className="skeleton-container">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton skeleton-title"></div>
          <div className="skeleton skeleton-text"></div>
          <div className="skeleton skeleton-text-short"></div>
          <div className="skeleton-meta">
            <div className="skeleton skeleton-badge"></div>
            <div className="skeleton skeleton-badge"></div>
          </div>
        </div>
      ))}
    </div>
  )
}
