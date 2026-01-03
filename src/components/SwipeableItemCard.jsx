import { useState, useRef, useEffect } from 'react'
import { useSortable, defaultAnimateLayoutChanges } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { formatDate, getHostname, truncate, vibrate } from '../utils'

// Custom animation that's faster and smoother
const animateLayoutChanges = (args) => {
  const { isSorting, wasDragging } = args
  if (isSorting || wasDragging) {
    return defaultAnimateLayoutChanges(args)
  }
  return true
}

// Helper to get due date status and formatted text
function getDueDateInfo(dueDate) {
  if (!dueDate) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const due = new Date(dueDate + 'T00:00:00')
  const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24))

  let status = 'normal'
  let text = ''

  if (diffDays < 0) {
    status = 'overdue'
    text = diffDays === -1 ? 'Yesterday' : `${Math.abs(diffDays)}d overdue`
  } else if (diffDays === 0) {
    status = 'due-soon'
    text = 'Today'
  } else if (diffDays === 1) {
    status = 'due-soon'
    text = 'Tomorrow'
  } else if (diffDays <= 3) {
    status = 'due-soon'
    text = `In ${diffDays} days`
  } else {
    text = due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return { status, text }
}

export default function SwipeableItemCard({ item, onDelete, onEdit, showHint, selectionMode, isSelected, onToggleSelect, sortable = false }) {
  const [swipeX, setSwipeX] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)
  const [hintPlayed, setHintPlayed] = useState(false)
  const startX = useRef(0)
  const startY = useRef(0)
  const cardRef = useRef(null)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isSorting,
    over
  } = useSortable({
    id: item.id,
    data: { type: 'item', item },
    disabled: !sortable,
    animateLayoutChanges
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

  // Haptic feedback when drag starts
  useEffect(() => {
    if (isDragging) {
      vibrate(10)
    }
  }, [isDragging])

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

  // Separate styles: container gets sortable transform, card gets swipe transform
  const containerStyle = {
    transform: CSS.Transform.toString(transform),
    transition: isSwiping ? 'none' : 'transform 200ms cubic-bezier(0.25, 1, 0.5, 1)',
    zIndex: isDragging ? 1000 : undefined,
  }

  const cardStyle = {
    transform: swipeX !== 0 ? `translateX(${swipeX}px)` : undefined,
    transition: isSwiping ? 'none' : 'transform 0.3s ease-out',
    opacity: isDragging ? 0.5 : 1,
    boxShadow: isDragging ? '0 12px 28px rgba(0, 122, 255, 0.35)' : undefined,
  }

  return (
    <div
      ref={setNodeRef}
      style={containerStyle}
      className={`swipe-container ${isDragging ? 'is-dragging' : ''}`}
    >
      <div className="swipe-action delete-action">
        <span>Delete</span>
      </div>
      <div
        ref={cardRef}
        style={cardStyle}
        className={`item-card ${item.type} ${isDragging ? 'dragging' : ''} ${isClickable ? 'clickable' : ''} ${isSelected ? 'selected' : ''} ${item.due_date && getDueDateInfo(item.due_date)?.status === 'overdue' ? 'overdue' : ''}`}
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
            {item.due_date && (() => {
              const dueDateInfo = getDueDateInfo(item.due_date)
              return dueDateInfo && (
                <span className={`due-date-badge ${dueDateInfo.status}`}>
                  📅 {dueDateInfo.text}
                </span>
              )
            })()}
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
