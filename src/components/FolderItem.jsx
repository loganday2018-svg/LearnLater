import { useState, useRef, useEffect } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { formatDate, getHostname, truncate } from '../utils'

export default function FolderItem({
  folder,
  items,
  allFolders,
  depth = 0,
  onCreateFolder,
  onDeleteFolder,
  onDeleteItem,
  onAddItem
}) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [subfolderName, setSubfolderName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const inputRef = useRef(null)
  const menuRef = useRef(null)

  const { setNodeRef, isOver } = useDroppable({
    id: `folder-${folder.id}`,
    data: { type: 'folder', folderId: folder.id }
  })

  // Close menu when clicking outside
  useEffect(() => {
    if (!showAddMenu) return
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowAddMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('touchstart', handleClick)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('touchstart', handleClick)
    }
  }, [showAddMenu])

  // Get child folders
  const childFolders = allFolders
    .filter(f => f.parent_id === folder.id)
    .sort((a, b) => a.position - b.position)

  // Get items in this folder
  const folderItems = items.filter(item => item.folder_id === folder.id)

  return (
    <div className="folder-item" style={{ marginLeft: depth * 16 }}>
      <div
        ref={setNodeRef}
        className={`folder-header ${isOver ? 'drop-target' : ''}`}
      >
        <button
          className="folder-toggle"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? '▼' : '▶'}
        </button>
        <span className="folder-icon">📁</span>
        <span className="folder-name">{folder.name}</span>
        <span className="folder-count">
          {folderItems.length + childFolders.length > 0
            ? `(${folderItems.length} items, ${childFolders.length} folders)`
            : ''}
        </span>
        <div className="folder-actions">
          <div className="add-menu-container" ref={menuRef}>
            <button
              className="folder-action-btn"
              onClick={() => setShowAddMenu(!showAddMenu)}
              title="Add to folder"
            >
              +
            </button>
            {showAddMenu && (
              <div className="add-menu-dropdown">
                <button
                  className="add-menu-item"
                  onClick={() => {
                    setShowAddMenu(false)
                    onAddItem && onAddItem(folder.id)
                  }}
                >
                  📝 Add Note
                </button>
                <button
                  className="add-menu-item"
                  onClick={() => {
                    setShowAddMenu(false)
                    setShowCreateFolder(true)
                  }}
                >
                  📁 Add Subfolder
                </button>
              </div>
            )}
          </div>
          <button
            className="folder-action-btn delete"
            onClick={() => onDeleteFolder(folder.id)}
            title="Delete folder"
          >
            ×
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="folder-content">
          {/* Child folders */}
          {childFolders.map(childFolder => (
            <FolderItem
              key={childFolder.id}
              folder={childFolder}
              items={items}
              allFolders={allFolders}
              depth={depth + 1}
              onCreateFolder={onCreateFolder}
              onDeleteFolder={onDeleteFolder}
              onDeleteItem={onDeleteItem}
              onAddItem={onAddItem}
            />
          ))}

          {/* Items in folder */}
          {folderItems.map(item => (
            <div key={item.id} className={`library-item ${item.type}`}>
              <span className="item-icon">
                {item.type === 'link' ? '🔗' : item.type === 'image' ? '🖼️' : '📝'}
              </span>
              <div className="item-content">
                <h4>
                  {item.type === 'link' && item.url ? (
                    <a href={item.url} target="_blank" rel="noopener noreferrer">
                      {truncate(item.title, 80)}
                    </a>
                  ) : (
                    truncate(item.title, 80)
                  )}
                </h4>
                {item.type === 'link' && item.url && (
                  <span className="item-url">{getHostname(item.url)}</span>
                )}
                {item.type === 'text' && item.content && (
                  <p className="item-text">{truncate(item.content, 150)}</p>
                )}
                {item.type === 'image' && item.image_url && (
                  <img className="item-thumbnail" src={item.image_url} alt={item.title} />
                )}
              </div>
              <span className="item-date">{formatDate(item.created_at)}</span>
              <button
                className="item-delete-btn"
                onClick={() => onDeleteItem(item.id)}
              >
                ×
              </button>
            </div>
          ))}

          {folderItems.length === 0 && childFolders.length === 0 && (
            <div className="folder-empty">
              <span>📋</span> Drag items here from Inbox
            </div>
          )}
        </div>
      )}

      {showCreateFolder && (
        <div className="inline-create-folder">
          <input
            ref={inputRef}
            type="text"
            placeholder="Subfolder name"
            value={subfolderName}
            onChange={(e) => setSubfolderName(e.target.value)}
            autoFocus
            disabled={isCreating}
            onKeyDown={async (e) => {
              if (e.key === 'Enter' && subfolderName.trim() && !isCreating) {
                e.preventDefault()
                setIsCreating(true)
                try {
                  await onCreateFolder(subfolderName.trim(), folder.id)
                  setSubfolderName('')
                  setShowCreateFolder(false)
                } finally {
                  setIsCreating(false)
                }
              } else if (e.key === 'Escape') {
                setSubfolderName('')
                setShowCreateFolder(false)
              }
            }}
            onBlur={() => {
              // Only close if not creating
              if (!isCreating) {
                setTimeout(() => {
                  setSubfolderName('')
                  setShowCreateFolder(false)
                }, 150)
              }
            }}
          />
          <button
            className="create-subfolder-btn"
            disabled={!subfolderName.trim() || isCreating}
            onClick={async () => {
              if (subfolderName.trim() && !isCreating) {
                setIsCreating(true)
                try {
                  await onCreateFolder(subfolderName.trim(), folder.id)
                  setSubfolderName('')
                  setShowCreateFolder(false)
                } finally {
                  setIsCreating(false)
                }
              }
            }}
          >
            {isCreating ? '...' : '✓'}
          </button>
        </div>
      )}
    </div>
  )
}
