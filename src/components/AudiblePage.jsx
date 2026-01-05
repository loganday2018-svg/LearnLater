import { useState } from 'react'
import FolderItem from './FolderItem'
import CreateFolder from './CreateFolder'
import AddItem from './AddItem'
import EmptyStateIllustration from './EmptyStateIllustration'

export default function AudiblePage({
  items,
  folders,
  onCreateFolder,
  onDeleteFolder,
  onDeleteItem,
  onAddItem,
  onShareFolder
}) {
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [addToFolderId, setAddToFolderId] = useState(null)

  // Get root-level audible folders (no parent)
  const rootFolders = folders
    .filter(f => !f.parent_id && f.folder_type === 'audible')
    .sort((a, b) => a.position - b.position)

  return (
    <div className="library-page audible-page">
      <div className="library-header">
        <h2>Audible Notes</h2>
        <button className="add-folder-btn" onClick={() => setShowCreateFolder(true)}>
          + New Audiobook
        </button>
      </div>

      <div className="library-root">
        {rootFolders.length === 0 ? (
          <div className="empty-state">
            <EmptyStateIllustration type="audible" />
            <h3>No audiobooks yet</h3>
            <p>Create a folder for each audiobook you're listening to.</p>
            <p>Add notes as you listen!</p>
          </div>
        ) : (
          <div className="folder-tree">
            {rootFolders.map(folder => (
              <FolderItem
                key={folder.id}
                folder={folder}
                items={items}
                allFolders={folders.filter(f => f.folder_type === 'audible')}
                depth={0}
                onCreateFolder={(name, parentId) => onCreateFolder(name, parentId, 'audible')}
                onDeleteFolder={onDeleteFolder}
                onDeleteItem={onDeleteItem}
                onAddItem={setAddToFolderId}
                onShareFolder={onShareFolder}
              />
            ))}
          </div>
        )}
      </div>

      {showCreateFolder && (
        <CreateFolder
          parentId={null}
          onClose={() => setShowCreateFolder(false)}
          onCreate={async (name, parentId) => {
            const success = await onCreateFolder(name, parentId, 'audible')
            return success
          }}
          placeholder="Audiobook title"
          title="Add Audiobook"
        />
      )}

      {/* Add Item to Folder Modal */}
      {addToFolderId && (
        <AddItem
          onAdd={async (item) => {
            const success = await onAddItem({ ...item, folder_id: addToFolderId })
            if (success) setAddToFolderId(null)
            return success
          }}
          initialType="text"
          onClose={() => setAddToFolderId(null)}
        />
      )}
    </div>
  )
}
