import { useState, useEffect } from 'react'
import { vibrate } from '../utils'

// Smart countdown display
function formatCountdown(targetDate) {
  if (!targetDate) {
    return { text: 'No date set', status: 'passed' }
  }

  const now = new Date()
  const target = new Date(targetDate)
  const diff = target - now

  if (isNaN(diff) || diff <= 0) {
    return { text: 'Event passed!', status: 'passed' }
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  let text = ''
  let status = 'normal'

  if (days > 7) {
    // More than a week: show days and hours
    text = `${days}d ${hours}h`
  } else if (days > 0) {
    // Less than a week but more than a day
    text = `${days}d ${hours}h ${minutes}m`
    status = days <= 3 ? 'soon' : 'normal'
  } else if (hours > 0) {
    // Less than a day
    text = `${hours}h ${minutes}m ${seconds}s`
    status = 'very-soon'
  } else {
    // Less than an hour
    text = `${minutes}m ${seconds}s`
    status = 'imminent'
  }

  return { text, status, days, hours, minutes, seconds }
}

export default function CountdownPage({ items, onAdd, onDelete }) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [title, setTitle] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [targetTime, setTargetTime] = useState('')
  const [loading, setLoading] = useState(false)
  const [, setTick] = useState(0)

  // Filter countdown items
  const countdowns = (items || []).filter(item => item.type === 'countdown')
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))

  // Update every second for live countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim() || !targetDate || loading) return

    setLoading(true)
    vibrate(10)

    // Combine date and time
    const dateTimeString = targetTime
      ? `${targetDate}T${targetTime}`
      : `${targetDate}T00:00:00`

    const newItem = {
      type: 'countdown',
      title: title.trim(),
      due_date: dateTimeString,
    }

    const success = await onAdd(newItem)

    if (success) {
      setTitle('')
      setTargetDate('')
      setTargetTime('')
      setShowAddForm(false)
    }

    setLoading(false)
  }

  function handleDelete(id) {
    vibrate(10)
    onDelete(id)
  }

  return (
    <div className="countdown-page">
      <div className="countdown-header">
        <h2>Countdowns</h2>
        <button
          className="add-countdown-btn"
          onClick={() => {
            vibrate(5)
            setShowAddForm(!showAddForm)
          }}
        >
          {showAddForm ? '×' : '+'}
        </button>
      </div>

      {showAddForm && (
        <form className="add-countdown-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Event name"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
          />

          <div className="datetime-inputs">
            <div className="date-input-group">
              <label>Date</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                required
              />
            </div>
            <div className="time-input-group">
              <label>Time (optional)</label>
              <input
                type="time"
                value={targetTime}
                onChange={(e) => setTargetTime(e.target.value)}
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={() => setShowAddForm(false)}>
              Cancel
            </button>
            <button type="submit" disabled={loading || !title.trim() || !targetDate}>
              {loading ? 'Adding...' : 'Add'}
            </button>
          </div>
        </form>
      )}

      {countdowns.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">⏱️</div>
          <h3>No countdowns yet</h3>
          <p>Add events you're counting down to!</p>
        </div>
      ) : (
        <div className="countdown-list">
          {countdowns.map(item => {
            const countdown = formatCountdown(item.due_date)
            const targetDateObj = new Date(item.due_date)
            const dateStr = targetDateObj.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: targetDateObj.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
            })
            const timeStr = targetDateObj.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit'
            })

            return (
              <div key={item.id} className={`countdown-card ${countdown.status}`}>
                <div className="countdown-info">
                  <h3 className="countdown-title">{item.title}</h3>
                  <p className="countdown-target">{dateStr} at {timeStr}</p>
                </div>
                <div className="countdown-display">
                  <span className="countdown-time">{countdown.text}</span>
                </div>
                <button
                  className="delete-countdown-btn"
                  onClick={() => handleDelete(item.id)}
                  aria-label="Delete countdown"
                >
                  ×
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
