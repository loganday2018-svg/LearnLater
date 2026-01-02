import { useState, useRef, useEffect } from 'react'
import { vibrate } from '../utils'

export default function TagInput({ tags = [], onChange, allTags = [] }) {
  const [inputValue, setInputValue] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)
  const containerRef = useRef(null)

  // Filter suggestions based on input
  const suggestions = inputValue.trim()
    ? allTags
        .filter(tag =>
          tag.toLowerCase().includes(inputValue.toLowerCase()) &&
          !tags.includes(tag)
        )
        .slice(0, 5)
    : []

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function addTag(tag) {
    const normalizedTag = tag.trim().toLowerCase()
    if (normalizedTag && !tags.includes(normalizedTag)) {
      vibrate(5)
      onChange([...tags, normalizedTag])
    }
    setInputValue('')
    setShowSuggestions(false)
    setSelectedIndex(0)
    inputRef.current?.focus()
  }

  function removeTag(tagToRemove) {
    vibrate(5)
    onChange(tags.filter(tag => tag !== tagToRemove))
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (suggestions.length > 0 && showSuggestions) {
        addTag(suggestions[selectedIndex])
      } else if (inputValue.trim()) {
        addTag(inputValue)
      }
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1])
    } else if (e.key === 'ArrowDown' && showSuggestions) {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp' && showSuggestions) {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    } else if (e.key === ',' || e.key === 'Tab') {
      if (inputValue.trim()) {
        e.preventDefault()
        addTag(inputValue)
      }
    }
  }

  function handleInputChange(e) {
    const value = e.target.value
    // Don't allow commas in tag names
    if (value.includes(',')) {
      const parts = value.split(',')
      parts.forEach((part, i) => {
        if (part.trim() && i < parts.length - 1) {
          addTag(part)
        }
      })
      setInputValue(parts[parts.length - 1])
    } else {
      setInputValue(value)
      setShowSuggestions(value.trim().length > 0)
      setSelectedIndex(0)
    }
  }

  return (
    <div className="tag-input-container" ref={containerRef}>
      <div className="tag-input-wrapper" onClick={() => inputRef.current?.focus()}>
        {tags.map(tag => (
          <span key={tag} className="tag">
            {tag}
            <button
              type="button"
              className="tag-remove"
              onClick={(e) => {
                e.stopPropagation()
                removeTag(tag)
              }}
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => inputValue.trim() && setShowSuggestions(true)}
          placeholder={tags.length === 0 ? 'Add tags...' : ''}
          className="tag-input"
        />
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="tag-suggestions">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion}
              type="button"
              className={`tag-suggestion ${index === selectedIndex ? 'selected' : ''}`}
              onClick={() => addTag(suggestion)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
