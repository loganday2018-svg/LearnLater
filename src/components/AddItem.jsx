import { useState, useRef } from 'react'
import { supabase, edgeFunctionUrl } from '../supabaseClient'

export default function AddItem({ onAdd }) {
  const [isOpen, setIsOpen] = useState(false)
  const [type, setType] = useState('link')
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [content, setContent] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [fetchingPreview, setFetchingPreview] = useState(false)
  const isSubmitting = useRef(false)
  const fileInputRef = useRef(null)

  const isValidUrl = (urlString) => {
    if (!urlString) return true // URL is now optional
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

    // Validate URL for link type (only if URL is provided)
    if (type === 'link' && url && !isValidUrl(url)) {
      alert('Please enter a valid URL starting with http:// or https://')
      setLoading(false)
      isSubmitting.current = false
      return
    }

    // Validate image is selected for image type
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

      const newItem = {
        type,
        title: title.trim(),
        url: type === 'link' && url.trim() ? url.trim() : null,
        content: (type === 'text' || type === 'link') && content.trim() ? content.trim() : null,
        image_url: imageUrl,
      }

      const success = await onAdd(newItem)

      if (success) {
        setTitle('')
        setUrl('')
        setContent('')
        setImageFile(null)
        setImagePreview(null)
        setIsOpen(false)
      }
    } catch (err) {
      console.error('Error:', err)
      alert('Failed to save item')
    }

    setLoading(false)
    isSubmitting.current = false
  }

  function handleClose() {
    setIsOpen(false)
    setType('link')
    setTitle('')
    setUrl('')
    setContent('')
    setImageFile(null)
    setImagePreview(null)
  }

  if (!isOpen) {
    return (
      <button className="add-btn" onClick={() => setIsOpen(true)}>
        + Add New
      </button>
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

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={200}
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
            <textarea
              placeholder="Add notes about this link (optional)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={2}
              maxLength={10000}
            />
          </>
        )}

        {type === 'text' && (
          <textarea
            placeholder="Additional notes (optional)"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            maxLength={10000}
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

        <div className="form-actions">
          <button type="button" onClick={handleClose}>
            Cancel
          </button>
          <button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  )
}
