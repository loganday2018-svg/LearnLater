import { useState, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { vibrate } from '../utils'

export default function FloatingAddButton({ onAdd }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const longPressTimer = useRef(null)
  const isLongPress = useRef(false)
  const menuRef = useRef(null)
  const location = useLocation()

  // Determine menu options based on current page
  const getMenuConfig = () => {
    const path = location.pathname

    if (path === '/watch') {
      return {
        default: 'movie',
        items: [
          { type: 'movie', icon: '🎬', label: 'Movie' },
          { type: 'show', icon: '📺', label: 'TV Show' },
          { type: 'youtube', icon: '▶️', label: 'YouTube' },
        ]
      }
    }

    if (path === '/books') {
      return {
        default: 'book',
        items: [
          { type: 'book', icon: '📖', label: 'Book' },
        ]
      }
    }

    // Default (Inbox and Long Term Notes)
    return {
      default: 'link',
      items: [
        { type: 'link', icon: '🔗', label: 'Link' },
        { type: 'text', icon: '📝', label: 'Note' },
        { type: 'image', icon: '🖼️', label: 'Image' },
      ]
    }
  }

  const menuConfig = getMenuConfig()

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

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false)
  }, [location.pathname])

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
      vibrate(10)
      // If only one option, just use it directly
      if (menuConfig.items.length === 1) {
        onAdd(menuConfig.items[0].type)
      } else {
        // Show menu on tap instead of going directly to default
        setIsMenuOpen(true)
      }
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

  // Don't show multi-option menu if only one item
  const showMenu = isMenuOpen && menuConfig.items.length > 1

  return (
    <div className="fab-container" ref={menuRef}>
      {showMenu && (
        <div className="fab-menu">
          {menuConfig.items.map(item => (
            <button
              key={item.type}
              className="fab-menu-item"
              onClick={() => handleMenuSelect(item.type)}
            >
              <span className="fab-menu-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
      <button
        className={`fab-button ${showMenu ? 'active' : ''}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        onMouseDown={handleTouchStart}
        onMouseUp={handleTouchEnd}
        onMouseLeave={() => clearTimeout(longPressTimer.current)}
        aria-label="Add new item"
      >
        <span className="fab-icon">{showMenu ? '×' : '+'}</span>
      </button>
    </div>
  )
}
