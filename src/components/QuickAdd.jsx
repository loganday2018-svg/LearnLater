import { useState, useRef } from 'react'
import { vibrate } from '../utils'

export default function QuickAdd({ onAdd }) {
  const [value, setValue] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef(null)

  const isUrl = (text) => {
    try {
      const url = new URL(text.trim())
      return url.protocol === 'http:' || url.protocol === 'https:'
    } catch {
      return false
    }
  }

  async function handleSubmit(e) {
    e?.preventDefault()
    const trimmed = value.trim()
    if (!trimmed || isLoading) return

    setIsLoading(true)
    vibrate(10)

    try {
      const isLink = isUrl(trimmed)
      const newItem = isLink
        ? { type: 'link', title: trimmed, url: trimmed }
        : { type: 'text', title: trimmed, content: '' }

      const success = await onAdd(newItem)
      if (success) {
        setValue('')
        setIsExpanded(false)
      }
    } catch (err) {
      console.error('Quick add error:', err)
    }

    setIsLoading(false)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    } else if (e.key === 'Escape') {
      setValue('')
      setIsExpanded(false)
      inputRef.current?.blur()
    }
  }

  function handleFocus() {
    setIsExpanded(true)
  }

  function handleBlur() {
    if (!value.trim()) {
      setIsExpanded(false)
    }
  }

  return (
    <div className={`quick-add ${isExpanded ? 'expanded' : ''}`}>
      <form onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="text"
          placeholder="Add link or note..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          autoComplete="off"
        />
        {value.trim() && (
          <button
            type="submit"
            disabled={isLoading}
            className="quick-add-btn"
          >
            {isLoading ? '...' : '+'}
          </button>
        )}
      </form>
      {isExpanded && value.trim() && (
        <div className="quick-add-hint">
          {isUrl(value) ? 'Link detected' : 'Note'} - Press Enter to add
        </div>
      )}
    </div>
  )
}
