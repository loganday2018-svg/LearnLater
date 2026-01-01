import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { DndContext, TouchSensor, MouseSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core'
import { supabase } from './supabaseClient'
import Auth from './components/Auth'
import BottomNav from './components/BottomNav'
import InboxPage from './components/InboxPage'
import LibraryPage from './components/LibraryPage'
import ShareHandler from './components/ShareHandler'
import EditItem from './components/EditItem'
import './App.css'

function App() {
  const [session, setSession] = useState(null)
  const [items, setItems] = useState([])
  const [folders, setFolders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeItem, setActiveItem] = useState(null)
  const [toast, setToast] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [editingItem, setEditingItem] = useState(null)

  // Touch sensor with 300ms delay to prevent accidental drags
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 300,
      tolerance: 5
    }
  })

  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 10
    }
  })

  const sensors = useSensors(touchSensor, mouseSensor)

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

  function handleDragStart(event) {
    const { active } = event
    if (active.data.current?.type === 'item') {
      setActiveItem(active.data.current.item)
    }
  }

  function handleDragEnd(event) {
    const { active, over } = event
    setActiveItem(null)

    if (!over) return

    if (active.data.current?.type === 'item' && over.data.current?.type === 'folder') {
      const itemId = active.data.current.item.id
      const folderId = over.data.current.folderId
      moveItemToFolder(itemId, folderId)
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

  if (!session) {
    return <Auth />
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="app">
        <header className="header">
          <h1>LearnLater</h1>
          <button className="sign-out-btn" onClick={handleSignOut}>
            Sign Out
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
      </div>

      <DragOverlay>
        {activeItem && (
          <div className={`item-card ${activeItem.type} dragging-overlay`}>
            <span className="card-type">{activeItem.type === 'link' ? '🔗' : '📝'}</span>
            <h3 className="card-title">{activeItem.title}</h3>
          </div>
        )}
      </DragOverlay>

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
        />
      )}
    </DndContext>
  )
}

export default App
