import { useState, useRef, useEffect } from 'react'
import { vibrate } from '../utils'

export default function FloatingAddButton({ onAdd }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const longPressTimer = useRef(null)
  const isLongPress = useRef(false)
  const menuRef = useRef(null)

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false)
      }
    }
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [isMenuOpen])

  function handleTouchStart() {
    isLongPress.current = false
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true
      vibrate(20)
      setIsMenuOpen(true)
    }, 400)
  }

  function handleTouchEnd(e) {
    clearTimeout(longPressTimer.current)
    if (!isLongPress.current) {
      // Short tap - open default (link)
      vibrate(10)
      onAdd('link')
    }
    e.preventDefault()
  }

  function handleTouchMove() {
    clearTimeout(longPressTimer.current)
  }

  function handleMenuSelect(type) {
    vibrate(10)
    setIsMenuOpen(false)
    onAdd(type)
  }

  return (
    <div className="fab-container" ref={menuRef}>
      {isMenuOpen && (
        <div className="fab-menu">
          <button
            className="fab-menu-item"
            onClick={() => handleMenuSelect('link')}
          >
            <span className="fab-menu-icon">🔗</span>
            <span>Link</span>
          </button>
          <button
            className="fab-menu-item"
            onClick={() => handleMenuSelect('text')}
          >
            <span className="fab-menu-icon">📝</span>
            <span>Note</span>
          </button>
          <button
            className="fab-menu-item"
            onClick={() => handleMenuSelect('image')}
          >
            <span className="fab-menu-icon">🖼️</span>
            <span>Image</span>
          </button>
          <button
            className="fab-menu-item"
            onClick={() => handleMenuSelect('checklist')}
          >
            <span className="fab-menu-icon">☑️</span>
            <span>Checklist</span>
          </button>
        </div>
      )}
      <button
        className={`fab-button ${isMenuOpen ? 'active' : ''}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        onMouseDown={handleTouchStart}
        onMouseUp={handleTouchEnd}
        onMouseLeave={() => clearTimeout(longPressTimer.current)}
        aria-label="Add new item"
      >
        <span className="fab-icon">{isMenuOpen ? '×' : '+'}</span>
      </button>
    </div>
  )
}
