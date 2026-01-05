import { useState } from 'react'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { vibrate } from '../utils'
import useUndoDelete from '../hooks/useUndoDelete'
import SwipeableCard from './SwipeableCard'
import ExportModal from './ExportModal'

const CATEGORIES = ['personal', 'work', 'dad']

export default function ProjectsPage({ items, onAdd, onDelete, onUpdate, onEdit }) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('personal')
  const [loading, setLoading] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('personal')
  const [showExportModal, setShowExportModal] = useState(false)

  const {
    pendingDelete,
    handleDeleteWithUndo,
    handleUndoDelete,
    filterPendingDelete
  } = useUndoDelete(items, onDelete)

  // Filter project items
  let projects = items.filter(item => item.type === 'project')

  // Apply category filter
  projects = projects.filter(p => (p.category || 'personal') === categoryFilter)

  // Sort by pinned first, then sort_order, then created date
  projects = [...projects].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    if (a.sort_order != null && b.sort_order != null) {
      return a.sort_order - b.sort_order
    }
    return new Date(b.created_at) - new Date(a.created_at)
  })

  // Get IDs for SortableContext
  const projectIds = projects.map(p => p.id)

  // Handle long press for pinning
  function handleLongPress(id) {
    const project = items.find(i => i.id === id)
    if (project) {
      onUpdate(id, { pinned: !project.pinned })
    }
  }

  // Count for badges
  const allProjects = items.filter(item => item.type === 'project')
  const personalCount = allProjects.filter(p => (p.category || 'personal') === 'personal').length
  const workCount = allProjects.filter(p => p.category === 'work').length
  const dadCount = allProjects.filter(p => p.category === 'dad').length

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim() || loading) return

    setLoading(true)
    vibrate(10)

    const newProject = {
      type: 'project',
      title: title.trim(),
      content: description.trim() || null,
      category: category,
      completed: false,
    }

    const success = await onAdd(newProject)

    if (success) {
      setTitle('')
      setDescription('')
      setCategory(categoryFilter) // Default to current filter
      setShowAddForm(false)
    }

    setLoading(false)
  }

  function handleToggleComplete(project) {
    vibrate(10)
    onUpdate(project.id, { completed: !project.completed })
  }

  return (
    <div className="projects-page">
      <div className="projects-header">
        <h2>Projects</h2>
        <div className="header-actions">
          {allProjects.length > 0 && (
            <button
              className="export-pdf-btn"
              onClick={() => {
                vibrate(5)
                setShowExportModal(true)
              }}
              aria-label="Export to PDF"
            >
              PDF
            </button>
          )}
          <button
            className="add-project-btn"
            onClick={() => {
              vibrate(5)
              setShowAddForm(!showAddForm)
            }}
          >
            {showAddForm ? '×' : '+'}
          </button>
        </div>
      </div>

      {showAddForm && (
        <form className="add-project-form" onSubmit={handleSubmit}>
          <div className="category-toggle">
            <button
              type="button"
              className={category === 'personal' ? 'active' : ''}
              onClick={() => setCategory('personal')}
            >
              Personal
            </button>
            <button
              type="button"
              className={category === 'work' ? 'active' : ''}
              onClick={() => setCategory('work')}
            >
              Work
            </button>
            <button
              type="button"
              className={category === 'dad' ? 'active' : ''}
              onClick={() => setCategory('dad')}
            >
              Dad
            </button>
          </div>

          <input
            type="text"
            placeholder="Project name"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
          />

          <textarea
            placeholder="Description or goals (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />

          <div className="form-actions">
            <button type="button" onClick={() => setShowAddForm(false)}>
              Cancel
            </button>
            <button type="submit" disabled={loading || !title.trim()}>
              {loading ? 'Adding...' : 'Add Project'}
            </button>
          </div>
        </form>
      )}

      {/* Category filters */}
      <div className="projects-filters">
        <button
          className={categoryFilter === 'personal' ? 'active' : ''}
          onClick={() => setCategoryFilter('personal')}
        >
          Personal ({personalCount})
        </button>
        <button
          className={categoryFilter === 'work' ? 'active' : ''}
          onClick={() => setCategoryFilter('work')}
        >
          Work ({workCount})
        </button>
        <button
          className={categoryFilter === 'dad' ? 'active' : ''}
          onClick={() => setCategoryFilter('dad')}
        >
          Dad ({dadCount})
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h3>No {categoryFilter} projects yet</h3>
          <p>Add projects to track your goals and ideas!</p>
        </div>
      ) : (
        <SortableContext items={projectIds} strategy={verticalListSortingStrategy}>
          <div className="projects-list">
            {filterPendingDelete(projects).map((project, index) => (
              <SwipeableCard
                key={project.id}
                id={project.id}
                onDelete={handleDeleteWithUndo}
                onLongPress={handleLongPress}
                className={`project-card-inner ${project.completed ? 'completed' : ''} ${project.pinned ? 'pinned' : ''}`}
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <button
                  className="project-toggle"
                  onClick={() => handleToggleComplete(project)}
                  aria-label={project.completed ? 'Mark as active' : 'Mark as complete'}
                >
                  {project.completed ? '✓' : '○'}
                </button>

                <div className="project-content">
                  <h3 className={project.completed ? 'strikethrough' : ''}>
                    {project.pinned && <span className="pin-icon">📌</span>}
                    {project.title}
                  </h3>
                  {project.content && (
                    <p className="project-description">{project.content}</p>
                  )}
                </div>

                <button
                  className="edit-btn"
                  onClick={() => {
                    vibrate(5)
                    onEdit(project)
                  }}
                  aria-label="Edit"
                >
                  ✎
                </button>
              </SwipeableCard>
            ))}
          </div>
        </SortableContext>
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
          items={projects}
          tabName="Projects"
          onClose={() => setShowExportModal(false)}
        />
      )}
    </div>
  )
}
