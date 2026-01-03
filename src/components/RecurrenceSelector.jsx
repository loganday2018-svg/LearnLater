import { useState, useEffect } from 'react'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function RecurrenceSelector({ value, onChange, disabled = false }) {
  const [isOpen, setIsOpen] = useState(false)
  const [type, setType] = useState(value?.type || 'none')
  const [interval, setInterval] = useState(value?.interval || 1)
  const [weekdays, setWeekdays] = useState(value?.weekdays || [])

  // Update parent when values change
  useEffect(() => {
    if (type === 'none') {
      onChange(null)
    } else {
      const rule = { type, interval }
      if (type === 'weekly' && weekdays.length > 0) {
        rule.weekdays = weekdays
      }
      onChange(rule)
    }
  }, [type, interval, weekdays, onChange])

  // Sync from parent value
  useEffect(() => {
    if (value) {
      setType(value.type || 'none')
      setInterval(value.interval || 1)
      setWeekdays(value.weekdays || [])
    } else {
      setType('none')
      setInterval(1)
      setWeekdays([])
    }
  }, [value])

  function toggleWeekday(day) {
    setWeekdays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day].sort((a, b) => a - b)
    )
  }

  function getRecurrenceText() {
    if (!value || type === 'none') return 'Does not repeat'

    const intervalText = interval > 1 ? `${interval} ` : ''

    switch (type) {
      case 'daily':
        return interval === 1 ? 'Daily' : `Every ${interval} days`
      case 'weekly':
        if (weekdays.length === 0) {
          return interval === 1 ? 'Weekly' : `Every ${interval} weeks`
        }
        const dayNames = weekdays.map(d => WEEKDAYS[d]).join(', ')
        return interval === 1 ? `Weekly on ${dayNames}` : `Every ${interval} weeks on ${dayNames}`
      case 'monthly':
        return interval === 1 ? 'Monthly' : `Every ${interval} months`
      case 'yearly':
        return interval === 1 ? 'Yearly' : `Every ${interval} years`
      default:
        return 'Does not repeat'
    }
  }

  return (
    <div className="recurrence-selector">
      <button
        type="button"
        className={`recurrence-trigger ${value ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
      >
        🔄 {getRecurrenceText()}
      </button>

      {isOpen && (
        <div className="recurrence-dropdown">
          <div className="recurrence-options">
            <label className="recurrence-option">
              <input
                type="radio"
                name="recurrence-type"
                checked={type === 'none'}
                onChange={() => setType('none')}
              />
              <span>Does not repeat</span>
            </label>

            <label className="recurrence-option">
              <input
                type="radio"
                name="recurrence-type"
                checked={type === 'daily'}
                onChange={() => setType('daily')}
              />
              <span>Daily</span>
            </label>

            <label className="recurrence-option">
              <input
                type="radio"
                name="recurrence-type"
                checked={type === 'weekly'}
                onChange={() => setType('weekly')}
              />
              <span>Weekly</span>
            </label>

            <label className="recurrence-option">
              <input
                type="radio"
                name="recurrence-type"
                checked={type === 'monthly'}
                onChange={() => setType('monthly')}
              />
              <span>Monthly</span>
            </label>

            <label className="recurrence-option">
              <input
                type="radio"
                name="recurrence-type"
                checked={type === 'yearly'}
                onChange={() => setType('yearly')}
              />
              <span>Yearly</span>
            </label>
          </div>

          {type !== 'none' && (
            <div className="recurrence-details">
              <div className="interval-selector">
                <label>Every</label>
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={interval}
                  onChange={(e) => setInterval(Math.max(1, parseInt(e.target.value) || 1))}
                />
                <span>
                  {type === 'daily' && (interval === 1 ? 'day' : 'days')}
                  {type === 'weekly' && (interval === 1 ? 'week' : 'weeks')}
                  {type === 'monthly' && (interval === 1 ? 'month' : 'months')}
                  {type === 'yearly' && (interval === 1 ? 'year' : 'years')}
                </span>
              </div>

              {type === 'weekly' && (
                <div className="weekday-selector">
                  <label>On:</label>
                  <div className="weekday-buttons">
                    {WEEKDAYS.map((day, idx) => (
                      <button
                        key={day}
                        type="button"
                        className={`weekday-btn ${weekdays.includes(idx) ? 'active' : ''}`}
                        onClick={() => toggleWeekday(idx)}
                      >
                        {day[0]}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            className="recurrence-done"
            onClick={() => setIsOpen(false)}
          >
            Done
          </button>
        </div>
      )}
    </div>
  )
}
