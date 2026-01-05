import { useState } from 'react'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { vibrate, shareItems, formatWatchListForShare } from '../utils'
import useUndoDelete from '../hooks/useUndoDelete'
import SwipeableCard from './SwipeableCard'
import ExportModal from './ExportModal'

export default function WatchListPage({ items, onAdd, onDelete, onEdit, onToggleWatched, onUpdate }) {
  const [typeFilter, setTypeFilter] = useState('youtube') // youtube, movies
  const [showAddForm, setShowAddForm] = useState(false)
  const [mediaType, setMediaType] = useState('movie')
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [shareToast, setShareToast] = useState(null)
  const [showExportModal, setShowExportModal] = useState(false)

  const {
    pendingDelete,
    handleDeleteWithUndo,
    handleUndoDelete,
    filterPendingDelete
  } = useUndoDelete(items, onDelete)

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

  // Sort by pinned first, then sort_order, then created date
  watchItems = [...watchItems].sort((a, b) => {
    // Pinned items first
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    // Then by sort_order if exists
    if (a.sort_order != null && b.sort_order != null) {
      return a.sort_order - b.sort_order
    }
    // Fall back to created date
    return new Date(b.created_at) - new Date(a.created_at)
  })

  // Get IDs for SortableContext
  const itemIds = watchItems.map(item => item.id)

  // Handle long press for pinning
  function handleLongPress(id) {
    const item = items.find(i => i.id === id)
    if (item) {
      onUpdate(id, { pinned: !item.pinned })
    }
  }

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
            <>
              <button
                className="share-btn"
                onClick={handleShare}
                aria-label="Share watch list"
              >
                ↗
              </button>
              <button
                className="export-pdf-btn"
                onClick={() => {
                  vibrate(5)
                  setShowExportModal(true)
                }}
                aria-label="Export to PDF"
              >
                PDF
              </button>
            </>
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
          className={typeFilter === 'youtube' ? 'active' : ''}
          onClick={() => setTypeFilter('youtube')}
        >
          ▶️ YouTube ({youtubeCount})
        </button>
        <button
          className={typeFilter === 'movies' ? 'active' : ''}
          onClick={() => setTypeFilter('movies')}
        >
          🎬 Movies/Shows ({moviesCount})
        </button>
      </div>

      {watchItems.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">{typeFilter === 'youtube' ? '▶️' : '🎬'}</div>
          <h3>No {typeFilter === 'youtube' ? 'YouTube videos' : 'movies or shows'} yet</h3>
          <p>Add {typeFilter === 'youtube' ? 'videos' : 'movies and TV shows'} you want to watch!</p>
        </div>
      ) : (
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          <div className="watchlist-items">
            {filterPendingDelete(watchItems).map((item, index) => (
              <SwipeableCard
                key={item.id}
                id={item.id}
                onDelete={handleDeleteWithUndo}
                onLongPress={handleLongPress}
                className={`watch-item-inner ${item.watched ? 'watched' : ''} ${item.pinned ? 'pinned' : ''}`}
                style={{ animationDelay: `${index * 30}ms` }}
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
                      {item.pinned && <span className="pin-icon">📌</span>}
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

                <button
                  className="edit-btn"
                  onClick={() => onEdit(item)}
                  aria-label="Edit"
                >
                  ✎
                </button>
              </SwipeableCard>
            ))}
          </div>
        </SortableContext>
      )}

      {/* Share Toast */}
      {shareToast && (
        <div className="share-toast">{shareToast}</div>
      )}

      {/* Undo Delete Toast */}
      {pendingDelete && (
        <div className="undo-toast">
          <span>"{pendingDelete.title.substring(0, 25)}{pendingDelete.title.length > 25 ? '...' : ''}" deleted</span>
          <button onClick={handleUndoDelete}>Undo</button>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <ExportModal
          items={watchItems}
          tabName="Watch List"
          onClose={() => setShowExportModal(false)}
        />
      )}
    </div>
  )
}
