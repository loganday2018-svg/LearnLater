import { useState, useRef, useCallback, useEffect } from 'react'
import AddItem from './AddItem'
import SwipeableItemCard from './SwipeableItemCard'
import { vibrate } from '../utils'

export default function InboxPage({ items, folders, onAdd, onDelete, onDeleteMultiple, onMoveToFolder, onRefresh, onEdit }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [hasSeenHint, setHasSeenHint] = useState(() => {
    return localStorage.getItem('learnlater-swipe-hint') === 'true'
  })
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [showFolderPicker, setShowFolderPicker] = useState(false)
  const containerRef = useRef(null)
  const startY = useRef(0)
  const isPulling = useRef(false)

  // Exit selection mode when no items selected
  useEffect(() => {
    if (selectionMode && selectedIds.size === 0) {
      const timer = setTimeout(() => {
        if (selectedIds.size === 0) setSelectionMode(false)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [selectedIds.size, selectionMode])

  const toggleSelect = useCallback((id) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const selectAll = useCallback(() => {
    vibrate(10)
    const allIds = items.filter(item => !item.folder_id).map(item => item.id)
    setSelectedIds(new Set(allIds))
  }, [items])

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
    setSelectionMode(false)
  }, [])

  const handleDeleteSelected = useCallback(() => {
    vibrate([10, 50, 10])
    if (onDeleteMultiple) {
      onDeleteMultiple([...selectedIds])
    } else {
      selectedIds.forEach(id => onDelete(id))
    }
    clearSelection()
  }, [selectedIds, onDeleteMultiple, onDelete, clearSelection])

  const handleMoveSelected = useCallback((folderId) => {
    vibrate(10)
    if (onMoveToFolder) {
      selectedIds.forEach(id => onMoveToFolder(id, folderId))
    }
    setShowFolderPicker(false)
    clearSelection()
  }, [selectedIds, onMoveToFolder, clearSelection])

  // Mark hint as seen after showing
  useEffect(() => {
    if (!hasSeenHint) {
      const timer = setTimeout(() => {
        localStorage.setItem('learnlater-swipe-hint', 'true')
        setHasSeenHint(true)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [hasSeenHint])

  let inboxItems = items.filter(item => !item.folder_id)

  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase()
    // Check if searching for a tag (starts with #)
    const isTagSearch = query.startsWith('#')
    const searchTerm = isTagSearch ? query.slice(1) : query

    inboxItems = inboxItems.filter(item => {
      if (isTagSearch) {
        // Search only in tags
        return item.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
      }
      // Search in title, content, url, and tags
      return (
        item.title?.toLowerCase().includes(query) ||
        item.content?.toLowerCase().includes(query) ||
        item.url?.toLowerCase().includes(query) ||
        item.tags?.some(tag => tag.toLowerCase().includes(query))
      )
    })
  }

  inboxItems = [...inboxItems].sort((a, b) => {
    switch (sortBy) {
      case 'oldest':
        return new Date(a.created_at) - new Date(b.created_at)
      case 'alpha':
        return (a.title || '').localeCompare(b.title || '')
      case 'type':
        return (a.type || '').localeCompare(b.type || '')
      case 'newest':
      default:
        return new Date(b.created_at) - new Date(a.created_at)
    }
  })

  const handlePullStart = useCallback((e) => {
    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY
      isPulling.current = true
    }
  }, [])

  const handlePullMove = useCallback((e) => {
    if (!isPulling.current) return
    const deltaY = e.touches[0].clientY - startY.current
    if (deltaY > 0 && containerRef.current?.scrollTop === 0) {
      setPullDistance(Math.min(deltaY * 0.5, 80))
    }
  }, [])

  const handlePullEnd = useCallback(async () => {
    isPulling.current = false
    if (pullDistance > 60 && onRefresh) {
      setIsRefreshing(true)
      await onRefresh()
      setIsRefreshing(false)
    }
    setPullDistance(0)
  }, [pullDistance, onRefresh])

  return (
    <div
      className="inbox-page"
      ref={containerRef}
      onTouchStart={handlePullStart}
      onTouchMove={handlePullMove}
      onTouchEnd={handlePullEnd}
    >
      {(pullDistance > 0 || isRefreshing) && (
        <div
          className="pull-indicator"
          style={{ height: isRefreshing ? 50 : pullDistance }}
        >
          {isRefreshing ? (
            <div className="refresh-spinner"></div>
          ) : (
            <span style={{ opacity: pullDistance / 60 }}>
              {pullDistance > 60 ? '↓ Release to refresh' : '↓ Pull to refresh'}
            </span>
          )}
        </div>
      )}

      <AddItem onAdd={onAdd} />

      <div className="controls-bar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search or #tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search" onClick={() => setSearchQuery('')}>×</button>
          )}
        </div>
        {!selectionMode ? (
          <>
            <select
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="alpha">A-Z</option>
              <option value="type">Type</option>
            </select>
            {inboxItems.length > 0 && (
              <button
                className="select-mode-btn"
                onClick={() => {
                  vibrate(5)
                  setSelectionMode(true)
                }}
                aria-label="Select items"
              >
                ☑
              </button>
            )}
          </>
        ) : (
          <button className="cancel-select-btn" onClick={clearSelection}>
            Cancel
          </button>
        )}
      </div>

      {inboxItems.length === 0 ? (
        <div className="empty-state">
          {searchQuery ? (
            <>
              <div className="empty-state-icon">🔍</div>
              <h3>No matches found</h3>
              <p>Try a different search term</p>
            </>
          ) : (
            <>
              <div className="empty-state-icon">📥</div>
              <h3>Your inbox is empty</h3>
              <p>Add links, notes, or images to save them for later.</p>
              <p>Drag items to Library folders to organize them.</p>
            </>
          )}
        </div>
      ) : (
        <div className="item-list">
          {inboxItems.map((item, index) => (
            <SwipeableItemCard
              key={item.id}
              item={item}
              onDelete={onDelete}
              onEdit={onEdit}
              showHint={index === 0 && !hasSeenHint && !selectionMode}
              selectionMode={selectionMode}
              isSelected={selectedIds.has(item.id)}
              onToggleSelect={toggleSelect}
            />
          ))}
        </div>
      )}

      {/* Selection Action Bar */}
      {selectionMode && selectedIds.size > 0 && (
        <div className="selection-bar">
          <span className="selection-count">{selectedIds.size} selected</span>
          <div className="selection-actions">
            <button className="select-all-btn" onClick={selectAll}>
              All
            </button>
            {folders && folders.length > 0 && (
              <button className="move-selected-btn" onClick={() => setShowFolderPicker(true)}>
                Move
              </button>
            )}
            <button className="delete-selected-btn" onClick={handleDeleteSelected}>
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Folder Picker Modal */}
      {showFolderPicker && (
        <div className="modal-overlay" onClick={() => setShowFolderPicker(false)}>
          <div className="modal-content folder-picker" onClick={e => e.stopPropagation()}>
            <div className="folder-picker-header">
              <h3>Move to folder</h3>
              <button className="close-btn" onClick={() => setShowFolderPicker(false)}>×</button>
            </div>
            <div className="folder-picker-list">
              {folders && folders.filter(f => !f.parent_id).map(folder => (
                <button
                  key={folder.id}
                  className="folder-picker-item"
                  onClick={() => handleMoveSelected(folder.id)}
                >
                  <span className="folder-icon">📁</span>
                  <span className="folder-name">{folder.name}</span>
                </button>
              ))}
              {(!folders || folders.length === 0) && (
                <p className="no-folders">No folders yet. Create one in Library first.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
