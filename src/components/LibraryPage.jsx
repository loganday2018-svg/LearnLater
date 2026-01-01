import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import FolderItem from './FolderItem'
import CreateFolder from './CreateFolder'

function RootDropZone({ children }) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'library-root',
    data: { type: 'library-root' }
  })

  return (
    <div ref={setNodeRef} className={`library-root ${isOver ? 'drop-target' : ''}`}>
      {children}
    </div>
  )
}

export default function LibraryPage({
  items,
  folders,
  onCreateFolder,
  onDeleteFolder,
  onDeleteItem
}) {
  const [showCreateFolder, setShowCreateFolder] = useState(false)

  // Get root-level folders (no parent)
  const rootFolders = folders
    .filter(f => !f.parent_id)
    .sort((a, b) => a.position - b.position)

  // Items not in any folder but moved to library (shouldn't happen with current flow)
  const orphanItems = items.filter(item => item.folder_id && !folders.find(f => f.id === item.folder_id))

  return (
    <div className="library-page">
      <div className="library-header">
        <h2>Library</h2>
        <button className="add-folder-btn" onClick={() => setShowCreateFolder(true)}>
          + New Folder
        </button>
      </div>

      <RootDropZone>
        {rootFolders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📁</div>
            <h3>No folders yet</h3>
            <p>Create folders to organize your saved items.</p>
            <p>Drag items from Inbox to folders here.</p>
          </div>
        ) : (
          <div className="folder-tree">
            {rootFolders.map(folder => (
              <FolderItem
                key={folder.id}
                folder={folder}
                items={items}
                allFolders={folders}
                depth={0}
                onCreateFolder={onCreateFolder}
                onDeleteFolder={onDeleteFolder}
                onDeleteItem={onDeleteItem}
              />
            ))}
          </div>
        )}
      </RootDropZone>

      {showCreateFolder && (
        <CreateFolder
          parentId={null}
          onClose={() => setShowCreateFolder(false)}
          onCreate={async (name, parentId) => {
            const success = await onCreateFolder(name, parentId)
            return success
          }}
        />
      )}
    </div>
  )
}
