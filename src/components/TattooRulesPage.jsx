import { useState } from 'react'
import { vibrate } from '../utils'

export default function TattooRulesPage({ items, onAdd, onDelete }) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [title, setTitle] = useState('')
  const [context, setContext] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)

  // Filter tattoo rules
  const rules = (items || [])
    .filter(item => item.type === 'tattoo_rule')
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at)) // Oldest first (foundational rules)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim() || loading) return

    setLoading(true)
    vibrate(10)

    const newRule = {
      type: 'tattoo_rule',
      title: title.trim(),
      content: context.trim() || null,
    }

    const success = await onAdd(newRule)

    if (success) {
      setTitle('')
      setContext('')
      setShowAddForm(false)
    }

    setLoading(false)
  }

  function handleDelete(id) {
    if (confirmDelete === id) {
      vibrate([10, 50, 10])
      onDelete(id)
      setConfirmDelete(null)
    } else {
      vibrate(5)
      setConfirmDelete(id)
      // Auto-clear confirm after 3 seconds
      setTimeout(() => setConfirmDelete(null), 3000)
    }
  }

  return (
    <div className="tattoo-rules-page">
      <div className="tattoo-rules-header">
        <div className="header-title">
          <h2>Tattoo Rules</h2>
          <p className="header-subtitle">Lessons we must never forget</p>
        </div>
        <button
          className="add-rule-btn"
          onClick={() => {
            vibrate(5)
            setShowAddForm(!showAddForm)
          }}
        >
          {showAddForm ? '×' : '+'}
        </button>
      </div>

      {showAddForm && (
        <form className="add-rule-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="The rule / lesson learned"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
          />

          <textarea
            placeholder="Context: What happened? Why is this important? (optional)"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            rows={3}
          />

          <div className="form-actions">
            <button type="button" onClick={() => setShowAddForm(false)}>
              Cancel
            </button>
            <button type="submit" disabled={loading || !title.trim()}>
              {loading ? 'Adding...' : 'Tattoo It'}
            </button>
          </div>
        </form>
      )}

      {rules.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon tattoo-icon">
            <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="60" cy="60" r="45" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="2"/>
              <path d="M45 55C45 55 50 45 60 45C70 45 75 55 75 55" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round"/>
              <circle cx="48" cy="52" r="3" fill="#F59E0B"/>
              <circle cx="72" cy="52" r="3" fill="#F59E0B"/>
              <path d="M50 75C50 75 55 80 60 80C65 80 70 75 70 75" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round"/>
              <path d="M40 35L45 25M80 35L75 25M60 30V20" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h3>No tattoo rules yet</h3>
          <p>Add lessons you've learned the hard way.</p>
          <p>Rules you never want to break again.</p>
        </div>
      ) : (
        <div className="rules-list">
          {rules.map((rule, index) => (
            <div key={rule.id} className="rule-card">
              <div className="rule-number">#{index + 1}</div>
              <div className="rule-content">
                <h3 className="rule-title">{rule.title}</h3>
                {rule.content && (
                  <p className="rule-context">{rule.content}</p>
                )}
                <span className="rule-date">
                  Added {new Date(rule.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>
              <button
                className={`delete-rule-btn ${confirmDelete === rule.id ? 'confirm' : ''}`}
                onClick={() => handleDelete(rule.id)}
                title={confirmDelete === rule.id ? 'Click again to confirm' : 'Delete rule'}
              >
                {confirmDelete === rule.id ? '?' : '×'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
