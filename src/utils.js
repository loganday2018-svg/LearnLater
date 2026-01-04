// Haptic feedback helper
export function vibrate(pattern = 10) {
  if (navigator.vibrate) {
    navigator.vibrate(pattern)
  }
}

// Named haptic patterns for different actions
export const haptics = {
  light: () => vibrate(5),           // Subtle tap - toggles, selections
  medium: () => vibrate(10),         // Standard tap - buttons, actions
  heavy: () => vibrate(20),          // Strong tap - important actions
  success: () => vibrate([10, 50, 10]), // Double tap - completions
  error: () => vibrate([50, 30, 50]),   // Warning pattern - errors, deletes
  drag: () => vibrate(8),            // Drag start
  drop: () => vibrate(15),           // Drop/release
}

// Format date for display
export function formatDate(dateString) {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ''
    const now = new Date()
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  } catch {
    return ''
  }
}

// Extract hostname from URL
export function getHostname(urlString) {
  try {
    return new URL(urlString).hostname
  } catch {
    return urlString
  }
}

// Truncate text with ellipsis
export function truncate(text, maxLength) {
  if (!text || text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// Share items using Web Share API or copy to clipboard
export async function shareItems(title, items, formatFn) {
  const text = formatFn(items)

  // Try Web Share API first (mobile)
  if (navigator.share) {
    try {
      await navigator.share({
        title,
        text
      })
      return { success: true, method: 'share' }
    } catch (err) {
      // User cancelled or share failed
      if (err.name !== 'AbortError') {
        console.error('Share failed:', err)
      }
    }
  }

  // Fallback to clipboard
  try {
    await navigator.clipboard.writeText(text)
    return { success: true, method: 'clipboard' }
  } catch (err) {
    console.error('Clipboard failed:', err)
    return { success: false }
  }
}

// Format inbox items for sharing
export function formatInboxForShare(items) {
  if (items.length === 0) return 'No items to share'

  let text = '📥 My Saved Items\n'
  text += '─'.repeat(20) + '\n\n'

  items.forEach(item => {
    const icon = item.type === 'link' ? '🔗' : item.type === 'image' ? '🖼️' : '📝'
    text += `${icon} ${item.title}\n`
    if (item.url) text += `   ${item.url}\n`
    if (item.due_date) text += `   📅 Due: ${item.due_date}\n`
    text += '\n'
  })

  text += `\nShared from LearnLater`
  return text
}

// Format watch list for sharing
export function formatWatchListForShare(items) {
  if (items.length === 0) return 'No items to share'

  let text = '🎬 Watch List\n'
  text += '─'.repeat(20) + '\n\n'

  const unwatched = items.filter(i => !i.watched)
  const watched = items.filter(i => i.watched)

  if (unwatched.length > 0) {
    text += 'To Watch:\n'
    unwatched.forEach(item => {
      const icon = item.type === 'movie' ? '🎬' : item.type === 'youtube' ? '▶️' : '📺'
      text += `○ ${icon} ${item.title}\n`
      if (item.content) text += `   ${item.content}\n`
    })
    text += '\n'
  }

  if (watched.length > 0) {
    text += 'Watched:\n'
    watched.forEach(item => {
      const icon = item.type === 'movie' ? '🎬' : item.type === 'youtube' ? '▶️' : '📺'
      text += `✓ ${icon} ${item.title}\n`
    })
  }

  text += `\nShared from LearnLater`
  return text
}

// Fetch link preview metadata
export async function fetchLinkPreview(url) {
  try {
    const response = await fetch(
      'https://lotzqnyejcnadoljgkvf.supabase.co/functions/v1/fetch-link-preview',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch preview')
    }

    return await response.json()
  } catch (err) {
    console.error('Link preview error:', err)
    return null
  }
}

// Calculate next due date based on recurrence rule
export function getNextDueDate(currentDueDate, recurrenceRule) {
  if (!recurrenceRule || !currentDueDate) return null

  // Parse current date
  let current
  if (currentDueDate.includes('T')) {
    current = new Date(currentDueDate)
  } else {
    current = new Date(currentDueDate + 'T00:00:00')
  }

  const { type, interval = 1, weekdays } = recurrenceRule

  switch (type) {
    case 'daily':
      current.setDate(current.getDate() + interval)
      break

    case 'weekly':
      if (weekdays && weekdays.length > 0) {
        // Find next matching weekday
        let found = false
        for (let i = 1; i <= 7 * interval; i++) {
          const checkDate = new Date(current)
          checkDate.setDate(checkDate.getDate() + i)
          if (weekdays.includes(checkDate.getDay())) {
            current = checkDate
            found = true
            break
          }
        }
        if (!found) {
          current.setDate(current.getDate() + 7 * interval)
        }
      } else {
        current.setDate(current.getDate() + 7 * interval)
      }
      break

    case 'monthly':
      current.setMonth(current.getMonth() + interval)
      break

    case 'yearly':
      current.setFullYear(current.getFullYear() + interval)
      break

    default:
      return null
  }

  // Return as YYYY-MM-DD string
  return current.toISOString().split('T')[0]
}

// Get recurrence description text
export function getRecurrenceText(recurrenceRule) {
  if (!recurrenceRule) return null

  const { type, interval = 1, weekdays } = recurrenceRule
  const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  switch (type) {
    case 'daily':
      return interval === 1 ? 'Daily' : `Every ${interval} days`
    case 'weekly':
      if (weekdays && weekdays.length > 0) {
        const dayNames = weekdays.map(d => WEEKDAYS[d]).join(', ')
        return interval === 1 ? `${dayNames}` : `Every ${interval} weeks (${dayNames})`
      }
      return interval === 1 ? 'Weekly' : `Every ${interval} weeks`
    case 'monthly':
      return interval === 1 ? 'Monthly' : `Every ${interval} months`
    case 'yearly':
      return interval === 1 ? 'Yearly' : `Every ${interval} years`
    default:
      return null
  }
}

// Format books for sharing
export function formatBooksForShare(items) {
  if (items.length === 0) return 'No books to share'

  let text = '📚 Reading List\n'
  text += '─'.repeat(20) + '\n\n'

  const wantToRead = items.filter(i => i.reading_status === 'want_to_read')
  const reading = items.filter(i => i.reading_status === 'reading')
  const finished = items.filter(i => i.reading_status === 'finished')

  if (wantToRead.length > 0) {
    text += 'Want to Read:\n'
    wantToRead.forEach(item => {
      text += `○ ${item.title}`
      if (item.author) text += ` by ${item.author}`
      text += '\n'
    })
    text += '\n'
  }

  if (reading.length > 0) {
    text += 'Currently Reading:\n'
    reading.forEach(item => {
      text += `📖 ${item.title}`
      if (item.author) text += ` by ${item.author}`
      text += '\n'
    })
    text += '\n'
  }

  if (finished.length > 0) {
    text += 'Finished:\n'
    finished.forEach(item => {
      text += `✓ ${item.title}`
      if (item.author) text += ` by ${item.author}`
      text += '\n'
    })
  }

  text += `\nShared from LearnLater`
  return text
}
