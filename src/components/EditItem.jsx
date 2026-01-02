import { useState } from 'react'
import MarkdownEditor from './MarkdownEditor'
import TagInput from './TagInput'

export default function EditItem({ item, onSave, onClose, allTags = [] }) {
  const [title, setTitle] = useState(item.title || '')
  const [url, setUrl] = useState(item.url || '')
  const [content, setContent] = useState(item.content || '')
  const [tags, setTags] = useState(item.tags || [])
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim() || loading) return

    setLoading(true)

    const updates = {
      title: title.trim(),
      url: item.type === 'link' && url.trim() ? url.trim() : null,
      content: (item.type === 'text' || item.type === 'link') && content.trim() ? content.trim() : null,
      tags: tags.length > 0 ? tags : null,
    }

    await onSave(item.id, updates)
    setLoading(false)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content edit-modal" onClick={e => e.stopPropagation()}>
        <div className="edit-header">
          <h3>Edit {item.type === 'link' ? 'Link' : item.type === 'image' ? 'Image' : 'Note'}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
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

          <label>
            <span>Tags</span>
            <TagInput
              tags={tags}
              onChange={setTags}
              allTags={allTags}
            />
          </label>

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
