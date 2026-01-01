import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { formatDate, getHostname, truncate } from '../utils'

export default function FolderItem({
  folder,
  items,
  allFolders,
  depth = 0,
  onCreateFolder,
  onDeleteFolder,
  onDeleteItem
}) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [showCreateFolder, setShowCreateFolder] = useState(false)

  const { setNodeRef, isOver } = useDroppable({
    id: `folder-${folder.id}`,
    data: { type: 'folder', folderId: folder.id }
  })

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
          <button
            className="folder-action-btn"
            onClick={() => setShowCreateFolder(true)}
            title="Add subfolder"
          >
            +
          </button>
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
            type="text"
            placeholder="Subfolder name"
            autoFocus
            onKeyDown={async (e) => {
              if (e.key === 'Enter' && e.target.value.trim()) {
                await onCreateFolder(e.target.value.trim(), folder.id)
                setShowCreateFolder(false)
              } else if (e.key === 'Escape') {
                setShowCreateFolder(false)
              }
            }}
            onBlur={() => setShowCreateFolder(false)}
          />
        </div>
      )}
    </div>
  )
}
