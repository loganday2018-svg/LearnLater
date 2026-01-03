import { useState } from 'react'
import MarkdownEditor from './MarkdownEditor'
import TagInput from './TagInput'

export default function EditItem({ item, onSave, onClose, allTags = [] }) {
  const [title, setTitle] = useState(item.title || '')
  const [url, setUrl] = useState(item.url || '')
  const [content, setContent] = useState(item.content || '')
  const [tags, setTags] = useState(item.tags || [])
  const [mediaType, setMediaType] = useState(item.type || 'movie')
  const [dueDate, setDueDate] = useState(item.due_date || '')
  const [loading, setLoading] = useState(false)

  const isWatchType = item.type === 'movie' || item.type === 'show' || item.type === 'youtube'
  const isInboxType = item.type === 'link' || item.type === 'text' || item.type === 'image' || item.type === 'checklist'

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim() || loading) return

    setLoading(true)

    const updates = {
      title: title.trim(),
      tags: tags.length > 0 ? tags : null,
    }

    // Add due_date for inbox items
    if (isInboxType) {
      updates.due_date = dueDate || null
    }

    if (item.type === 'link') {
      updates.url = url.trim() || null
      updates.content = content.trim() || null
    } else if (item.type === 'text') {
      updates.content = content.trim() || null
    } else if (isWatchType) {
      updates.type = mediaType
      updates.url = url.trim() || null
      updates.content = content.trim() || null
    }

    await onSave(item.id, updates)
    setLoading(false)
  }

  function getEditTitle() {
    if (item.type === 'link') return 'Link'
    if (item.type === 'image') return 'Image'
    if (item.type === 'movie') return 'Movie'
    if (item.type === 'show') return 'TV Show'
    if (item.type === 'youtube') return 'YouTube'
    return 'Note'
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content edit-modal" onClick={e => e.stopPropagation()}>
        <div className="edit-header">
          <h3>Edit {getEditTitle()}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Media type toggle for Watch items */}
          {isWatchType && (
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
          )}

          <label>
            <span>Title</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              required
              maxLength={200}
              autoFocus
            />
          </label>

          {item.type === 'link' && (
            <>
              <label>
                <span>URL (optional)</span>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://..."
                />
              </label>
              <label>
                <span>Notes (supports markdown)</span>
                <MarkdownEditor
                  value={content}
                  onChange={setContent}
                  placeholder="Your notes about this link..."
                  rows={3}
                />
              </label>
            </>
          )}

          {item.type === 'text' && (
            <label>
              <span>Notes (supports markdown)</span>
              <MarkdownEditor
                value={content}
                onChange={setContent}
                placeholder="Your notes..."
                rows={5}
              />
            </label>
          )}

          {item.type === 'image' && item.image_url && (
            <div className="edit-image-preview">
              <img src={item.image_url} alt={item.title} />
            </div>
          )}

          {/* Watch item fields */}
          {isWatchType && (
            <>
              {mediaType === 'youtube' && (
                <label>
                  <span>YouTube URL (optional)</span>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://youtube.com/..."
                  />
                </label>
              )}
              <label>
                <span>Notes</span>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Who recommended it, where to watch, etc."
                  rows={3}
                />
              </label>
            </>
          )}

          {!isWatchType && (
            <label>
              <span>Tags</span>
              <TagInput
                tags={tags}
                onChange={setTags}
                allTags={allTags}
              />
            </label>
          )}

          {/* Due date for inbox items */}
          {isInboxType && (
            <div className="due-date-input">
              <label>
                <span className="due-date-label">📅 Due date</span>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
                {dueDate && (
                  <button
                    type="button"
                    className="clear-date-btn"
                    onClick={() => setDueDate('')}
                  >
                    ×
                  </button>
                )}
              </label>
            </div>
          )}

          <div className="form-actions">
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit" disabled={loading || !title.trim()}>
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
