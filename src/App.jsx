import { useState, useEffect, useMemo } from 'react'
import { Routes, Route } from 'react-router-dom'
import { DndContext, TouchSensor, MouseSensor, useSensor, useSensors, closestCenter, DragOverlay } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { supabase } from './supabaseClient'
import { getNextDueDate } from './utils'
import Auth from './components/Auth'
import BottomNav from './components/BottomNav'
import InboxPage from './components/InboxPage'
import LibraryPage from './components/LibraryPage'
import ShareHandler from './components/ShareHandler'
import EditItem from './components/EditItem'
import FloatingAddButton from './components/FloatingAddButton'
import AddItem from './components/AddItem'
import WatchListPage from './components/WatchListPage'
import BooksPage from './components/BooksPage'
import ProjectsPage from './components/ProjectsPage'
import CountdownPage from './components/CountdownPage'
import MenuOverlay from './components/MenuOverlay'
import SharedFolderPage from './components/SharedFolderPage'
import './App.css'

function App() {
  const [session, setSession] = useState(null)
  const [items, setItems] = useState([])
  const [folders, setFolders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [editingItem, setEditingItem] = useState(null)
  const [addItemType, setAddItemType] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)

  // Calculate all unique tags from items for autocomplete
  const allTags = useMemo(() => {
    const tagSet = new Set()
    items.forEach(item => {
      if (item.tags && Array.isArray(item.tags)) {
        item.tags.forEach(tag => tagSet.add(tag))
      }
    })
    return Array.from(tagSet).sort()
  }, [items])

  // Touch sensor configuration
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      distance: 8,
    }
  })

  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 8
    }
  })

  const sensors = useSensors(touchSensor, mouseSensor)

  // Handle drag end for reordering
  async function handleDragEnd(event) {
    const { active, over } = event

    if (!over || active.id === over.id) return

    // Get inbox items (non-folder items)
    const inboxTypes = ['link', 'text', 'image', 'checklist']
    const inboxItems = items.filter(item => !item.folder_id && inboxTypes.includes(item.type))

    const oldIndex = inboxItems.findIndex(item => item.id === active.id)
    const newIndex = inboxItems.findIndex(item => item.id === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    // Reorder locally first
    const reorderedInbox = arrayMove(inboxItems, oldIndex, newIndex)

    // Update sort_order for all reordered items
    const updatedItems = items.map(item => {
      const newPosition = reorderedInbox.findIndex(i => i.id === item.id)
      if (newPosition !== -1) {
        return { ...item, sort_order: newPosition }
      }
      return item
    })

    setItems(updatedItems)

    // Persist to database
    try {
      const updates = reorderedInbox.map((item, index) => ({
        id: item.id,
        sort_order: index
      }))

      for (const update of updates) {
        await supabase
          .from('items')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id)
      }
    } catch (err) {
      console.error('Error saving order:', err)
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    }).catch(err => {
      console.error('Error getting session:', err)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session) {
      fetchItems()
      fetchFolders()
    }
  }, [session])

  async function fetchItems() {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching items:', error)
        setError('Failed to load items')
      } else {
        setItems(data || [])
        setError(null)
      }
    } catch (err) {
      console.error('Network error:', err)
      setError('Network error - please try again')
    }
  }

  async function fetchFolders() {
    try {
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .order('position', { ascending: true })

      if (error) {
        console.error('Error fetching folders:', error)
      } else {
        setFolders(data || [])
      }
    } catch (err) {
      console.error('Network error:', err)
    }
  }

  async function addItem(newItem) {
    setError(null)

    try {
      const { data, error } = await supabase
        .from('items')
        .insert([{ ...newItem, user_id: session.user.id }])
        .select()

      if (error) {
        console.error('Error adding item:', error)
        setError('Failed to save item')
        return false
      }

      setItems([data[0], ...items])
      return true
    } catch (err) {
      console.error('Network error:', err)
      setError('Network error - please try again')
      return false
    }
  }

  function deleteItem(id) {
    // Find the item to delete
    const itemToDelete = items.find(item => item.id === id)
    if (!itemToDelete) return

    // Remove from UI immediately
    setItems(items.filter(item => item.id !== id))

    // Clear any existing pending delete
    if (pendingDelete?.timeoutId) {
      clearTimeout(pendingDelete.timeoutId)
      // Execute the previous pending delete immediately
      executeDelete(pendingDelete.item.id)
    }

    // Show toast with undo option
    setToast({ message: 'Item deleted', itemId: id })

    // Set up delayed actual deletion
    const timeoutId = setTimeout(() => {
      executeDelete(id)
      setToast(null)
      setPendingDelete(null)
    }, 4000)

    setPendingDelete({ item: itemToDelete, timeoutId })
  }

  async function executeDelete(id) {
    try {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting item:', error)
      }
    } catch (err) {
      console.error('Network error:', err)
    }
  }

  function undoDelete() {
    if (!pendingDelete) return

    // Cancel the pending delete
    clearTimeout(pendingDelete.timeoutId)

    // Restore the item
    setItems(prev => [pendingDelete.item, ...prev])

    // Clear states
    setPendingDelete(null)
    setToast(null)
  }

  async function updateItem(id, updates) {
    setError(null)

    try {
      const { data, error } = await supabase
        .from('items')
        .update(updates)
        .eq('id', id)
        .select()

      if (error) {
        console.error('Error updating item:', error)
        setError('Failed to update item')
        return false
      }

      setItems(items.map(item => item.id === id ? data[0] : item))
      setEditingItem(null)
      return true
    } catch (err) {
      console.error('Network error:', err)
      setError('Network error - please try again')
      return false
    }
  }

  // Complete a recurring item - advances to next due date
  async function completeItem(id) {
    const item = items.find(i => i.id === id)
    if (!item) return false

    // If not recurring, just delete it
    if (!item.recurrence_rule) {
      deleteItem(id)
      return true
    }

    // Calculate next due date
    const nextDueDate = getNextDueDate(item.due_date, item.recurrence_rule)
    if (!nextDueDate) {
      deleteItem(id)
      return true
    }

    // Update item with new due date
    try {
      const { data, error } = await supabase
        .from('items')
        .update({ due_date: nextDueDate })
        .eq('id', id)
        .select()

      if (error) {
        console.error('Error completing item:', error)
        setError('Failed to complete item')
        return false
      }

      setItems(items.map(i => i.id === id ? data[0] : i))
      setToast({ message: `Next: ${new Date(nextDueDate).toLocaleDateString()}`, itemId: id })
      setTimeout(() => setToast(null), 2000)
      return true
    } catch (err) {
      console.error('Network error:', err)
      setError('Network error - please try again')
      return false
    }
  }

  async function createFolder(name, parentId = null) {
    try {
      const maxPosition = folders
        .filter(f => f.parent_id === parentId)
        .reduce((max, f) => Math.max(max, f.position || 0), -1)

      const { data, error } = await supabase
        .from('folders')
        .insert([{
          name,
          parent_id: parentId,
          user_id: session.user.id,
          position: maxPosition + 1
        }])
        .select()

      if (error) {
        console.error('Error creating folder:', error)
        setError('Failed to create folder')
        return false
      }

      setFolders([...folders, data[0]])
      return true
    } catch (err) {
      console.error('Network error:', err)
      setError('Network error - please try again')
      return false
    }
  }

  async function deleteFolder(id) {
    try {
      const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting folder:', error)
        setError('Failed to delete folder')
      } else {
        // Remove folder and all children from state
        const idsToRemove = new Set([id])
        let changed = true
        while (changed) {
          changed = false
          folders.forEach(f => {
            if (f.parent_id && idsToRemove.has(f.parent_id) && !idsToRemove.has(f.id)) {
              idsToRemove.add(f.id)
              changed = true
            }
          })
        }
        setFolders(folders.filter(f => !idsToRemove.has(f.id)))
        // Items with folder_id pointing to deleted folders get folder_id = null (handled by DB)
        setItems(items.map(item =>
          idsToRemove.has(item.folder_id) ? { ...item, folder_id: null } : item
        ))
      }
    } catch (err) {
      console.error('Network error:', err)
      setError('Network error - please try again')
    }
  }

  async function toggleFolderShare(id) {
    const folder = folders.find(f => f.id === id)
    if (!folder) return null

    try {
      // If making public, generate a share_id if not exists
      const isPublic = !folder.is_public
      const shareId = isPublic && !folder.share_id
        ? Math.random().toString(36).substring(2, 10)
        : folder.share_id

      const { data, error } = await supabase
        .from('folders')
        .update({ is_public: isPublic, share_id: shareId })
        .eq('id', id)
        .select()

      if (error) {
        console.error('Error sharing folder:', error)
        setError('Failed to share folder')
        return null
      }

      setFolders(folders.map(f => f.id === id ? data[0] : f))
      return data[0]
    } catch (err) {
      console.error('Network error:', err)
      setError('Network error - please try again')
      return null
    }
  }

  async function moveItemToFolder(itemId, folderId) {
    try {
      const { error } = await supabase
        .from('items')
        .update({ folder_id: folderId })
        .eq('id', itemId)

      if (error) {
        console.error('Error moving item:', error)
        setError('Failed to move item')
      } else {
        setItems(items.map(item =>
          item.id === itemId ? { ...item, folder_id: folderId } : item
        ))
      }
    } catch (err) {
      console.error('Network error:', err)
      setError('Network error - please try again')
    }
  }

  async function toggleWatched(itemId, watched) {
    try {
      const { error } = await supabase
        .from('items')
        .update({ watched })
        .eq('id', itemId)

      if (error) {
        console.error('Error updating watched status:', error)
        setError('Failed to update')
      } else {
        setItems(items.map(item =>
          item.id === itemId ? { ...item, watched } : item
        ))
      }
    } catch (err) {
      console.error('Network error:', err)
      setError('Network error - please try again')
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    setItems([])
    setFolders([])
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  // Allow shared folder view without authentication
  const isSharedRoute = window.location.pathname.startsWith('/shared/')
  if (isSharedRoute) {
    return (
      <div className="app-wrapper">
        <div className="app shared-view">
          <Routes>
            <Route path="/shared/:shareId" element={<SharedFolderPage />} />
          </Routes>
        </div>
      </div>
    )
  }

  if (!session) {
    return <Auth />
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
    <div className="app-wrapper">
      <div className="app">
        <header className="header">
          <h1>LearnLater</h1>
          <button className="hamburger-btn" onClick={() => setMenuOpen(true)}>
            ☰
          </button>
        </header>

        {error && (
          <div className="error-banner" style={{
            background: '#ff3b30',
            color: 'white',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '16px',
            textAlign: 'center'
          }}>
            {error}
            <button
              onClick={() => setError(null)}
              style={{ marginLeft: '12px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
        )}

        <main>
          <Routes>
            <Route
              path="/"
              element={
                <InboxPage
                  items={items}
                  folders={folders}
                  onAdd={addItem}
                  onDelete={deleteItem}
                  onComplete={completeItem}
                  onMoveToFolder={moveItemToFolder}
                  onRefresh={fetchItems}
                  onEdit={setEditingItem}
                />
              }
            />
            <Route
              path="/library"
              element={
                <LibraryPage
                  items={items}
                  folders={folders}
                  onCreateFolder={createFolder}
                  onDeleteFolder={deleteFolder}
                  onDeleteItem={deleteItem}
                  onAddItem={addItem}
                  onShareFolder={toggleFolderShare}
                />
              }
            />
            <Route
              path="/watch"
              element={
                <WatchListPage
                  items={items}
                  onAdd={addItem}
                  onDelete={deleteItem}
                  onEdit={setEditingItem}
                  onToggleWatched={toggleWatched}
                />
              }
            />
            <Route
              path="/projects"
              element={
                <ProjectsPage
                  items={items}
                  onAdd={addItem}
                  onDelete={deleteItem}
                  onUpdate={updateItem}
                  onEdit={setEditingItem}
                />
              }
            />
            <Route
              path="/books"
              element={
                <BooksPage
                  items={items}
                  onAdd={addItem}
                  onDelete={deleteItem}
                  onUpdate={updateItem}
                />
              }
            />
            <Route
              path="/countdowns"
              element={
                <CountdownPage
                  items={items}
                  onAdd={addItem}
                  onDelete={deleteItem}
                />
              }
            />
            <Route
              path="/share"
              element={
                <ShareHandler
                  onAdd={addItem}
                  isReady={!!session}
                />
              }
            />
          </Routes>
        </main>

        <BottomNav />

        <FloatingAddButton onAdd={setAddItemType} />
      </div>

      {/* Add Item Modal from FAB */}
      {addItemType && (
        <AddItem
          onAdd={addItem}
          initialType={addItemType}
          onClose={() => setAddItemType(null)}
          allTags={allTags}
        />
      )}

      {/* Undo Toast */}
      {toast && (
        <div className="toast">
          <span>{toast.message}</span>
          <button onClick={undoDelete}>Undo</button>
        </div>
      )}

      {/* Edit Modal */}
      {editingItem && (
        <EditItem
          item={editingItem}
          onSave={updateItem}
          onClose={() => setEditingItem(null)}
          allTags={allTags}
        />
      )}

      {/* Menu Overlay */}
      <MenuOverlay
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        onSignOut={handleSignOut}
      />
    </div>
    </DndContext>
  )
}

export default App
