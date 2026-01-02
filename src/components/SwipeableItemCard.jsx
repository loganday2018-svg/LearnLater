import { useState, useRef, useEffect } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { formatDate, getHostname, truncate, vibrate } from '../utils'

export default function SwipeableItemCard({ item, onDelete, onEdit, showHint, selectionMode, isSelected, onToggleSelect }) {
  const [swipeX, setSwipeX] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)
  const [hintPlayed, setHintPlayed] = useState(false)
  const startX = useRef(0)
  const startY = useRef(0)
  const cardRef = useRef(null)

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `item-${item.id}`,
    data: { type: 'item', item }
  })

  // Play swipe hint animation on first card
  useEffect(() => {
    if (showHint && !hintPlayed) {
      const timer = setTimeout(() => {
        setSwipeX(-40)
        setTimeout(() => {
          setSwipeX(0)
          setHintPlayed(true)
        }, 400)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [showHint, hintPlayed])

  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : swipeX !== 0
        ? `translateX(${swipeX}px)`
        : undefined,
    opacity: isDragging ? 0.5 : 1,
    transition: isSwiping ? 'none' : 'transform 0.3s ease-out'
  }

  const handleTouchStart = (e) => {
    if (e.target.closest('.drag-handle') || e.target.closest('.edit-btn')) return
    startX.current = e.touches[0].clientX
    startY.current = e.touches[0].clientY
    setIsSwiping(true)
  }

  const handleTouchMove = (e) => {
    if (!isSwiping) return
    const deltaX = e.touches[0].clientX - startX.current
    const deltaY = e.touches[0].clientY - startY.current

    if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX < 0) {
      e.preventDefault()
      setSwipeX(Math.max(deltaX, -100))
    }
  }

  const handleTouchEnd = () => {
    setIsSwiping(false)
    if (swipeX < -70) {
      vibrate(15)
      setSwipeX(-window.innerWidth)
      setTimeout(() => onDelete(item.id), 200)
    } else {
      setSwipeX(0)
    }
  }

  const handleCardClick = (e) => {
    if (e.target.closest('.delete-btn') || e.target.closest('.drag-handle') || e.target.closest('.edit-btn') || e.target.closest('.select-checkbox')) return
    if (Math.abs(swipeX) > 10) return

    if (selectionMode) {
      vibrate(5)
      onToggleSelect(item.id)
      return
    }

    if (item.type === 'link' && item.url) {
      window.open(item.url, '_blank', 'noopener,noreferrer')
    } else {
      onEdit(item)
    }
  }

  const isClickable = item.type === 'link' && item.url

  return (
    <div className="swipe-container">
      <div className="swipe-action delete-action">
        <span>Delete</span>
      </div>
      <div
        ref={(node) => {
          setNodeRef(node)
          cardRef.current = node
        }}
        style={style}
        className={`item-card ${item.type} ${isDragging ? 'dragging' : ''} ${isClickable ? 'clickable' : ''} ${isSelected ? 'selected' : ''}`}
        onClick={handleCardClick}
        onTouchStart={selectionMode ? undefined : handleTouchStart}
        onTouchMove={selectionMode ? undefined : handleTouchMove}
        onTouchEnd={selectionMode ? undefined : handleTouchEnd}
      >
        {selectionMode ? (
          <label className="select-checkbox" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => {
                vibrate(5)
                onToggleSelect(item.id)
              }}
            />
            <span className="checkbox-custom"></span>
          </label>
        ) : (
          <div className="drag-handle" {...listeners} {...attributes}>
            <span className="drag-icon">⋮⋮</span>
          </div>
        )}

        <div className="card-body">
          <div className="card-header">
            <span className="card-type">
              {item.type === 'link' ? '🔗' : item.type === 'image' ? '🖼️' : '📝'}
            </span>
            <span className="card-date">{formatDate(item.created_at)}</span>
          </div>

          <h3 className="card-title">{truncate(item.title, 100)}</h3>

          {item.type === 'link' && item.url && (
            <p className="card-url">{getHostname(item.url)}</p>
          )}

          {item.type === 'link' && item.content && (
            <p className="card-notes">{truncate(item.content, 150)}</p>
          )}

          {item.type === 'text' && item.content && (
            <p className="card-content">{truncate(item.content, 300)}</p>
          )}

          {item.type === 'image' && item.image_url && (
            <div className="card-image">
              <img src={item.image_url} alt={item.title} />
            </div>
          )}

          {item.tags && item.tags.length > 0 && (
            <div className="card-tags">
              {item.tags.slice(0, 3).map(tag => (
                <span key={tag} className="card-tag">{tag}</span>
              ))}
              {item.tags.length > 3 && (
                <span className="card-tag more">+{item.tags.length - 3}</span>
              )}
            </div>
          )}
        </div>

        <div className="card-actions">
          <button
            className="edit-btn"
            onClick={(e) => {
              e.stopPropagation()
              onEdit(item)
            }}
            aria-label="Edit item"
          >
            ✎
          </button>
          <button
            className="delete-btn"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(item.id)
            }}
            aria-label="Delete item"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  )
}
