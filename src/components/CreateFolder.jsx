import { useState } from 'react'

export default function CreateFolder({ parentId, onClose, onCreate }) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim() || loading) return

    setLoading(true)
    const success = await onCreate(name.trim(), parentId)
    setLoading(false)

    if (success) {
      onClose()
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h3>{parentId ? 'New Subfolder' : 'New Folder'}</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Folder name"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
            maxLength={100}
          />
          <div className="form-actions">
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit" disabled={loading || !name.trim()}>
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
