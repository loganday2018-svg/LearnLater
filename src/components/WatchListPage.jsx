import { useState } from 'react'
import { vibrate, shareItems, formatWatchListForShare } from '../utils'

export default function WatchListPage({ items, onAdd, onDelete, onEdit, onToggleWatched }) {
  const [typeFilter, setTypeFilter] = useState('all') // all, youtube, movies, other
  const [showAddForm, setShowAddForm] = useState(false)
  const [mediaType, setMediaType] = useState('movie')
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [shareToast, setShareToast] = useState(null)

  // Filter watch items (movies, shows, youtube)
  let watchItems = items.filter(item => item.type === 'movie' || item.type === 'show' || item.type === 'youtube')

  // Apply type filter
  if (typeFilter === 'youtube') {
    watchItems = watchItems.filter(item => item.type === 'youtube')
  } else if (typeFilter === 'movies') {
    watchItems = watchItems.filter(item => item.type === 'movie' || item.type === 'show')
  }

  // Count by type for filter badges
  const allWatchItems = items.filter(item => item.type === 'movie' || item.type === 'show' || item.type === 'youtube')
  const youtubeCount = allWatchItems.filter(item => item.type === 'youtube').length
  const moviesCount = allWatchItems.filter(item => item.type === 'movie' || item.type === 'show').length

  // Sort by created date, newest first
  watchItems = [...watchItems].sort((a, b) =>
    new Date(b.created_at) - new Date(a.created_at)
  )

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim() || loading) return

    setLoading(true)
    vibrate(10)

    const newItem = {
      type: mediaType,
      title: title.trim(),
      url: url.trim() || null,
      content: notes.trim() || null,
      watched: false,
    }

    const success = await onAdd(newItem)

    if (success) {
      setTitle('')
      setUrl('')
      setNotes('')
      setShowAddForm(false)
    }

    setLoading(false)
  }

  function handleToggleWatched(item) {
    vibrate(10)
    onToggleWatched(item.id, !item.watched)
  }

  async function handleShare() {
    vibrate(10)
    const allWatchItemsList = items.filter(item => item.type === 'movie' || item.type === 'show' || item.type === 'youtube')
    const result = await shareItems('Watch List', allWatchItemsList, formatWatchListForShare)
    if (result.success) {
      setShareToast(result.method === 'share' ? 'Shared!' : 'Copied to clipboard!')
      setTimeout(() => setShareToast(null), 2000)
    }
  }

  return (
    <div className="watchlist-page">
      <div className="watchlist-header">
        <h2>Watch List</h2>
        <div className="header-actions">
          {allWatchItems.length > 0 && (
            <button
              className="share-btn"
              onClick={handleShare}
              aria-label="Share watch list"
            >
              ↗
            </button>
          )}
          <button
            className="add-watch-btn"
            onClick={() => {
              vibrate(5)
              setShowAddForm(!showAddForm)
            }}
          >
            {showAddForm ? '×' : '+'}
          </button>
        </div>
      </div>

      {showAddForm && (
        <form className="add-watch-form" onSubmit={handleSubmit}>
          <div className="media-type-toggle">
            <button
              type="button"
              className={mediaType === 'movie' ? 'active' : ''}
              onClick={() => setMediaType('movie')}
            >
              🎬 Movie
            </button>
            <button
              type="button"
              className={mediaType === 'show' ? 'active' : ''}
              onClick={() => setMediaType('show')}
            >
              📺 TV Show
            </button>
            <button
              type="button"
              className={mediaType === 'youtube' ? 'active' : ''}
              onClick={() => setMediaType('youtube')}
            >
              ▶️ YouTube
            </button>
          </div>

          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
          />

          {mediaType === 'youtube' && (
            <input
              type="url"
              placeholder="YouTube URL (optional)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          )}

          <textarea
            placeholder="Notes (who recommended it, where to watch, etc.)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />

          <div className="form-actions">
            <button type="button" onClick={() => setShowAddForm(false)}>
              Cancel
            </button>
            <button type="submit" disabled={loading || !title.trim()}>
              {loading ? 'Adding...' : 'Add'}
            </button>
          </div>
        </form>
      )}

      {/* Type filters */}
      <div className="watchlist-filters type-filters">
        <button
          className={typeFilter === 'all' ? 'active' : ''}
          onClick={() => setTypeFilter('all')}
        >
          All ({allWatchItems.length})
        </button>
        <button
          className={typeFilter === 'movies' ? 'active' : ''}
          onClick={() => setTypeFilter('movies')}
        >
          🎬 Movies/Shows ({moviesCount})
        </button>
        <button
          className={typeFilter === 'youtube' ? 'active' : ''}
          onClick={() => setTypeFilter('youtube')}
        >
          ▶️ YouTube ({youtubeCount})
        </button>
      </div>

      {watchItems.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎬</div>
          <h3>No movies or shows yet</h3>
          <p>Add movies and TV shows you want to watch!</p>
        </div>
      ) : (
        <div className="watchlist-items">
          {watchItems.map(item => (
            <div
              key={item.id}
              className={`watch-item ${item.watched ? 'watched' : ''}`}
            >
              <button
                className="watch-toggle"
                onClick={() => handleToggleWatched(item)}
                aria-label={item.watched ? 'Mark as unwatched' : 'Mark as watched'}
              >
                {item.watched ? '✓' : '○'}
              </button>

              <div className="watch-item-content">
                <div className="watch-item-header">
                  <span className="media-type-icon">
                    {item.type === 'movie' ? '🎬' : item.type === 'youtube' ? '▶️' : '📺'}
                  </span>
                  <h3 className={item.watched ? 'strikethrough' : ''}>
                    {item.url ? (
                      <a href={item.url} target="_blank" rel="noopener noreferrer">
                        {item.title}
                      </a>
                    ) : (
                      item.title
                    )}
                  </h3>
                </div>
                {item.content && (
                  <p className="watch-notes">{item.content}</p>
                )}
              </div>

              <div className="watch-item-actions">
                <button
                  className="edit-btn"
                  onClick={() => onEdit(item)}
                  aria-label="Edit"
                >
                  ✎
                </button>
                <button
                  className="delete-btn"
                  onClick={() => {
                    vibrate(10)
                    onDelete(item.id)
                  }}
                  aria-label="Delete"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Share Toast */}
      {shareToast && (
        <div className="share-toast">{shareToast}</div>
      )}
    </div>
  )
}
