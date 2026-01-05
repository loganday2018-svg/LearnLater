import { useState, useRef, useEffect } from 'react'
import { useSortable, defaultAnimateLayoutChanges } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { vibrate } from '../utils'

const animateLayoutChanges = (args) => {
  const { isSorting, wasDragging } = args
  if (isSorting || wasDragging) {
    return defaultAnimateLayoutChanges(args)
  }
  return true
}

export default function SwipeableCard({
  id,
  children,
  onDelete,
  onLongPress,
  sortable = true,
  className = '',
  style = {}
}) {
  const [swipeX, setSwipeX] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)
  const startX = useRef(0)
  const startY = useRef(0)
  const longPressTimer = useRef(null)
  const hasMovedRef = useRef(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    disabled: !sortable,
    animateLayoutChanges
  })

  // Haptic feedback when drag starts
  useEffect(() => {
    if (isDragging) {
      vibrate(10)
    }
  }, [isDragging])

  // Cleanup long press timer
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
      }
    }
  }, [])

  const handleTouchStart = (e) => {
    if (e.target.closest('.drag-handle') || e.target.closest('.edit-btn')) return
    startX.current = e.touches[0].clientX
    startY.current = e.touches[0].clientY
    hasMovedRef.current = false
    setIsSwiping(true)

    // Start long press timer for pin
    if (onLongPress) {
      longPressTimer.current = setTimeout(() => {
        if (!hasMovedRef.current) {
          vibrate([10, 50, 10])
          onLongPress(id)
        }
      }, 500)
    }
  }

  const handleTouchMove = (e) => {
    if (!isSwiping) return
    const deltaX = e.touches[0].clientX - startX.current
    const deltaY = e.touches[0].clientY - startY.current

    // Cancel long press if moved
    if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
      hasMovedRef.current = true
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
      }
    }

    // Swipe left for delete
    if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX < 0) {
      e.preventDefault()
      setSwipeX(Math.max(deltaX, -100))
    }
  }

  const handleTouchEnd = () => {
    setIsSwiping(false)
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
    }

    if (swipeX < -70) {
      vibrate(15)
      setSwipeX(-window.innerWidth)
      setTimeout(() => onDelete(id), 200)
    } else {
      setSwipeX(0)
    }
  }

  const containerStyle = {
    transform: CSS.Transform.toString(transform),
    transition: isSwiping ? 'none' : 'transform 200ms cubic-bezier(0.25, 1, 0.5, 1)',
    zIndex: isDragging ? 1000 : undefined,
    ...style
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
      className={`swipeable-card-container ${isDragging ? 'is-dragging' : ''}`}
    >
      <div className="swipe-action delete-action">
        <span>Delete</span>
      </div>
      <div
        style={cardStyle}
        className={`swipeable-card-inner ${className}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {sortable && (
          <div className="drag-handle" {...listeners} {...attributes}>
            <span className="drag-icon">⋮⋮</span>
          </div>
        )}
        <div className="swipeable-card-content">
          {children}
        </div>
      </div>
    </div>
  )
}
