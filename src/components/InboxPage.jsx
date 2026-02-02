import { useState, useRef, useCallback, useEffect } from 'react'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import QuickAdd from './QuickAdd'
import SwipeableItemCard from './SwipeableItemCard'
import SkeletonCard from './SkeletonCard'
import ExportModal from './ExportModal'
import EmptyStateIllustration from './EmptyStateIllustration'
import ItemArena, { useItemArena } from './ItemArena'
import CelebrationOverlay, { useCelebration } from './CelebrationOverlay'
import { getContextualAffirmation } from './Affirmations'
import { vibrate, shareItems, formatInboxForShare } from '../utils'
import useUndoDelete from '../hooks/useUndoDelete'

export default function InboxPage({ items, folders, onAdd, onDelete, onComplete, onDeleteMultiple, onMoveToFolder, onRefresh, onEdit, onReorder, onUpdate, isLoading }) {
  const [sortBy, setSortBy] = useState('newest')
  const [filterTab, setFilterTab] = useState(() => {
    return localStorage.getItem('learnlater-inbox-filter') || 'today'
  })
  const [isCompact, setIsCompact] = useState(() => {
    return localStorage.getItem('learnlater-compact-mode') === 'true'
  })
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [hasSeenHint, setHasSeenHint] = useState(() => {
    return localStorage.getItem('learnlater-swipe-hint') === 'true'
  })
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [showFolderPicker, setShowFolderPicker] = useState(false)
  const [shareToast, setShareToast] = useState(null)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [affirmation, setAffirmation] = useState(null)
  const shareMenuRef = useRef(null)
  const containerRef = useRef(null)
  const startY = useRef(0)
  const isPulling = useRef(false)

  // Celebration hook for completion animations
  const { celebration, celebrate, endCelebration } = useCelebration()

  // Item Arena hook - random chance to show auction/fight on load
  const { showArena, arenaMode, dismissArena } = useItemArena(items, 0.15)

  const {
    pendingDelete,
    handleDeleteWithUndo,
    handleUndoDelete
  } = useUndoDelete(items, onDelete)

  // Handle compact mode toggle
  const toggleCompact = useCallback(() => {
    setIsCompact(prev => {
      const next = !prev
      localStorage.setItem('learnlater-compact-mode', next.toString())
      return next
    })
  }, [])

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

  // Handle long press to pin/unpin
  const handlePin = useCallback((id) => {
    const item = items.find(i => i.id === id)
    if (item && onUpdate) {
      onUpdate(id, { pinned: !item.pinned })
    }
  }, [items, onUpdate])

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

  // Close share menu when clicking outside
  useEffect(() => {
    if (!showShareMenu) return
    function handleClick(e) {
      if (shareMenuRef.current && !shareMenuRef.current.contains(e.target)) {
        setShowShareMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('touchstart', handleClick)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('touchstart', handleClick)
    }
  }, [showShareMenu])

  // Inbox only shows link, text, image types (not watch/book items)
  // Exclude archived items
  // IMPORTANT: This must be defined before handleShare which uses it
  const inboxTypes = ['link', 'text', 'image', 'checklist']
  let inboxItems = items.filter(item => !item.folder_id && inboxTypes.includes(item.type) && !item.archived_at)

  // Helper to check if a date is today
  const isToday = (dateStr) => {
    if (!dateStr) return false
    const today = new Date()
    const date = new Date(dateStr)
    return date.getFullYear() === today.getFullYear() &&
           date.getMonth() === today.getMonth() &&
           date.getDate() === today.getDate()
  }

  // Helper to check if a date is overdue (before today)
  const isOverdue = (dateStr) => {
    if (!dateStr) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const date = new Date(dateStr)
    date.setHours(0, 0, 0, 0)
    return date < today
  }

  // Helper to check if item is "upcoming" (has future due date, not today)
  const isUpcoming = (dateStr) => {
    if (!dateStr) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const date = new Date(dateStr)
    date.setHours(0, 0, 0, 0)
    return date > today
  }

  // Handle filter tab change
  const handleFilterChange = (tab) => {
    setFilterTab(tab)
    localStorage.setItem('learnlater-inbox-filter', tab)
  }

  // Filter items based on selected tab
  // Today: no due date OR due today OR overdue
  // Upcoming: has future due date
  // All: everything
  if (filterTab === 'today') {
    inboxItems = inboxItems.filter(item =>
      !item.due_date || isToday(item.due_date) || isOverdue(item.due_date)
    )
  } else if (filterTab === 'upcoming') {
    inboxItems = inboxItems.filter(item => isUpcoming(item.due_date))
  }
  // 'all' shows everything, no filter needed

  inboxItems = [...inboxItems].sort((a, b) => {
    // Pinned items always first
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1

    // Overdue items next (sorted by due date, oldest first)
    const aOverdue = isOverdue(a.due_date)
    const bOverdue = isOverdue(b.due_date)
    if (aOverdue && !bOverdue) return -1
    if (!aOverdue && bOverdue) return 1
    if (aOverdue && bOverdue) {
      return new Date(a.due_date) - new Date(b.due_date)
    }

    // Items due today come next
    const aDueToday = isToday(a.due_date)
    const bDueToday = isToday(b.due_date)
    if (aDueToday && !bDueToday) return -1
    if (!aDueToday && bDueToday) return 1

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
      // Generate affirmation when pull threshold is reached
      const inboxTypes = ['link', 'text', 'image', 'checklist']
      const count = items.filter(item => !item.folder_id && inboxTypes.includes(item.type) && !item.archived_at).length
      setAffirmation(getContextualAffirmation(count))

      setIsRefreshing(true)
      await onRefresh()
      setIsRefreshing(false)

      // Clear affirmation after a delay
      setTimeout(() => setAffirmation(null), 2500)
    }
    setPullDistance(0)
  }, [pullDistance, onRefresh, items])

  // Wrapped complete handler that triggers celebration
  const handleCompleteWithCelebration = useCallback((id) => {
    const item = items.find(i => i.id === id)
    if (item) {
      celebrate(item.title)
    }
    onComplete(id)
  }, [items, onComplete, celebrate])

  // Handle arena selection - opens the selected item
  const handleArenaSelect = useCallback((item) => {
    if (item.type === 'link' && item.url) {
      window.open(item.url, '_blank', 'noopener,noreferrer')
    } else {
      onEdit(item)
    }
  }, [onEdit])

  return (
    <div
      className="inbox-page"
      ref={containerRef}
      onTouchStart={handlePullStart}
      onTouchMove={handlePullMove}
      onTouchEnd={handlePullEnd}
    >
      {(pullDistance > 0 || isRefreshing || affirmation) && (
        <div
          className="pull-indicator"
          style={{ height: isRefreshing || affirmation ? 60 : pullDistance }}
        >
          {isRefreshing ? (
            <div className="refresh-spinner"></div>
          ) : affirmation ? (
            <div className="affirmation">
              <span className={`affirmation-text ${affirmation.type}`}>
                {affirmation.text}
              </span>
            </div>
          ) : (
            <>
              <span
                className={`pull-arrow ${pullDistance > 60 ? 'ready' : ''}`}
                style={{ opacity: Math.min(pullDistance / 40, 1) }}
              >
                ↓
              </span>
              <span style={{ opacity: Math.min(pullDistance / 50, 1) }}>
                {pullDistance > 60 ? 'Release' : 'Pull to refresh'}
              </span>
            </>
          )}
        </div>
      )}

      <QuickAdd onAdd={onAdd} />

      <div className="filter-tabs">
        <button
          className={`filter-tab ${filterTab === 'today' ? 'active' : ''}`}
          onClick={() => handleFilterChange('today')}
        >
          Today
        </button>
        <button
          className={`filter-tab ${filterTab === 'upcoming' ? 'active' : ''}`}
          onClick={() => handleFilterChange('upcoming')}
        >
          Upcoming
        </button>
        <button
          className={`filter-tab ${filterTab === 'all' ? 'active' : ''}`}
          onClick={() => handleFilterChange('all')}
        >
          All
        </button>
      </div>

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
            <button
              className={`compact-toggle-btn ${isCompact ? 'active' : ''}`}
              onClick={toggleCompact}
              aria-label={isCompact ? 'Switch to full view' : 'Switch to compact view'}
              title={isCompact ? 'Full view' : 'Compact view'}
            >
              {isCompact ? '☰' : '▤'}
            </button>
            {inboxItems.length > 0 && (
              <div className="share-menu-container" ref={shareMenuRef}>
                <button
                  className="share-btn"
                  onClick={() => {
                    vibrate(5)
                    setShowShareMenu(!showShareMenu)
                  }}
                  aria-label="Share items"
                >
                  ↗
                </button>
                {showShareMenu && (
                  <div className="share-menu-dropdown">
                    <button
                      className="share-menu-item"
                      onClick={() => {
                        setShowShareMenu(false)
                        handleShare()
                      }}
                    >
                      📤 Share as Text
                    </button>
                    <button
                      className="share-menu-item"
                      onClick={() => {
                        setShowShareMenu(false)
                        setShowExportModal(true)
                      }}
                    >
                      📄 Export as PDF
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <button className="cancel-select-btn" onClick={clearSelection}>
            Cancel
          </button>
        )}
      </div>

      {isLoading ? (
        <SkeletonCard count={5} />
      ) : inboxItems.length === 0 ? (
        <div className="empty-state">
          <EmptyStateIllustration type="inbox" />
          <h3>Your inbox is empty</h3>
          <p>Add links, notes, or images to save them for later.</p>
          <p>Drag items to folders to organize them.</p>
        </div>
      ) : (
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          <div className="item-list">
            {inboxItems.map((item, index) => (
              <SwipeableItemCard
                key={item.id}
                item={item}
                onDelete={handleDeleteWithUndo}
                onComplete={handleCompleteWithCelebration}
                onEdit={onEdit}
                onPin={handlePin}
                showHint={index === 0 && !hasSeenHint && !selectionMode}
                selectionMode={selectionMode}
                isSelected={selectedIds.has(item.id)}
                onToggleSelect={toggleSelect}
                sortable={sortBy === 'custom' && !selectionMode}
                isCompact={isCompact}
                pendingDeleteId={pendingDelete?.id}
              />
            ))}
          </div>
        </SortableContext>
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

      {/* Undo Delete Toast */}
      {pendingDelete && (
        <div className="undo-toast">
          <span>"{pendingDelete.title.substring(0, 25)}{pendingDelete.title.length > 25 ? '...' : ''}" deleted</span>
          <button onClick={handleUndoDelete}>Undo</button>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <ExportModal
          items={inboxItems}
          tabName="Inbox"
          onClose={() => setShowExportModal(false)}
        />
      )}

      {/* Celebration Overlay */}
      <CelebrationOverlay
        show={celebration.show}
        itemTitle={celebration.title}
        onComplete={endCelebration}
      />

      {/* Item Arena (Auction/Fight modes) */}
      {showArena && (
        <ItemArena
          items={items}
          mode={arenaMode}
          onSelect={handleArenaSelect}
          onDismiss={dismissArena}
        />
      )}
    </div>
  )
}
