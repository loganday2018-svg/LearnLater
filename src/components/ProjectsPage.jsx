import { useState } from 'react'
import { vibrate } from '../utils'

const CATEGORIES = ['personal', 'work', 'dad']

export default function ProjectsPage({ items, onAdd, onDelete, onUpdate }) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('personal')
  const [loading, setLoading] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('personal')

  // Filter project items
  let projects = items.filter(item => item.type === 'project')

  // Apply category filter
  projects = projects.filter(p => (p.category || 'personal') === categoryFilter)

  // Sort by created date, newest first
  projects = [...projects].sort((a, b) =>
    new Date(b.created_at) - new Date(a.created_at)
  )

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
        <div className="projects-list">
          {projects.map(project => (
            <div
              key={project.id}
              className={`project-card ${project.completed ? 'completed' : ''}`}
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
                  {project.title}
                </h3>
                {project.content && (
                  <p className="project-description">{project.content}</p>
                )}
              </div>

              <button
                className="delete-btn"
                onClick={() => {
                  vibrate(10)
                  onDelete(project.id)
                }}
                aria-label="Delete"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
