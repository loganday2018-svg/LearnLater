import { useState, useRef, useCallback, useEffect } from 'react'
import { vibrate } from '../utils'

export default function useUndoDelete(items, onDelete, options = {}) {
  const { delay = 1500, labelField = 'title', defaultLabel = 'Item' } = options

  const [pendingDelete, setPendingDelete] = useState(null)
  const pendingDeleteTimer = useRef(null)

  const handleDeleteWithUndo = useCallback((id) => {
    vibrate(15)

    // If there's already a pending delete, execute it immediately
    if (pendingDeleteTimer.current) {
      clearTimeout(pendingDeleteTimer.current)
      if (pendingDelete) {
        onDelete(pendingDelete.id)
      }
    }

    const item = items.find(i => i.id === id)
    setPendingDelete({ id, title: item?.[labelField] || defaultLabel })

    pendingDeleteTimer.current = setTimeout(() => {
      onDelete(id)
      setPendingDelete(null)
    }, delay)
  }, [items, onDelete, pendingDelete, delay, labelField, defaultLabel])

  const handleUndoDelete = useCallback(() => {
    if (pendingDeleteTimer.current) {
      clearTimeout(pendingDeleteTimer.current)
    }
    setPendingDelete(null)
    vibrate(5)
  }, [])

  // Filter function to exclude pending delete item from lists
  const filterPendingDelete = useCallback((itemList) => {
    if (!pendingDelete) return itemList
    return itemList.filter(item => item.id !== pendingDelete.id)
  }, [pendingDelete])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pendingDeleteTimer.current) {
        clearTimeout(pendingDeleteTimer.current)
      }
    }
  }, [])

  return {
    pendingDelete,
    handleDeleteWithUndo,
    handleUndoDelete,
    filterPendingDelete
  }
}
