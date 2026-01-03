import { useState, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { vibrate, shareItems, formatBooksForShare } from '../utils'

export default function BooksPage({ items, onAdd, onDelete, onUpdate }) {
  const [filter, setFilter] = useState('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [status, setStatus] = useState('want_to_read')
  const [loading, setLoading] = useState(false)
  const [expandedBookId, setExpandedBookId] = useState(null)
  const [newNote, setNewNote] = useState('')
  const [newNotePage, setNewNotePage] = useState('')
  const [editingBookId, setEditingBookId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editAuthor, setEditAuthor] = useState('')
  const [noteImage, setNoteImage] = useState(null)
  const [noteImagePreview, setNoteImagePreview] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [shareToast, setShareToast] = useState(null)
  const fileInputRef = useRef(null)
  const isSubmitting = useRef(false)
  const isAddingNote = useRef(false)

  // Filter book items
  let books = items.filter(item => item.type === 'book')

  if (filter !== 'all') {
    books = books.filter(item => item.reading_status === filter)
  }

  // Sort by created date, newest first
  books = [...books].sort((a, b) =>
    new Date(b.created_at) - new Date(a.created_at)
  )

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim() || loading || isSubmitting.current) return

    isSubmitting.current = true
    setLoading(true)
    vibrate(10)

    const newBook = {
      type: 'book',
      title: title.trim(),
      author: author.trim() || null,
      reading_status: status,
      book_notes: [],
    }

    const success = await onAdd(newBook)

    if (success) {
      setTitle('')
      setAuthor('')
      setStatus('want_to_read')
      setShowAddForm(false)
    }

    setLoading(false)
    isSubmitting.current = false
  }

  function toggleExpand(bookId) {
    vibrate(5)
    setExpandedBookId(expandedBookId === bookId ? null : bookId)
    setNewNote('')
    setNewNotePage('')
    setNoteImage(null)
    setNoteImagePreview(null)
  }

  function handleImageSelect(e) {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image must be less than 5MB')
        return
      }
      setNoteImage(file)
      const reader = new FileReader()
      reader.onload = (e) => setNoteImagePreview(e.target.result)
      reader.readAsDataURL(file)
    }
  }

  function clearNoteImage() {
    setNoteImage(null)
    setNoteImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  async function uploadImage(file) {
    const { data: { session } } = await supabase.auth.getSession()
    const fileExt = file.name.split('.').pop()
    const fileName = `${session.user.id}/book-notes/${Date.now()}.${fileExt}`

    const { error } = await supabase.storage
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

  async function handleStatusChange(book, newStatus) {
    vibrate(10)
    await onUpdate(book.id, { reading_status: newStatus })
  }

  async function handleAddNote(book) {
    if ((!newNote.trim() && !noteImage) || isAddingNote.current) return

    isAddingNote.current = true
    vibrate(10)
    setUploadingImage(true)
    let imageUrl = null

    try {
      if (noteImage) {
        imageUrl = await uploadImage(noteImage)
      }

      const updatedNotes = [
        ...(book.book_notes || []),
        {
          id: crypto.randomUUID(),
          page: newNotePage.trim() || null,
          note: newNote.trim() || null,
          image_url: imageUrl,
          created_at: new Date().toISOString()
        }
      ]

      const success = await onUpdate(book.id, { book_notes: updatedNotes })
      if (success) {
        setNewNote('')
        setNewNotePage('')
        clearNoteImage()
      }
    } catch (err) {
      console.error('Error adding note:', err)
      alert('Failed to upload image')
    }

    setUploadingImage(false)
    isAddingNote.current = false
  }

  async function handleDeleteNote(book, noteId) {
    vibrate(10)
    const updatedNotes = (book.book_notes || []).filter(n => n.id !== noteId)
    await onUpdate(book.id, { book_notes: updatedNotes })
  }

  function startEditing(book) {
    vibrate(5)
    setEditingBookId(book.id)
    setEditTitle(book.title || '')
    setEditAuthor(book.author || '')
  }

  function cancelEditing() {
    setEditingBookId(null)
    setEditTitle('')
    setEditAuthor('')
  }

  async function saveEditing(book) {
    if (!editTitle.trim()) return
    vibrate(10)

    const success = await onUpdate(book.id, {
      title: editTitle.trim(),
      author: editAuthor.trim() || null
    })

    if (success) {
      cancelEditing()
    }
  }

  function getStatusLabel(status) {
    switch (status) {
      case 'want_to_read': return 'Want to Read'
      case 'reading': return 'Reading'
      case 'finished': return 'Finished'
      default: return status
    }
  }

  function getStatusIcon(status) {
    switch (status) {
      case 'want_to_read': return '📚'
      case 'reading': return '📖'
      case 'finished': return '✅'
      default: return '📕'
    }
  }

  async function handleShare() {
    vibrate(10)
    const allBooks = items.filter(item => item.type === 'book')
    const result = await shareItems('Reading List', allBooks, formatBooksForShare)
    if (result.success) {
      setShareToast(result.method === 'share' ? 'Shared!' : 'Copied to clipboard!')
      setTimeout(() => setShareToast(null), 2000)
    }
  }

  const allBooks = items.filter(item => item.type === 'book')

  return (
    <div className="books-page">
      <div className="books-header">
        <h2>Books</h2>
        <div className="header-actions">
          {allBooks.length > 0 && (
            <button
              className="share-btn"
              onClick={handleShare}
              aria-label="Share reading list"
            >
              ↗
            </button>
          )}
          <button
            className="add-book-btn"
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
        <form className="add-book-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Book title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
          />

          <input
            type="text"
            placeholder="Author (optional)"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
          />

          <div className="status-select">
            <label>Status:</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="want_to_read">Want to Read</option>
              <option value="reading">Reading</option>
              <option value="finished">Finished</option>
            </select>
          </div>

          <div className="form-actions">
            <button type="button" onClick={() => setShowAddForm(false)}>
              Cancel
            </button>
            <button type="submit" disabled={loading || !title.trim()}>
              {loading ? 'Adding...' : 'Add Book'}
            </button>
          </div>
        </form>
      )}

      <div className="books-filters">
        <button
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          All ({items.filter(i => i.type === 'book').length})
        </button>
        <button
          className={filter === 'reading' ? 'active' : ''}
          onClick={() => setFilter('reading')}
        >
          Reading
        </button>
        <button
          className={filter === 'want_to_read' ? 'active' : ''}
          onClick={() => setFilter('want_to_read')}
        >
          Want to Read
        </button>
        <button
          className={filter === 'finished' ? 'active' : ''}
          onClick={() => setFilter('finished')}
        >
          Finished
        </button>
      </div>

      {books.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📚</div>
          <h3>
            {filter === 'all'
              ? 'No books yet'
              : `No ${getStatusLabel(filter).toLowerCase()} books`}
          </h3>
          <p>Add books you're reading or want to read, and take notes!</p>
        </div>
      ) : (
        <div className="books-list">
          {books.map(book => (
            <div
              key={book.id}
              className={`book-card ${expandedBookId === book.id ? 'expanded' : ''}`}
            >
              <div className="book-card-header" onClick={() => toggleExpand(book.id)}>
                <div className="book-info">
                  <span className="book-status-icon">{getStatusIcon(book.reading_status)}</span>
                  <div className="book-title-author">
                    <h3>{book.title}</h3>
                    {book.author && <span className="book-author">by {book.author}</span>}
                  </div>
                </div>
                <div className="book-meta">
                  <span className="book-notes-count">
                    {(book.book_notes || []).length} notes
                  </span>
                  <span className="expand-icon">{expandedBookId === book.id ? '▼' : '▶'}</span>
                </div>
              </div>

              {expandedBookId === book.id && (
                <div className="book-expanded">
                  {/* Edit Form */}
                  {editingBookId === book.id ? (
                    <div className="book-edit-form">
                      <input
                        type="text"
                        placeholder="Book title"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        autoFocus
                      />
                      <input
                        type="text"
                        placeholder="Author (optional)"
                        value={editAuthor}
                        onChange={(e) => setEditAuthor(e.target.value)}
                      />
                      <div className="edit-actions">
                        <button onClick={cancelEditing}>Cancel</button>
                        <button
                          className="save-btn"
                          onClick={() => saveEditing(book)}
                          disabled={!editTitle.trim()}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : null}

                  <div className="book-status-bar">
                    <select
                      value={book.reading_status || 'want_to_read'}
                      onChange={(e) => handleStatusChange(book, e.target.value)}
                    >
                      <option value="want_to_read">Want to Read</option>
                      <option value="reading">Reading</option>
                      <option value="finished">Finished</option>
                    </select>
                    <div className="book-actions">
                      {editingBookId !== book.id && (
                        <button
                          className="edit-book-btn"
                          onClick={() => startEditing(book)}
                        >
                          ✎ Edit
                        </button>
                      )}
                      <button
                        className="delete-book-btn"
                        onClick={() => {
                          vibrate(10)
                          onDelete(book.id)
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="book-notes-section">
                    <h4>Notes</h4>

                    <div className="add-note-form">
                      <div className="note-inputs">
                        <input
                          type="text"
                          placeholder="Page # (optional)"
                          value={newNotePage}
                          onChange={(e) => setNewNotePage(e.target.value)}
                          className="page-input"
                        />
                        <textarea
                          placeholder="Add a note..."
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          rows={2}
                        />
                      </div>

                      {/* Image upload section */}
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleImageSelect}
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                      />

                      {noteImagePreview ? (
                        <div className="note-image-preview">
                          <img src={noteImagePreview} alt="Preview" />
                          <button
                            type="button"
                            className="remove-image-btn"
                            onClick={clearNoteImage}
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="add-image-btn"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          📷 Add Photo
                        </button>
                      )}

                      <button
                        className="add-note-btn"
                        onClick={() => handleAddNote(book)}
                        disabled={(!newNote.trim() && !noteImage) || uploadingImage}
                      >
                        {uploadingImage ? 'Uploading...' : 'Add Note'}
                      </button>
                    </div>

                    {(book.book_notes || []).length === 0 ? (
                      <p className="no-notes">No notes yet. Start taking notes!</p>
                    ) : (
                      <div className="notes-list">
                        {[...(book.book_notes || [])].reverse().map(note => (
                          <div key={note.id} className={`note-item ${note.image_url ? 'has-image' : ''}`}>
                            {note.page && (
                              <span className="note-page">p. {note.page}</span>
                            )}
                            {note.image_url && (
                              <div className="note-image">
                                <img
                                  src={note.image_url}
                                  alt="Note"
                                  onClick={() => window.open(note.image_url, '_blank')}
                                />
                              </div>
                            )}
                            {note.note && <p className="note-text">{note.note}</p>}
                            <button
                              className="delete-note-btn"
                              onClick={() => handleDeleteNote(book, note.id)}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
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
