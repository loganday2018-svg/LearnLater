import { useState, useEffect } from 'react'

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const UNITS = [
  { value: 'daily', label: 'days' },
  { value: 'weekly', label: 'weeks' },
  { value: 'monthly', label: 'months' },
  { value: 'yearly', label: 'years' }
]

export default function RecurrenceSelector({ value, onChange, disabled = false }) {
  const [isRepeating, setIsRepeating] = useState(value?.type && value.type !== 'none')
  const [type, setType] = useState(value?.type || 'daily')
  const [interval, setInterval] = useState(value?.interval || 1)
  const [weekdays, setWeekdays] = useState(value?.weekdays || [])

  // Update parent when values change
  useEffect(() => {
    if (!isRepeating) {
      onChange(null)
    } else {
      const rule = { type, interval }
      if (type === 'weekly' && weekdays.length > 0) {
        rule.weekdays = weekdays
      }
      onChange(rule)
    }
  }, [isRepeating, type, interval, weekdays, onChange])

  // Sync from parent value
  useEffect(() => {
    if (value) {
      setIsRepeating(true)
      setType(value.type || 'daily')
      setInterval(value.interval || 1)
      setWeekdays(value.weekdays || [])
    } else {
      setIsRepeating(false)
    }
  }, [value])

  function toggleWeekday(day) {
    setWeekdays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day].sort((a, b) => a - b)
    )
  }

  function getUnitLabel() {
    const unit = UNITS.find(u => u.value === type)
    if (!unit) return 'days'
    // Handle singular/plural
    const label = unit.label
    return interval === 1 ? label.slice(0, -1) : label
  }

  return (
    <div className={`recurrence-selector-v2 ${disabled ? 'disabled' : ''}`}>
      <div className="recurrence-toggle">
        <label className={`toggle-option ${!isRepeating ? 'active' : ''}`}>
          <input
            type="radio"
            name="recurrence-toggle"
            checked={!isRepeating}
            onChange={() => setIsRepeating(false)}
            disabled={disabled}
          />
          <span className="toggle-label">One-time task</span>
        </label>
        <label className={`toggle-option ${isRepeating ? 'active' : ''}`}>
          <input
            type="radio"
            name="recurrence-toggle"
            checked={isRepeating}
            onChange={() => setIsRepeating(true)}
            disabled={disabled}
          />
          <span className="toggle-label">Repeating task</span>
        </label>
      </div>

      {isRepeating && (
        <div className="recurrence-config">
          <div className="interval-row">
            <span className="interval-label">Every</span>
            <input
              type="number"
              min="1"
              max="99"
              value={interval}
              onChange={(e) => setInterval(Math.max(1, parseInt(e.target.value) || 1))}
              disabled={disabled}
              className="interval-input"
            />
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              disabled={disabled}
              className="unit-select"
            >
              {UNITS.map(unit => (
                <option key={unit.value} value={unit.value}>
                  {interval === 1 ? unit.label.slice(0, -1) : unit.label}
                </option>
              ))}
            </select>
          </div>

          {type === 'weekly' && (
            <div className="weekday-row">
              <div className="weekday-grid">
                {WEEKDAYS.map((day, idx) => (
                  <button
                    key={day}
                    type="button"
                    className={`weekday-btn ${weekdays.includes(idx) ? 'active' : ''}`}
                    onClick={() => toggleWeekday(idx)}
                    disabled={disabled}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
