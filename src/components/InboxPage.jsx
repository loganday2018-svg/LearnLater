import { useState, useRef, useCallback, useEffect } from 'react'
import AddItem from './AddItem'
import SwipeableItemCard from './SwipeableItemCard'
import { vibrate, shareItems, formatInboxForShare } from '../utils'

export default function InboxPage({ items, folders, onAdd, onDelete, onDeleteMultiple, onMoveToFolder, onRefresh, onEdit, onReorder }) {
  const [sortBy, setSortBy] = useState('custom')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [hasSeenHint, setHasSeenHint] = useState(() => {
    return localStorage.getItem('learnlater-swipe-hint') === 'true'
  })
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [showFolderPicker, setShowFolderPicker] = useState(false)
  const [shareToast, setShareToast] = useState(null)
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

  // Inbox only shows link, text, image types (not watch/book items)
  // IMPORTANT: This must be defined before handleShare which uses it
  const inboxTypes = ['link', 'text', 'image', 'checklist']
  let inboxItems = items.filter(item => !item.folder_id && inboxTypes.includes(item.type))

  inboxItems = [...inboxItems].sort((a, b) => {
    switch (sortBy) {
      case 'custom':
        // Use sort_order if available, otherwise fall back to created_at
        const orderA = a.sort_order ?? Number.MAX_SAFE_INTEGER
        const orderB = b.sort_order ?? Number.MAX_SAFE_INTEGER
        if (orderA !== orderB) return orderA - orderB
        return new Date(b.created_at) - new Date(a.created_at)
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

  // handleShare must be defined AFTER inboxItems
  const handleShare = useCallback(async () => {
    vibrate(10)
    const result = await shareItems('My Saved Items', inboxItems, formatInboxForShare)
    if (result.success) {
      setShareToast(result.method === 'share' ? 'Shared!' : 'Copied to clipboard!')
      setTimeout(() => setShareToast(null), 2000)
    }
  }, [inboxItems])

  // Get IDs for SortableContext
  const itemIds = inboxItems.map(item => item.id)

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
        {!selectionMode ? (
          <>
            <select
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="custom">Custom</option>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="alpha">A-Z</option>
              <option value="type">Type</option>
            </select>
            {inboxItems.length > 0 && (
              <>
                <button
                  className="share-btn"
                  onClick={handleShare}
                  aria-label="Share items"
                >
                  ↗
                </button>
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
              </>
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
          <div className="empty-state-icon">📥</div>
          <h3>Your inbox is empty</h3>
          <p>Add links, notes, or images to save them for later.</p>
          <p>Drag items to folders to organize them.</p>
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
              sortable={false}
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

      {/* Share Toast */}
      {shareToast && (
        <div className="share-toast">{shareToast}</div>
      )}
    </div>
  )
}
