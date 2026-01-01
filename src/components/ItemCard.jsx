export default function ItemCard({ item, onDelete }) {
  const formatDate = (dateString) => {
    if (!dateString) return ''
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return ''
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
      })
    } catch {
      return ''
    }
  }

  // Safely extract hostname from URL
  const getHostname = (urlString) => {
    try {
      return new URL(urlString).hostname
    } catch {
      return urlString // Return raw URL if parsing fails
    }
  }

  // Truncate long text for display
  const truncate = (text, maxLength) => {
    if (!text || text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  return (
    <div className={`item-card ${item.type}`}>
      <div className="card-header">
        <span className="card-type">{item.type === 'link' ? '🔗' : '📝'}</span>
        <span className="card-date">{formatDate(item.created_at)}</span>
      </div>

      <h3 className="card-title">
        {item.type === 'link' ? (
          <a href={item.url} target="_blank" rel="noopener noreferrer">
            {truncate(item.title, 100)}
          </a>
        ) : (
          truncate(item.title, 100)
        )}
      </h3>

      {item.type === 'link' && item.url && (
        <p className="card-url">{getHostname(item.url)}</p>
      )}

      {item.type === 'text' && item.content && (
        <p className="card-content">{truncate(item.content, 300)}</p>
      )}

      <button
        className="delete-btn"
        onClick={() => onDelete(item.id)}
        aria-label="Delete item"
      >
        ×
      </button>
    </div>
  )
}
