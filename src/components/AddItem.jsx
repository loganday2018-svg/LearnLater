import { useState, useRef, useEffect } from 'react'
import { supabase, edgeFunctionUrl } from '../supabaseClient'
import MarkdownEditor from './MarkdownEditor'
import TagInput from './TagInput'

export default function AddItem({ onAdd, initialType = null, onClose, allTags = [] }) {
  const [isOpen, setIsOpen] = useState(!!initialType)
  const [type, setType] = useState(initialType || 'link')
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState([])
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [fetchingPreview, setFetchingPreview] = useState(false)
  const [author, setAuthor] = useState('')
  const [readingStatus, setReadingStatus] = useState('want_to_read')
  const [dueDate, setDueDate] = useState('')
  const isSubmitting = useRef(false)
  const fileInputRef = useRef(null)

  // Check if this is a watch type
  const isWatchType = type === 'movie' || type === 'show' || type === 'youtube'
  const isBookType = type === 'book'
  const isInboxType = type === 'link' || type === 'text' || type === 'image' || type === 'checklist'

  // Handle opening from FAB with specific type
  useEffect(() => {
    if (initialType) {
      setType(initialType)
      setIsOpen(true)
    }
  }, [initialType])

  const isValidUrl = (urlString) => {
    if (!urlString) return true
    try {
      const urlObj = new URL(urlString)
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
    } catch {
      return false
    }
  }

  async function fetchLinkPreview(urlString) {
    if (!urlString || !isValidUrl(urlString) || title.trim()) return

    setFetchingPreview(true)
    try {
      const response = await fetch(edgeFunctionUrl('fetch-link-preview'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlString })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.title && !title.trim()) {
          setTitle(data.title)
        }
        if (data.description && !content.trim()) {
          setContent(data.description)
        }
      }
    } catch (err) {
      console.log('Could not fetch preview:', err)
    }
    setFetchingPreview(false)
  }

  function handleImageSelect(e) {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image must be less than 5MB')
        return
      }
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => setImagePreview(e.target.result)
      reader.readAsDataURL(file)
    }
  }

  async function uploadImage(file, userId) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${Date.now()}.${fileExt}`

    const { data, error } = await supabase.storage
      .from('images')
      .upload(fileName, file)

    if (error) {
      console.error('Upload error:', error)
      throw error
    }

    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(fileName)

    return publicUrl
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (isSubmitting.current || loading) return
    isSubmitting.current = true
    setLoading(true)

    if (type === 'link' && url && !isValidUrl(url)) {
      alert('Please enter a valid URL starting with http:// or https://')
      setLoading(false)
      isSubmitting.current = false
      return
    }

    if (type === 'image' && !imageFile) {
      alert('Please select an image')
      setLoading(false)
      isSubmitting.current = false
      return
    }

    try {
      let imageUrl = null

      if (type === 'image' && imageFile) {
        const { data: { session } } = await supabase.auth.getSession()
        imageUrl = await uploadImage(imageFile, session.user.id)
      }

      let newItem = {
        type,
        title: title.trim(),
      }

      // Handle different types
      if (type === 'link') {
        newItem.url = url.trim() || null
        newItem.content = content.trim() || null
        newItem.tags = tags.length > 0 ? tags : null
        newItem.due_date = dueDate || null
      } else if (type === 'text' || type === 'checklist') {
        newItem.content = content.trim() || null
        newItem.tags = tags.length > 0 ? tags : null
        newItem.due_date = dueDate || null
      } else if (type === 'image') {
        newItem.image_url = imageUrl
        newItem.tags = tags.length > 0 ? tags : null
        newItem.due_date = dueDate || null
      } else if (isWatchType) {
        newItem.url = url.trim() || null
        newItem.content = content.trim() || null
        newItem.watched = false
      } else if (isBookType) {
        newItem.author = author.trim() || null
        newItem.reading_status = readingStatus
        newItem.book_notes = []
      }

      const success = await onAdd(newItem)

      if (success) {
        resetForm()
      }
    } catch (err) {
      console.error('Error:', err)
      alert('Failed to save item')
    }

    setLoading(false)
    isSubmitting.current = false
  }

  function resetForm() {
    setTitle('')
    setUrl('')
    setContent('')
    setTags([])
    setImageFile(null)
    setImagePreview(null)
    setAuthor('')
    setReadingStatus('want_to_read')
    setDueDate('')
    setIsOpen(false)
    if (onClose) onClose()
  }

  function handleClose() {
    resetForm()
    setType('link')
  }

  function getModalTitle() {
    switch (type) {
      case 'link': return '🔗 Add Link'
      case 'text': return '📝 Add Note'
      case 'image': return '🖼️ Add Image'
      case 'checklist': return '☑️ Add Checklist'
      case 'movie': return '🎬 Add Movie'
      case 'show': return '📺 Add TV Show'
      case 'youtube': return '▶️ Add YouTube'
      case 'book': return '📖 Add Book'
      default: return 'Add Item'
    }
  }

  // If opened via FAB, render as modal
  if (initialType && isOpen) {
    return (
      <div className="modal-overlay" onClick={handleClose}>
        <div className="modal-content add-item-modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3>{getModalTitle()}</h3>
            <button className="close-btn" onClick={handleClose}>×</button>
          </div>
          {renderForm()}
        </div>
      </div>
    )
  }

  // Default inline mode
  if (!isOpen) {
    return null // FAB handles the button now
  }

  function renderForm() {
    return (
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={200}
          autoFocus
        />

        {type === 'link' && (
          <>
            <div className="url-input-wrapper">
              <input
                type="url"
                placeholder="https://... (paste URL to auto-fetch title)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onBlur={(e) => fetchLinkPreview(e.target.value)}
                onPaste={(e) => {
                  const pastedUrl = e.clipboardData.getData('text')
                  setTimeout(() => fetchLinkPreview(pastedUrl), 100)
                }}
              />
              {fetchingPreview && <span className="fetching-indicator">...</span>}
            </div>
            <MarkdownEditor
              value={content}
              onChange={setContent}
              placeholder="Add notes about this link (supports markdown)"
              rows={3}
            />
          </>
        )}

        {(type === 'text' || type === 'checklist') && (
          <MarkdownEditor
            value={content}
            onChange={setContent}
            placeholder={type === 'checklist' ? 'Use toolbar to add checkboxes' : 'Write your note (supports markdown)'}
            rows={6}
          />
        )}

        {type === 'image' && (
          <div className="image-upload">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              ref={fileInputRef}
              style={{ display: 'none' }}
            />
            {imagePreview ? (
              <div className="image-preview">
                <img src={imagePreview} alt="Preview" />
                <button
                  type="button"
                  className="remove-image"
                  onClick={() => {
                    setImageFile(null)
                    setImagePreview(null)
                  }}
                >
                  ×
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="select-image-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                📷 Select Image
              </button>
            )}
          </div>
        )}

        {/* Watch type fields (movie, show, youtube) */}
        {isWatchType && (
          <>
            {type === 'youtube' && (
              <input
                type="url"
                placeholder="YouTube URL (optional)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            )}
            <textarea
              placeholder="Notes (who recommended it, where to watch, etc.)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
            />
          </>
        )}

        {/* Book type fields */}
        {isBookType && (
          <>
            <input
              type="text"
              placeholder="Author (optional)"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
            />
            <div className="status-select">
              <label>Status:</label>
              <select value={readingStatus} onChange={(e) => setReadingStatus(e.target.value)}>
                <option value="want_to_read">Want to Read</option>
                <option value="reading">Reading</option>
                <option value="finished">Finished</option>
              </select>
            </div>
          </>
        )}

        {/* Tags only for non-watch/non-book types */}
        {!isWatchType && !isBookType && (
          <TagInput
            tags={tags}
            onChange={setTags}
            allTags={allTags}
          />
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
                min={new Date().toISOString().split('T')[0]}
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
          <button type="button" onClick={handleClose}>
            Cancel
          </button>
          <button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    )
  }

  return (
    <div className="add-item-form">
      <div className="type-toggle">
        <button
          className={type === 'link' ? 'active' : ''}
          onClick={() => setType('link')}
          type="button"
        >
          Link
        </button>
        <button
          className={type === 'text' ? 'active' : ''}
          onClick={() => setType('text')}
          type="button"
        >
          Text
        </button>
        <button
          className={type === 'image' ? 'active' : ''}
          onClick={() => setType('image')}
          type="button"
        >
          Image
        </button>
      </div>
      {renderForm()}
    </div>
  )
}
